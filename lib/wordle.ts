export type LetterState = "correct" | "present" | "absent";
export function scoreGuess(guess: string, answer: string): LetterState[] {
  const result: LetterState[] = Array(answer.length).fill("absent"); const remaining = answer.split("");
  guess.split("").forEach((letter, index) => { if (letter === remaining[index]) { result[index] = "correct"; remaining[index] = ""; } });
  guess.split("").forEach((letter, index) => { if (result[index] === "correct") return; const match = remaining.indexOf(letter); if (match >= 0) { result[index] = "present"; remaining[match] = ""; } });
  return result;
}
