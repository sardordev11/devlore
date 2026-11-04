import {
  FileCodeIcon,
  FileCogIcon,
  FileIcon,
  FileJsonIcon,
  FileSpreadsheetIcon,
  FileTextIcon,
  type LucideIcon,
} from "lucide-react";

import { getFileExtension } from "@/lib/file-constraints";

const FILE_ICONS: Record<string, LucideIcon> = {
  ".pdf": FileTextIcon,
  ".txt": FileTextIcon,
  ".md": FileTextIcon,
  ".json": FileJsonIcon,
  ".xml": FileCodeIcon,
  ".yaml": FileCogIcon,
  ".yml": FileCogIcon,
  ".toml": FileCogIcon,
  ".ini": FileCogIcon,
  ".csv": FileSpreadsheetIcon,
};

export function getFileIcon(fileName: string | null): LucideIcon {
  if (!fileName) return FileIcon;
  return FILE_ICONS[getFileExtension(fileName)] ?? FileIcon;
}
