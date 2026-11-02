import { describe, expect, it } from "vitest";

import {
  isDeleteConfirmed,
  registerSchema,
  signInSchema,
} from "@/lib/validations/auth";

describe("signInSchema", () => {
  it("trims and lowercases the email", () => {
    const result = signInSchema.parse({
      email: "  Demo@DevLore.io ",
      password: "secret",
    });
    expect(result.email).toBe("demo@devlore.io");
  });

  it("rejects an invalid email", () => {
    const result = signInSchema.safeParse({ email: "nope", password: "x" });
    expect(result.success).toBe(false);
  });
});

describe("registerSchema", () => {
  const valid = {
    name: "Demo",
    email: "demo@devlore.io",
    password: "password123",
    confirmPassword: "password123",
  };

  it("accepts a valid registration", () => {
    expect(registerSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects passwords shorter than 8 or longer than 72 characters", () => {
    for (const password of ["short", "a".repeat(73)]) {
      const result = registerSchema.safeParse({
        ...valid,
        password,
        confirmPassword: password,
      });
      expect(result.success).toBe(false);
    }
  });

  it("reports mismatched passwords on confirmPassword", () => {
    const result = registerSchema.safeParse({
      ...valid,
      confirmPassword: "different123",
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(["confirmPassword"]);
  });
});

describe("isDeleteConfirmed", () => {
  it("accepts the confirmation word with surrounding whitespace", () => {
    expect(isDeleteConfirmed(" delete ")).toBe(true);
  });

  it("rejects other values", () => {
    expect(isDeleteConfirmed("DELETE")).toBe(false);
    expect(isDeleteConfirmed("")).toBe(false);
    expect(isDeleteConfirmed(undefined)).toBe(false);
  });
});
