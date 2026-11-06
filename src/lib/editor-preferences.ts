import { z } from "zod";

export const EDITOR_FONT_SIZES = [12, 13, 14, 15, 16, 18, 20] as const;
export const EDITOR_TAB_SIZES = [2, 4, 8] as const;
export const EDITOR_THEMES = ["vs-dark", "monokai", "github-dark"] as const;

export type EditorTheme = (typeof EDITOR_THEMES)[number];

export const EDITOR_THEME_LABELS: Record<EditorTheme, string> = {
  "vs-dark": "VS Dark",
  monokai: "Monokai",
  "github-dark": "GitHub Dark",
};

export const editorPreferencesSchema = z.object({
  fontSize: z.literal(EDITOR_FONT_SIZES),
  tabSize: z.literal(EDITOR_TAB_SIZES),
  wordWrap: z.boolean(),
  minimap: z.boolean(),
  theme: z.enum(EDITOR_THEMES),
});

export type EditorPreferences = z.infer<typeof editorPreferencesSchema>;

export const DEFAULT_EDITOR_PREFERENCES: EditorPreferences = {
  fontSize: 13,
  tabSize: 2,
  wordWrap: true,
  minimap: false,
  theme: "vs-dark",
};

const { shape } = editorPreferencesSchema;

// Stored JSON may be null, partial or from an older version: keep the valid
// fields and fall back to the default for everything else.
const storedEditorPreferencesSchema = z
  .object({
    fontSize: shape.fontSize.catch(DEFAULT_EDITOR_PREFERENCES.fontSize),
    tabSize: shape.tabSize.catch(DEFAULT_EDITOR_PREFERENCES.tabSize),
    wordWrap: shape.wordWrap.catch(DEFAULT_EDITOR_PREFERENCES.wordWrap),
    minimap: shape.minimap.catch(DEFAULT_EDITOR_PREFERENCES.minimap),
    theme: shape.theme.catch(DEFAULT_EDITOR_PREFERENCES.theme),
  })
  .catch(DEFAULT_EDITOR_PREFERENCES);

export function parseEditorPreferences(value: unknown): EditorPreferences {
  return storedEditorPreferencesSchema.parse(value);
}
