import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  chargeBillingKey,
  deleteBillingKey,
  issueBillingKey,
  TossError,
} from "@/lib/toss";

const SECRET = "test_sk_secret";
const fetchMock = vi.fn<typeof fetch>();

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function lastRequest() {
  const [url, init] = fetchMock.mock.calls.at(-1)!;
  return {
    url: String(url),
    init: init!,
    headers: init!.headers as Record<string, string>,
  };
}

const charge = {
  customerKey: "dl_customer",
  amount: 11000,
  orderId: "sub_user1_20261110",
  orderName: "DevLore Pro (Monthly)",
};

beforeEach(() => {
  vi.stubEnv("TOSS_SECRET_KEY", SECRET);
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("auth", () => {
  it("sends Basic base64(<secret>:)", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ billingKey: "bk" }));

    await issueBillingKey("auth", "dl_customer");

    const expected = Buffer.from(`${SECRET}:`).toString("base64");
    expect(lastRequest().headers.Authorization).toBe(`Basic ${expected}`);
  });

  it("throws before calling Toss when the secret is unset", async () => {
    vi.stubEnv("TOSS_SECRET_KEY", "");

    await expect(issueBillingKey("auth", "dl_customer")).rejects.toThrow(
      "TOSS_SECRET_KEY is not set",
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("issueBillingKey", () => {
  it("posts the authKey and customerKey and returns the billing", async () => {
    const billing = { billingKey: "bk", customerKey: "dl_customer", card: null };
    fetchMock.mockResolvedValue(jsonResponse(billing));

    await expect(issueBillingKey("auth", "dl_customer")).resolves.toEqual(billing);

    const { url, init } = lastRequest();
    expect(url).toBe("https://api.tosspayments.com/v1/billing/authorizations/issue");
    expect(init.method).toBe("POST");
    expect(JSON.parse(String(init.body))).toEqual({
      authKey: "auth",
      customerKey: "dl_customer",
    });
    expect(init.signal).toBeInstanceOf(AbortSignal);
  });

  it("turns an error body into a TossError", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ code: "INVALID_AUTH_KEY", message: "Bad auth key" }, 400),
    );

    const error = await issueBillingKey("auth", "dl_customer").catch((e) => e);

    expect(error).toBeInstanceOf(TossError);
    expect(error).toMatchObject({
      code: "INVALID_AUTH_KEY",
      message: "Bad auth key",
      status: 400,
    });
  });

  it("falls back to UNKNOWN for a non-JSON error", async () => {
    fetchMock.mockResolvedValue(new Response("Bad gateway", { status: 502 }));

    await expect(issueBillingKey("auth", "dl_customer")).rejects.toMatchObject({
      code: "UNKNOWN",
      status: 502,
    });
  });
});

describe("chargeBillingKey", () => {
  it("sends the orderId as the Idempotency-Key", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ status: "DONE" }));

    await chargeBillingKey("bk", charge);

    const { headers, init } = lastRequest();
    expect(headers["Idempotency-Key"]).toBe(charge.orderId);
    expect(JSON.parse(String(init.body))).toEqual(charge);
  });

  it("URL-encodes the billing key", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ status: "DONE" }));

    await chargeBillingKey("a/b+c=", charge);

    expect(lastRequest().url).toBe(
      "https://api.tosspayments.com/v1/billing/a%2Fb%2Bc%3D",
    );
  });
});

describe("deleteBillingKey", () => {
  it("sends a DELETE with no body or Idempotency-Key", async () => {
    fetchMock.mockResolvedValue(jsonResponse({}));

    await deleteBillingKey("a/b");

    const { url, init, headers } = lastRequest();
    expect(url).toBe("https://api.tosspayments.com/v1/billing/a%2Fb");
    expect(init.method).toBe("DELETE");
    expect(init.body).toBeUndefined();
    expect(headers["Idempotency-Key"]).toBeUndefined();
  });
});
