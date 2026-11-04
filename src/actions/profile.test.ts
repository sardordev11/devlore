import bcrypt from "bcryptjs";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { auth, signOut } from "@/auth";
import { prisma } from "@/lib/prisma";
import { deleteFile } from "@/lib/r2";
import { checkRateLimit } from "@/lib/rate-limit";
import { changePassword, deleteAccount } from "@/actions/profile";

vi.mock("@/auth", () => ({ auth: vi.fn(), signOut: vi.fn() }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findUnique: vi.fn(), update: vi.fn(), delete: vi.fn() },
    item: { findMany: vi.fn() },
    verificationToken: { deleteMany: vi.fn() },
  },
}));
vi.mock("@/lib/r2", () => ({
  getFileKey: (url: string) =>
    url.startsWith("https://files.example.com/")
      ? url.slice("https://files.example.com/".length)
      : null,
  deleteFile: vi.fn(),
}));
vi.mock("@/lib/rate-limit", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/rate-limit")>()),
  checkRateLimit: vi.fn(),
}));
vi.mock("bcryptjs", () => ({
  default: { compare: vi.fn(), hash: vi.fn() },
}));

// auth() is overloaded (session getter and middleware wrapper), so cast the mock
const mockAuth = vi.mocked(auth as () => Promise<unknown>);
const mockPrisma = vi.mocked(prisma, { deep: true });
const mockBcrypt = vi.mocked(bcrypt);
const mockCheckRateLimit = vi.mocked(checkRateLimit);
const mockDeleteFile = vi.mocked(deleteFile);

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
    mockCheckRateLimit.mockResolvedValue({ success: true, remaining: 4, reset: 0 });
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

  it("rate limits attempts per user before checking the password", async () => {
    mockCheckRateLimit.mockResolvedValue({
      success: false,
      remaining: 0,
      reset: Date.now() + 10 * 60 * 1000,
    });

    const result = await changePassword(input);
    expect(mockCheckRateLimit).toHaveBeenCalledWith("changePassword", "user-1");
    expect(result).toEqual({
      success: false,
      error: "Too many attempts. Please try again in 10 minutes.",
    });
    expect(mockPrisma.user.findUnique).not.toHaveBeenCalled();
    expect(mockBcrypt.compare).not.toHaveBeenCalled();
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
    mockPrisma.item.findMany.mockResolvedValue([] as never);
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

  it("removes the user's uploaded files from R2 after deleting the account", async () => {
    mockPrisma.item.findMany.mockResolvedValue([
      { fileUrl: "https://files.example.com/users/user-1/a.pdf" },
      { fileUrl: "https://files.example.com/users/user-1/b.png" },
    ] as never);
    mockPrisma.user.delete.mockResolvedValue({ email: "a@b.io" } as never);

    const result = await deleteAccount("delete");
    expect(result).toEqual({ success: true });
    expect(mockPrisma.item.findMany).toHaveBeenCalledWith({
      where: { userId: "user-1", fileUrl: { not: null } },
      select: { fileUrl: true },
    });
    expect(mockDeleteFile).toHaveBeenCalledWith("users/user-1/a.pdf");
    expect(mockDeleteFile).toHaveBeenCalledWith("users/user-1/b.png");
  });

  it("still signs out when an R2 delete fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    mockPrisma.item.findMany.mockResolvedValue([
      { fileUrl: "https://files.example.com/users/user-1/a.pdf" },
    ] as never);
    mockPrisma.user.delete.mockResolvedValue({ email: "a@b.io" } as never);
    mockDeleteFile.mockRejectedValue(new Error("r2 down"));

    const result = await deleteAccount("delete");
    expect(result).toEqual({ success: true });
    expect(signOut).toHaveBeenCalledWith({ redirectTo: "/sign-in" });
  });

  it("does not sign out when the delete fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    mockPrisma.user.delete.mockRejectedValue(new Error("db down"));

    const result = await deleteAccount("delete");
    expect(result.success).toBe(false);
    expect(signOut).not.toHaveBeenCalled();
    expect(mockDeleteFile).not.toHaveBeenCalled();
  });
});
