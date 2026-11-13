import { describe, expect, it, vi } from "vitest";

import { deleteFilesByUrl, deleteFilesQuietly } from "@/lib/file-cleanup";
import { deleteFile } from "@/lib/r2";

const BASE = "https://files.example.com/";

// vi.mock is hoisted above BASE, so the factory spells the URL out
vi.mock("@/lib/r2", () => ({
  getFileKey: (url: string) =>
    url.startsWith("https://files.example.com/")
      ? url.slice("https://files.example.com/".length)
      : null,
  deleteFile: vi.fn(),
}));

const mockDeleteFile = vi.mocked(deleteFile);

describe("deleteFilesQuietly", () => {
  it("deletes every key", async () => {
    mockDeleteFile.mockResolvedValue(undefined);
    await deleteFilesQuietly(["users/u1/a.png", "users/u1/b.pdf"]);
    expect(mockDeleteFile).toHaveBeenCalledTimes(2);
    expect(mockDeleteFile).toHaveBeenCalledWith("users/u1/a.png");
    expect(mockDeleteFile).toHaveBeenCalledWith("users/u1/b.pdf");
  });

  it("logs failures without throwing and still deletes the rest", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    mockDeleteFile
      .mockRejectedValueOnce(new Error("R2 down"))
      .mockResolvedValueOnce(undefined);

    await expect(
      deleteFilesQuietly(["users/u1/a.png", "users/u1/b.pdf"]),
    ).resolves.toBeUndefined();
    expect(mockDeleteFile).toHaveBeenCalledTimes(2);
    expect(consoleError).toHaveBeenCalledWith(
      "R2 delete failed:",
      expect.any(Error),
    );
  });

  it("does nothing for an empty list", async () => {
    await deleteFilesQuietly([]);
    expect(mockDeleteFile).not.toHaveBeenCalled();
  });
});

describe("deleteFilesByUrl", () => {
  it("deletes bucket URLs and skips empty or foreign ones", async () => {
    mockDeleteFile.mockResolvedValue(undefined);
    await deleteFilesByUrl([
      `${BASE}users/u1/a.png`,
      null,
      undefined,
      "https://elsewhere.example.com/x.png",
    ]);
    expect(mockDeleteFile).toHaveBeenCalledTimes(1);
    expect(mockDeleteFile).toHaveBeenCalledWith("users/u1/a.png");
  });
});
