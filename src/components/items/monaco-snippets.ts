import type { BeforeMount } from "@monaco-editor/react";

import {
  JS_SNIPPETS,
  SNIPPET_LANGUAGES,
  toSnippetPreview,
} from "@/lib/code-snippets";

type Monaco = Parameters<BeforeMount>[0];
type TextModel = ReturnType<Monaco["editor"]["createModel"]>;
type Position = Parameters<TextModel["getWordUntilPosition"]>[0];

// Monaco is one shared instance, so the providers are registered only once.
let registered = false;

// Snippet suggestions ("log" → console.log(), "forof", "trycatch", ...) next
// to the TypeScript service's own keyword and API completions.
export function registerMonacoSnippets(monaco: Monaco) {
  if (registered) return;
  registered = true;

  for (const language of SNIPPET_LANGUAGES) {
    monaco.languages.registerCompletionItemProvider(language, {
      provideCompletionItems(model: TextModel, position: Position) {
        const word = model.getWordUntilPosition(position);
        const range = {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: word.startColumn,
          endColumn: word.endColumn,
        };
        return {
          suggestions: JS_SNIPPETS.map((snippet) => ({
            label: snippet.prefix,
            kind: monaco.languages.CompletionItemKind.Snippet,
            detail: snippet.description,
            documentation: toSnippetPreview(snippet.body),
            insertText: snippet.body,
            insertTextRules:
              monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            range,
          })),
        };
      },
    });
  }
}
