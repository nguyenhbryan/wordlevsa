import validWordsText from "./valid-five-letter-words.txt?raw";

const validWords = new Set(
  validWordsText
    .trim()
    .split(/\s+/)
    .map((word) => word.toUpperCase()),
);

export function isValidFiveLetterWord(word: string) {
  return validWords.has(word.trim().toUpperCase());
}
