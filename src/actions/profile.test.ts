import bcrypt from "bcryptjs";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { auth, signOut } from "@/auth";
import { prisma } from "@/lib/prisma";
import { changePassword, deleteAccount } from "@/actions/profile";

vi.mock("@/auth", () => ({ auth: vi.fn(), signOut: vi.fn() }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findUnique: vi.fn(), update: vi.fn(), delete: vi.fn() },
    verificationToken: { deleteMany: vi.fn() },
  },
}));
vi.mock("bcryptjs", () => ({
  default: { compare: vi.fn(), hash: vi.fn() },
}));

// auth() is overloaded (session getter and middleware wrapper), so cast the mock
const mockAuth = vi.mocked(auth as () => Promise<unknown>);
const mockPrisma = vi.mocked(prisma, { deep: true });
const mockBcrypt = vi.mocked(bcrypt);

function signInAs(id: string) {
  mockAuth.mockResolvedValue({ user: { id }, expires: "" });
}

describe("changePassword", () => {
  const input = {
    currentPassword: "old-password",
    password: "new-password",
    confirmPassword: "new-password",
  };

  beforeEach(() => {
    signInAs("user-1");
  });

  it("requires a session", async () => {
    mockAuth.mockResolvedValue(null);
    const result = await changePassword(input);
    expect(result).toEqual({ success: false, error: "You must be signed in" });
    expect(mockPrisma.user.findUnique).not.toHaveBeenCalled();
  });

  it("rejects invalid input", async () => {
    const result = await changePassword({ ...input, confirmPassword: "nope" });
    expect(result.success).toBe(false);
    expect(mockPrisma.user.findUnique).not.toHaveBeenCalled();
  });

  it("rejects OAuth-only users without a password", async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ passwordHash: null } as never);
    const result = await changePassword(input);
    expect(result).toEqual({
      success: false,
      error: "This account has no password to change",
    });
  });

  it("flags a wrong current password", async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ passwordHash: "hash" } as never);
    mockBcrypt.compare.mockResolvedValue(false as never);

    const result = await changePassword(input);
    expect(result.wrongPassword).toBe(true);
    expect(mockPrisma.user.update).not.toHaveBeenCalled();
  });

  it("hashes and saves the new password for the session user", async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ passwordHash: "hash" } as never);
    mockBcrypt.compare.mockResolvedValue(true as never);
    mockBcrypt.hash.mockResolvedValue("new-hash" as never);

    const result = await changePassword(input);
    expect(result).toEqual({ success: true });
    expect(mockBcrypt.hash).toHaveBeenCalledWith("new-password", 12);
    expect(mockPrisma.user.update).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: { passwordHash: "new-hash" },
    });
  });

  it("returns a friendly error when the database fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    mockPrisma.user.findUnique.mockRejectedValue(new Error("db down"));

    const result = await changePassword(input);
    expect(result).toEqual({
      success: false,
      error: "Couldn't change your password. Please try again.",
    });
  });
});

describe("deleteAccount", () => {
  beforeEach(() => {
    signInAs("user-1");
  });

  it("requires the confirmation word", async () => {
    const result = await deleteAccount("yes");
    expect(result).toEqual({ success: false, error: 'Type "delete" to confirm' });
    expect(mockPrisma.user.delete).not.toHaveBeenCalled();
  });

  it("deletes the user and their tokens, then signs out", async () => {
    mockPrisma.user.delete.mockResolvedValue({ email: "a@b.io" } as never);

    const result = await deleteAccount("delete");
    expect(result).toEqual({ success: true });
    expect(mockPrisma.user.delete).toHaveBeenCalledWith({
      where: { id: "user-1" },
      select: { email: true },
    });
    expect(mockPrisma.verificationToken.deleteMany).toHaveBeenCalledWith({
      where: { identifier: { in: ["a@b.io", "password-reset:a@b.io"] } },
    });
    expect(signOut).toHaveBeenCalledWith({ redirectTo: "/sign-in" });
  });

  it("does not sign out when the delete fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    mockPrisma.user.delete.mockRejectedValue(new Error("db down"));

    const result = await deleteAccount("delete");
    expect(result.success).toBe(false);
    expect(signOut).not.toHaveBeenCalled();
  });
});
