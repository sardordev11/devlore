import type { BeforeMount } from "@monaco-editor/react";

import type { EditorTheme } from "@/lib/editor-preferences";

type Monaco = Parameters<BeforeMount>[0];
type ThemeData = Parameters<Monaco["editor"]["defineTheme"]>[1];

// Subtle translucent scrollbar sliders that blend into the frame, for every theme.
const SCROLLBAR_COLORS = {
  "scrollbar.shadow": "#00000000",
  "scrollbarSlider.background": "#ffffff1a",
  "scrollbarSlider.hoverBackground": "#ffffff33",
  "scrollbarSlider.activeBackground": "#ffffff4d",
};

const THEMES: Record<EditorTheme, ThemeData> = {
  "vs-dark": {
    base: "vs-dark",
    inherit: true,
    rules: [],
    colors: SCROLLBAR_COLORS,
  },
  monokai: {
    base: "vs-dark",
    inherit: true,
    rules: [
      { token: "", foreground: "f8f8f2", background: "272822" },
      { token: "comment", foreground: "75715e", fontStyle: "italic" },
      { token: "string", foreground: "e6db74" },
      { token: "keyword", foreground: "f92672" },
      { token: "number", foreground: "ae81ff" },
      { token: "constant", foreground: "ae81ff" },
      { token: "type", foreground: "66d9ef", fontStyle: "italic" },
      { token: "function", foreground: "a6e22e" },
      { token: "tag", foreground: "f92672" },
      { token: "attribute.name", foreground: "a6e22e" },
      { token: "delimiter", foreground: "f8f8f2" },
    ],
    colors: {
      ...SCROLLBAR_COLORS,
      "editor.background": "#272822",
      "editor.foreground": "#f8f8f2",
      "editor.lineHighlightBackground": "#3e3d32",
      "editor.selectionBackground": "#49483e",
      "editorCursor.foreground": "#f8f8f0",
      "editorLineNumber.foreground": "#90908a",
      "editorLineNumber.activeForeground": "#f8f8f2",
      "editorWhitespace.foreground": "#464741",
    },
  },
  "github-dark": {
    base: "vs-dark",
    inherit: true,
    rules: [
      { token: "", foreground: "e6edf3", background: "0d1117" },
      { token: "comment", foreground: "8b949e", fontStyle: "italic" },
      { token: "string", foreground: "a5d6ff" },
      { token: "keyword", foreground: "ff7b72" },
      { token: "number", foreground: "79c0ff" },
      { token: "constant", foreground: "79c0ff" },
      { token: "type", foreground: "ffa657" },
      { token: "function", foreground: "d2a8ff" },
      { token: "tag", foreground: "7ee787" },
      { token: "attribute.name", foreground: "79c0ff" },
      { token: "delimiter", foreground: "e6edf3" },
    ],
    colors: {
      ...SCROLLBAR_COLORS,
      "editor.background": "#0d1117",
      "editor.foreground": "#e6edf3",
      "editor.lineHighlightBackground": "#161b22",
      "editor.selectionBackground": "#264f78",
      "editorCursor.foreground": "#e6edf3",
      "editorLineNumber.foreground": "#6e7681",
      "editorLineNumber.activeForeground": "#e6edf3",
      "editorWhitespace.foreground": "#484f58",
    },
  },
};

// Frame background behind the editor (padding, loading skeleton) per theme.
export const THEME_FRAME_CLASSES: Record<EditorTheme, string> = {
  "vs-dark": "bg-[#1e1e1e]",
  monokai: "bg-[#272822]",
  "github-dark": "bg-[#0d1117]",
};

export function getMonacoThemeName(theme: EditorTheme) {
  return `devlore-${theme}`;
}

export const defineMonacoThemes: BeforeMount = (monaco) => {
  for (const [theme, data] of Object.entries(THEMES)) {
    monaco.editor.defineTheme(getMonacoThemeName(theme as EditorTheme), data);
  }
};
