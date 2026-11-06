// Scores for one query word matching one field, best first.
const WORD_START_SCORE = 1;
const SUBSTRING_SCORE = 0.8;
const FUZZY_SCORE = 0.4;

// Field weights so title matches rank above type and preview matches.
const TYPE_WEIGHT = 0.9;
const PREVIEW_WEIGHT = 0.5;

// Keywords as passed to cmdk items: [title or name, type name?, preview?].
export type SearchKeywords = [string, string?, string?];

function toWords(text: string): string[] {
  return text.split(/[^a-z0-9]+/).filter(Boolean);
}

// True when every character of `query` appears in `word` in order.
function isSubsequence(query: string, word: string): boolean {
  let index = 0;
  for (const char of word) {
    if (char === query[index]) index++;
    if (index === query.length) return true;
  }
  return false;
}

// Fuzzy matching stays inside one word that starts with the same letter, so
// "dckr" finds "docker" but "test" doesn't match letters spread over "Context provider".
function scoreToken(token: string, text: string, fuzzy: boolean): number {
  if (!text.includes(token)) {
    if (!fuzzy) return 0;
    const matches = toWords(text).some(
      (word) => word.startsWith(token[0]) && isSubsequence(token, word),
    );
    return matches ? FUZZY_SCORE : 0;
  }

  const startsWord = toWords(text).some((word) => word.startsWith(token));
  return startsWord ? WORD_START_SCORE : SUBSTRING_SCORE;
}

// Every word of the search has to match the title, type name or preview.
// Previews are long, so they only match as plain substrings.
export function scoreSearchMatch(
  search: string,
  [title, typeName = "", preview = ""]: SearchKeywords,
): number {
  const tokens = search.toLowerCase().split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return 1;

  const fields = {
    title: title.toLowerCase(),
    typeName: typeName.toLowerCase(),
    preview: preview.toLowerCase(),
  };

  let total = 0;
  for (const token of tokens) {
    const score = Math.max(
      scoreToken(token, fields.title, true),
      scoreToken(token, fields.typeName, true) * TYPE_WEIGHT,
      scoreToken(token, fields.preview, false) * PREVIEW_WEIGHT,
    );
    if (score === 0) return 0;
    total += score;
  }

  return total / tokens.length;
}
