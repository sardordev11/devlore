// Autocomplete snippets for the code editor, modelled on VS Code's built-in
// JavaScript/TypeScript snippets. Bodies use Monaco snippet syntax ($1, ${1:name}).
export interface CodeSnippet {
  prefix: string;
  description: string;
  body: string;
}

export const JS_SNIPPETS: readonly CodeSnippet[] = [
  { prefix: "log", description: "console.log", body: "console.log($1);" },
  { prefix: "warn", description: "console.warn", body: "console.warn($1);" },
  { prefix: "error", description: "console.error", body: "console.error($1);" },
  {
    prefix: "function",
    description: "Function statement",
    body: "function ${1:name}(${2:params}) {\n\t$0\n}",
  },
  {
    prefix: "afunction",
    description: "Async function statement",
    body: "async function ${1:name}(${2:params}) {\n\t$0\n}",
  },
  {
    prefix: "arrow",
    description: "Arrow function",
    body: "const ${1:name} = (${2:params}) => {\n\t$0\n};",
  },
  {
    prefix: "for",
    description: "For loop",
    body: "for (let ${1:index} = 0; ${1:index} < ${2:array}.length; ${1:index}++) {\n\tconst ${3:element} = ${2:array}[${1:index}];\n\t$0\n}",
  },
  {
    prefix: "forof",
    description: "For-of loop",
    body: "for (const ${1:item} of ${2:items}) {\n\t$0\n}",
  },
  {
    prefix: "forin",
    description: "For-in loop",
    body: "for (const ${1:key} in ${2:object}) {\n\t$0\n}",
  },
  {
    prefix: "foreach",
    description: "forEach loop",
    body: "${1:array}.forEach((${2:item}) => {\n\t$0\n});",
  },
  {
    prefix: "if",
    description: "If statement",
    body: "if (${1:condition}) {\n\t$0\n}",
  },
  {
    prefix: "ifelse",
    description: "If-else statement",
    body: "if (${1:condition}) {\n\t$2\n} else {\n\t$0\n}",
  },
  {
    prefix: "switch",
    description: "Switch statement",
    body: "switch (${1:key}) {\n\tcase ${2:value}:\n\t\t$0\n\t\tbreak;\n\n\tdefault:\n\t\tbreak;\n}",
  },
  {
    prefix: "while",
    description: "While loop",
    body: "while (${1:condition}) {\n\t$0\n}",
  },
  {
    prefix: "trycatch",
    description: "Try-catch block",
    body: "try {\n\t$1\n} catch (${2:error}) {\n\t$0\n}",
  },
  {
    prefix: "import",
    description: "Import statement",
    body: "import { $2 } from \"${1:module}\";",
  },
  {
    prefix: "settimeout",
    description: "setTimeout",
    body: "setTimeout(() => {\n\t$0\n}, ${1:delay});",
  },
  {
    prefix: "setinterval",
    description: "setInterval",
    body: "setInterval(() => {\n\t$0\n}, ${1:delay});",
  },
  {
    prefix: "promise",
    description: "New Promise",
    body: "new Promise((resolve, reject) => {\n\t$0\n});",
  },
  {
    prefix: "fetch",
    description: "Fetch JSON",
    body: "const ${1:response} = await fetch(${2:url});\nconst ${3:data} = await ${1:response}.json();",
  },
];

// Snippet body as plain code for the suggestion's preview: placeholders become
// their default text and bare tab stops disappear.
export function toSnippetPreview(body: string): string {
  return body.replace(/\$\{\d+:([^}]*)\}|\$\d+/g, (_, placeholder?: string) =>
    placeholder ?? "",
  );
}

// Monaco language ids that get the JavaScript snippets.
export const SNIPPET_LANGUAGES = ["javascript", "typescript"] as const;
