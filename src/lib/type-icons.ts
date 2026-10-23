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
