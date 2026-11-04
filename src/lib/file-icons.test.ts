import {
  FileCodeIcon,
  FileCogIcon,
  FileIcon,
  FileJsonIcon,
  FileSpreadsheetIcon,
  FileTextIcon,
} from "lucide-react";
import { describe, expect, it } from "vitest";

import { getFileIcon } from "@/lib/file-icons";

describe("getFileIcon", () => {
  it.each([
    ["report.pdf", FileTextIcon],
    ["notes.txt", FileTextIcon],
    ["README.md", FileTextIcon],
    ["package.json", FileJsonIcon],
    ["feed.xml", FileCodeIcon],
    ["config.yaml", FileCogIcon],
    ["docker-compose.yml", FileCogIcon],
    ["pyproject.toml", FileCogIcon],
    ["settings.ini", FileCogIcon],
    ["data.csv", FileSpreadsheetIcon],
  ])("maps %s to its icon", (fileName, icon) => {
    expect(getFileIcon(fileName)).toBe(icon);
  });

  it("ignores extension case", () => {
    expect(getFileIcon("REPORT.PDF")).toBe(FileTextIcon);
  });

  it("falls back to the generic file icon", () => {
    expect(getFileIcon("archive.zip")).toBe(FileIcon);
    expect(getFileIcon("Makefile")).toBe(FileIcon);
    expect(getFileIcon(null)).toBe(FileIcon);
  });
});
