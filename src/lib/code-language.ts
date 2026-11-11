// Common names and file extensions mapped to Monaco language ids.
const LANGUAGE_ALIASES: Record<string, string> = {
  ts: "typescript",
  tsx: "typescript",
  js: "javascript",
  jsx: "javascript",
  mjs: "javascript",
  cjs: "javascript",
  node: "javascript",
  py: "python",
  rb: "ruby",
  rs: "rust",
  golang: "go",
  kt: "kotlin",
  cs: "csharp",
  "c#": "csharp",
  "c++": "cpp",
  bash: "shell",
  sh: "shell",
  zsh: "shell",
  shellscript: "shell",
  ps: "powershell",
  ps1: "powershell",
  yml: "yaml",
  md: "markdown",
  docker: "dockerfile",
  htm: "html",
  postgres: "sql",
  postgresql: "sql",
  psql: "sql",
  mysql: "sql",
  tf: "hcl",
  terraform: "hcl",
  gql: "graphql",
  text: "plaintext",
  txt: "plaintext",
};

// Highlighting used when an item has no language: shell for commands.
export function getFallbackLanguage(typeSlug: string): string {
  return typeSlug === "commands" ? "shell" : "plaintext";
}

// Item language (free text) → Monaco language id, with a fallback when blank.
export function toMonacoLanguage(
  language: string | null | undefined,
  fallback = "plaintext",
): string {
  const normalized = language?.trim().toLowerCase();
  if (!normalized) return fallback;
  return LANGUAGE_ALIASES[normalized] ?? normalized;
}

export interface LanguageOption {
  // Monaco language id, or null for no language (type fallback).
  value: string | null;
  label: string;
}

export const NO_LANGUAGE_OPTION: LanguageOption = { value: null, label: "None" };

// Languages offered in the item form's Language select, values are Monaco ids.
export const LANGUAGE_OPTIONS: readonly LanguageOption[] = [
  { value: "typescript", label: "TypeScript" },
  { value: "javascript", label: "JavaScript" },
  { value: "python", label: "Python" },
  { value: "go", label: "Go" },
  { value: "rust", label: "Rust" },
  { value: "java", label: "Java" },
  { value: "kotlin", label: "Kotlin" },
  { value: "swift", label: "Swift" },
  { value: "csharp", label: "C#" },
  { value: "cpp", label: "C++" },
  { value: "c", label: "C" },
  { value: "php", label: "PHP" },
  { value: "ruby", label: "Ruby" },
  { value: "shell", label: "Shell" },
  { value: "powershell", label: "PowerShell" },
  { value: "sql", label: "SQL" },
  { value: "html", label: "HTML" },
  { value: "css", label: "CSS" },
  { value: "scss", label: "SCSS" },
  { value: "json", label: "JSON" },
  { value: "yaml", label: "YAML" },
  { value: "xml", label: "XML" },
  { value: "markdown", label: "Markdown" },
  { value: "dockerfile", label: "Dockerfile" },
  { value: "graphql", label: "GraphQL" },
  { value: "hcl", label: "HCL" },
  { value: "plaintext", label: "Plain text" },
];

// Stored language (free text, may be an alias like "bash") → select value.
export function getLanguageSelectValue(
  language: string | null | undefined,
): string | null {
  return toMonacoLanguage(language, "") || null;
}

// Select options, keeping a stored language that isn't in the list so editing
// an item doesn't silently drop it. noneLabel renames the empty option.
export function getLanguageOptions(
  language: string | null | undefined,
  noneLabel = NO_LANGUAGE_OPTION.label,
): LanguageOption[] {
  const value = getLanguageSelectValue(language);
  const known = LANGUAGE_OPTIONS.some((option) => option.value === value);
  const extra = value && !known ? [{ value, label: language?.trim() ?? value }] : [];
  return [{ value: null, label: noneLabel }, ...LANGUAGE_OPTIONS, ...extra];
}

// Snippets without a language get one guessed from their content. Commands
// keep their shell fallback.
export function shouldDetectLanguage(
  typeSlug: string,
  language: string | null | undefined,
): boolean {
  return typeSlug === "snippets" && !language?.trim();
}

// Label for the empty option while detection is on: "Auto (TypeScript)".
export function getAutoLanguageLabel(detected: string | null): string {
  if (!detected) return "Auto";
  const label =
    LANGUAGE_OPTIONS.find((option) => option.value === detected)?.label ?? detected;
  return `Auto (${label})`;
}
