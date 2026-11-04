import {
  CodeIcon,
  FileIcon,
  FileQuestionIcon,
  ImageIcon,
  LinkIcon,
  SparklesIcon,
  StickyNoteIcon,
  TerminalIcon,
  type LucideIcon,
} from "lucide-react";

// Maps the Lucide icon name stored on an item type to its component.
const TYPE_ICONS: Record<string, LucideIcon> = {
  Code: CodeIcon,
  Sparkles: SparklesIcon,
  StickyNote: StickyNoteIcon,
  Terminal: TerminalIcon,
  Link: LinkIcon,
  File: FileIcon,
  Image: ImageIcon,
};

export function getTypeIcon(name: string): LucideIcon {
  return TYPE_ICONS[name] ?? FileQuestionIcon;
}

// Type colors are dynamic hex values, so the tinted icon badge needs an inline style.
// The "1a" suffix is ~10% alpha.
export function getTypeTint(color: string) {
  return { backgroundColor: `${color}1a`, color };
}
