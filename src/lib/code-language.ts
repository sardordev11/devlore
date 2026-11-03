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
