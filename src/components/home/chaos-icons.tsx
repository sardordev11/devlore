import {
  AppWindowIcon,
  BookmarkIcon,
  FileTextIcon,
  TerminalIcon,
} from "lucide-react";
import type { ComponentType, SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

// Brand marks Lucide doesn't ship, simplified to a 24×24 grid.

function NotionIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" {...props}>
      <rect x="3" y="3" width="18" height="18" rx="3" fill="#fff" />
      <path
        d="M8 7.5v9M8 7.5l8 9M16 7.5v9"
        stroke="#111"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function GitHubIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" {...props}>
      <path
        fill="#f0f6fc"
        d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.7c-2.78.6-3.37-1.34-3.37-1.34-.45-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.9 1.52 2.34 1.08 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.65 0 0 .84-.27 2.75 1.02A9.6 9.6 0 0 1 12 6.84c.85 0 1.7.11 2.5.34 1.9-1.29 2.75-1.02 2.75-1.02.55 1.38.2 2.4.1 2.65.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.68-4.57 4.93.36.31.68.92.68 1.85v2.74c0 .27.18.58.69.48A10 10 0 0 0 12 2Z"
      />
    </svg>
  );
}

function SlackIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" {...props}>
      <rect x="9.5" y="2" width="3.5" height="9" rx="1.75" fill="#36c5f0" />
      <rect x="13" y="9.5" width="9" height="3.5" rx="1.75" fill="#2eb67d" />
      <rect x="11" y="13" width="3.5" height="9" rx="1.75" fill="#ecb22e" />
      <rect x="2" y="11" width="9" height="3.5" rx="1.75" fill="#e01e5a" />
    </svg>
  );
}

function VSCodeIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" {...props}>
      <path fill="#0065a9" d="M17 2.5 21.5 4.7v14.6L17 21.5 6.6 12Z" />
      <path fill="#007acc" d="M17 2.5v19L2.5 9.3l2-1.8L17 17V7L4.5 16.5l-2-1.8Z" />
      <path fill="#1f9cf0" d="M17 2.5 21.5 4.7v14.6L17 21.5Z" opacity=".9" />
    </svg>
  );
}

export interface ChaosIconDef {
  name: string;
  icon: ComponentType<IconProps>;
  // Tint for the Lucide outline icons; brand marks carry their own colors.
  className?: string;
}

export const CHAOS_ICONS: ChaosIconDef[] = [
  { name: "Notion", icon: NotionIcon },
  { name: "GitHub", icon: GitHubIcon },
  { name: "Slack", icon: SlackIcon },
  { name: "VS Code", icon: VSCodeIcon },
  { name: "Browser tabs", icon: AppWindowIcon, className: "text-indigo-300" },
  { name: "Terminal", icon: TerminalIcon, className: "text-cyan-400" },
  { name: "Text file", icon: FileTextIcon, className: "text-slate-300" },
  { name: "Bookmark", icon: BookmarkIcon, className: "text-amber-400" },
];
