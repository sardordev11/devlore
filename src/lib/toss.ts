import "server-only";

// Toss Payments billing API via plain fetch (Toss has no Node server SDK)
const TOSS_API = "https://api.tosspayments.com/v1";
// Toss says billing approval can take up to 60 seconds
const TIMEOUT_MS = 60_000;

export class TossError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "TossError";
  }
}

export interface TossBilling {
  billingKey: string;
  customerKey: string;
  card: { issuerCode: string; number: string; cardType: string } | null;
}

export interface TossPayment {
  paymentKey: string;
  orderId: string;
  // "DONE" on success; treat anything else as unpaid
  status: string;
  totalAmount: number;
  approvedAt: string;
}

export interface ChargeInput {
  customerKey: string;
  amount: number;
  orderId: string;
  orderName: string;
  customerEmail?: string;
}

interface TossRequest {
  method: "POST" | "DELETE";
  body?: unknown;
  idempotencyKey?: string;
}

function authHeader() {
  const secret = process.env.TOSS_SECRET_KEY;
  if (!secret) throw new Error("TOSS_SECRET_KEY is not set");
  // Basic auth over "<secret>:"; the trailing colon is required
  return `Basic ${Buffer.from(`${secret}:`).toString("base64")}`;
}

async function tossFetch<T>(path: string, request: TossRequest): Promise<T> {
  const response = await fetch(`${TOSS_API}${path}`, {
    method: request.method,
    headers: {
      Authorization: authHeader(),
      "Content-Type": "application/json",
      ...(request.idempotencyKey && {
        "Idempotency-Key": request.idempotencyKey,
      }),
    },
    body: request.body === undefined ? undefined : JSON.stringify(request.body),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });

  const json: unknown = await response.json().catch(() => ({}));
  if (!response.ok) {
    const { code = "UNKNOWN", message = "Toss request failed" } = json as {
      code?: string;
      message?: string;
    };
    throw new TossError(code, message, response.status);
  }
  return json as T;
}

export function issueBillingKey(authKey: string, customerKey: string) {
  return tossFetch<TossBilling>("/billing/authorizations/issue", {
    method: "POST",
    body: { authKey, customerKey },
  });
}

export function chargeBillingKey(billingKey: string, input: ChargeInput) {
  return tossFetch<TossPayment>(`/billing/${encodeURIComponent(billingKey)}`, {
    method: "POST",
    body: input,
    idempotencyKey: input.orderId,
  });
}

export function deleteBillingKey(billingKey: string) {
  return tossFetch<unknown>(`/billing/${encodeURIComponent(billingKey)}`, {
    method: "DELETE",
  });
}
