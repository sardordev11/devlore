import hljs from "highlight.js/lib/core";
import bash from "highlight.js/lib/languages/bash";
import c from "highlight.js/lib/languages/c";
import cpp from "highlight.js/lib/languages/cpp";
import csharp from "highlight.js/lib/languages/csharp";
import css from "highlight.js/lib/languages/css";
import dockerfile from "highlight.js/lib/languages/dockerfile";
import go from "highlight.js/lib/languages/go";
import graphql from "highlight.js/lib/languages/graphql";
import java from "highlight.js/lib/languages/java";
import javascript from "highlight.js/lib/languages/javascript";
import json from "highlight.js/lib/languages/json";
import kotlin from "highlight.js/lib/languages/kotlin";
import markdown from "highlight.js/lib/languages/markdown";
import php from "highlight.js/lib/languages/php";
import powershell from "highlight.js/lib/languages/powershell";
import python from "highlight.js/lib/languages/python";
import ruby from "highlight.js/lib/languages/ruby";
import rust from "highlight.js/lib/languages/rust";
import scss from "highlight.js/lib/languages/scss";
import sql from "highlight.js/lib/languages/sql";
import swift from "highlight.js/lib/languages/swift";
import typescript from "highlight.js/lib/languages/typescript";
import xml from "highlight.js/lib/languages/xml";
import yaml from "highlight.js/lib/languages/yaml";

// highlight.js language → Monaco language id (the Language select's values).
// Listed by tie-break priority: short code often scores the same in several
// grammars, and CSS/SCSS match almost anything with braces, so they go last.
const DETECTABLE_LANGUAGES = [
  { name: "typescript", definition: typescript, monaco: "typescript" },
  { name: "javascript", definition: javascript, monaco: "javascript" },
  { name: "python", definition: python, monaco: "python" },
  { name: "bash", definition: bash, monaco: "shell" },
  { name: "go", definition: go, monaco: "go" },
  { name: "rust", definition: rust, monaco: "rust" },
  { name: "java", definition: java, monaco: "java" },
  { name: "kotlin", definition: kotlin, monaco: "kotlin" },
  { name: "swift", definition: swift, monaco: "swift" },
  { name: "csharp", definition: csharp, monaco: "csharp" },
  { name: "cpp", definition: cpp, monaco: "cpp" },
  { name: "c", definition: c, monaco: "c" },
  { name: "php", definition: php, monaco: "php" },
  { name: "ruby", definition: ruby, monaco: "ruby" },
  { name: "sql", definition: sql, monaco: "sql" },
  // highlight.js reports HTML as xml; Monaco's html also covers plain XML well.
  { name: "xml", definition: xml, monaco: "html" },
  { name: "json", definition: json, monaco: "json" },
  { name: "yaml", definition: yaml, monaco: "yaml" },
  { name: "dockerfile", definition: dockerfile, monaco: "dockerfile" },
  { name: "graphql", definition: graphql, monaco: "graphql" },
  { name: "markdown", definition: markdown, monaco: "markdown" },
  { name: "powershell", definition: powershell, monaco: "powershell" },
  { name: "scss", definition: scss, monaco: "scss" },
  { name: "css", definition: css, monaco: "css" },
] as const;

// Below this highlight.js relevance the guess is mostly noise (plain prose,
// a single word), so the content stays plain text.
export const MIN_DETECTION_RELEVANCE = 3;

for (const language of DETECTABLE_LANGUAGES) {
  hljs.registerLanguage(language.name, language.definition);
}

// Best-guess Monaco language for the code, or null when unsure. Highest
// relevance wins; ties go to the language listed first.
export function detectLanguage(code: string): string | null {
  if (!code.trim()) return null;

  let best: { monaco: string; relevance: number } | null = null;
  for (const language of DETECTABLE_LANGUAGES) {
    const result = hljs.highlight(code, {
      language: language.name,
      ignoreIllegals: false,
    });
    if (result.illegal) continue;
    if (!best || result.relevance > best.relevance) {
      best = { monaco: language.monaco, relevance: result.relevance };
    }
  }

  if (!best || best.relevance < MIN_DETECTION_RELEVANCE) return null;
  return best.monaco;
}
