import "server-only";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const validWordsText = readFileSync(
  join(process.cwd(), "lib", "valid-five-letter-words.txt"),
  "utf8",
);

const validWords = new Set(
  validWordsText
    .trim()
    .split(/\s+/)
    .map((word) => word.toUpperCase()),
);

export function isValidFiveLetterWord(word: string) {
  return validWords.has(word.trim().toUpperCase());
}
