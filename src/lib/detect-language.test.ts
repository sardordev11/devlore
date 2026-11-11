import { describe, expect, it } from "vitest";

import { LANGUAGE_OPTIONS } from "@/lib/code-language";
import { detectLanguage } from "@/lib/detect-language";

describe("detectLanguage", () => {
  it.each([
    ["typescript", "const greet = (name: string): string => `Hi ${name}`;"],
    ["typescript", "interface User {\n  id: string;\n  name?: string;\n}"],
    [
      "javascript",
      "function add(a, b) {\n  return a + b;\n}\nconsole.log(add(1, 2));",
    ],
    ["python", "def add(a, b):\n    return a + b\n\nprint(add(1, 2))"],
    [
      "go",
      'package main\n\nimport "fmt"\n\nfunc main() {\n\tfmt.Println("hi")\n}',
    ],
    ["rust", 'fn main() {\n    let x: i32 = 5;\n    println!("{}", x);\n}'],
    [
      "sql",
      "SELECT id, email FROM users WHERE created_at > now() - interval '1 day';",
    ],
    ["shell", '#!/bin/bash\nfor f in *.txt; do\n  echo "$f"\ndone'],
    ["html", '<div class="card">\n  <p>Hello</p>\n</div>'],
    ["css", ".card {\n  display: flex;\n  color: red;\n}"],
    ["json", '{\n  "name": "devlore",\n  "version": 1\n}'],
    ["yaml", 'services:\n  web:\n    image: nginx\n    ports:\n      - "80:80"'],
    ["dockerfile", "FROM node:20-alpine\nWORKDIR /app\nCOPY . .\nRUN npm ci"],
  ])("detects %s", (expected, code) => {
    expect(detectLanguage(code)).toBe(expected);
  });

  it("returns null for blank content", () => {
    expect(detectLanguage("")).toBeNull();
    expect(detectLanguage("  \n ")).toBeNull();
  });

  it("returns null when the guess is too weak", () => {
    expect(detectLanguage("remember to buy milk")).toBeNull();
    expect(detectLanguage("hello")).toBeNull();
  });

  it("only returns languages offered in the Language select", () => {
    const values = new Set(LANGUAGE_OPTIONS.map((option) => option.value));
    for (const code of ["SELECT 1;", "<p>hi</p>", "x = 1\nprint(x)"]) {
      const detected = detectLanguage(code);
      if (detected) expect(values.has(detected)).toBe(true);
    }
  });
});
