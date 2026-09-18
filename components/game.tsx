"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Delete, Settings } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { LetterState } from "@/lib/wordle";

type Puzzle = {
  id: number;
  number: string;
  startsOn: string;
  endsOn: string;
  weekLabel: string;
  weekNumber: number;
  length: number;
};
type Guess = { word: string; states: LetterState[] };
type StoredGame = {
  attemptId: string;
  guesses: Guess[];
  startedAt: number;
  finished: boolean;
  won: boolean;
};

const KEY_ROWS = ["QWERTYUIOP", "ASDFGHJKL", "ZXCVBNM"];
const priority: Record<LetterState, number> = {
  absent: 1,
  present: 2,
  correct: 3,
};

export function Game() {
  const [puzzle, setPuzzle] = useState<Puzzle | null>(null);
  const [name, setName] = useState("");
  const [draftName, setDraftName] = useState("");
  const [current, setCurrent] = useState("");
  const [guesses, setGuesses] = useState<Guess[]>([]);
  const [attemptId, setAttemptId] = useState("");
  const [startedAt, setStartedAt] = useState(Date.now());
  const [finished, setFinished] = useState(false);
  const [won, setWon] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [resultOpen, setResultOpen] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const savedName = localStorage.getItem("weekword-name") || "";
    setName(savedName);
    setDraftName(savedName);
    fetch("/api/puzzle")
      .then(async (response) => {
        const data = (await response.json()) as Puzzle & { error?: string };
        if (!response.ok) throw new Error(data.error);
        return data as Puzzle;
      })
      .then((data) => {
        setPuzzle(data);
        const stored = localStorage.getItem(`weekword-game-${data.id}`);
        if (stored) {
          const game = JSON.parse(stored) as StoredGame;
          setAttemptId(game.attemptId);
          setGuesses(game.guesses);
          setStartedAt(game.startedAt);
          setFinished(game.finished);
          setWon(game.won);
          if (game.finished) setResultOpen(true);
        } else {
          setAttemptId(crypto.randomUUID());
          setStartedAt(Date.now());
        }
      })
      .catch((reason) =>
        setError(
          reason instanceof Error
            ? reason.message
            : "The puzzle is unavailable.",
        ),
      );
  }, []);

  const persistGame = useCallback(
    (next: Omit<StoredGame, "attemptId" | "startedAt">) => {
      if (!puzzle || !attemptId) return;
      localStorage.setItem(
        `weekword-game-${puzzle.id}`,
        JSON.stringify({ ...next, attemptId, startedAt }),
      );
    },
    [attemptId, puzzle, startedAt],
  );

  const saveResult = useCallback(
    async (playerName = name, finalGuesses = guesses, finalWon = won) => {
      if (!puzzle || !playerName.trim() || saved) return false;
      try {
        const response = await fetch("/api/score", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            attemptId,
            wordId: puzzle.id,
            playerName: playerName.trim(),
            guesses: finalGuesses.length,
            won: finalWon,
            durationSeconds: Math.round((Date.now() - startedAt) / 1000),
          }),
        });
        const data = (await response.json()) as { error?: string };
        if (!response.ok) throw new Error(data.error);
        setSaved(true);
        return true;
      } catch (reason) {
        toast.error(
          reason instanceof Error ? reason.message : "Result not saved.",
        );
        return false;
      }
    },
    [attemptId, guesses, name, puzzle, saved, startedAt, won],
  );

  const submitGuess = useCallback(
    async (guessOverride?: string) => {
      if (!puzzle || finished || submitting) return false;
      const guess = (guessOverride ?? current).toUpperCase();
      if (guess.length !== puzzle.length) {
        toast.info(`Enter a ${puzzle.length}-letter word.`);
        return false;
      }
      setSubmitting(true);
      try {
        const response = await fetch("/api/puzzle", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ id: puzzle.id, guess }),
        });
        const data = (await response.json()) as {
          states?: LetterState[];
          won?: boolean;
          error?: string;
        };
        if (!response.ok || !data.states)
          throw new Error(data.error || "Guess not accepted.");
        const nextGuesses = [...guesses, { word: guess, states: data.states }];
        const nextFinished = Boolean(data.won) || nextGuesses.length >= 6;
        const nextWon = Boolean(data.won);
        setGuesses(nextGuesses);
        setCurrent("");
        setFinished(nextFinished);
        setWon(nextWon);
        persistGame({
          guesses: nextGuesses,
          finished: nextFinished,
          won: nextWon,
        });
        if (nextFinished) {
          setResultOpen(true);
          if (name.trim()) void saveResult(name, nextGuesses, nextWon);
        }
        return true;
      } catch (reason) {
        toast.error(
          reason instanceof Error ? reason.message : "Guess not accepted.",
        );
        return false;
      } finally {
        setSubmitting(false);
      }
    },
    [
      current,
      finished,
      guesses,
      name,
      persistGame,
      puzzle,
      saveResult,
      submitting,
    ],
  );

  const pressKey = useCallback(
    (key: string) => {
      if (!puzzle || finished) return;
      if (key === "ENTER") {
        void submitGuess();
        return;
      }
      if (key === "BACKSPACE" || key === "DELETE") {
        setCurrent((value) => value.slice(0, -1));
        return;
      }
      if (/^[A-Z]$/.test(key))
        setCurrent((value) =>
          value.length < puzzle.length ? value + key : value,
        );
    },
    [finished, puzzle, submitGuess],
  );

  const submitGuessRef = useRef(submitGuess);
  useEffect(() => {
    submitGuessRef.current = submitGuess;
  }, [submitGuess]);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.target as HTMLElement)?.tagName === "INPUT") return;
      const key = event.key.toUpperCase();
      if (
        /^[A-Z]$/.test(key) ||
        key === "ENTER" ||
        key === "BACKSPACE" ||
        key === "DELETE"
      ) {
        event.preventDefault();
        pressKey(key);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [pressKey]);

  useEffect(() => {
    const modelContext = (
      document as Document & {
        modelContext?: {
          registerTool: (
            tool: unknown,
            options?: { signal?: AbortSignal },
          ) => void | Promise<void>;
        };
      }
    ).modelContext;
    if (!modelContext?.registerTool) return;
    const lifecycle = new AbortController();
    void Promise.resolve(
      modelContext.registerTool(
        {
          name: "set_player_name",
          title: "Set player name",
          description:
            "Set the player name used when a completed VSA @ UVA result is added to the private leaderboard.",
          inputSchema: {
            type: "object",
            properties: {
              name: { type: "string", minLength: 1, maxLength: 28 },
            },
            required: ["name"],
            additionalProperties: false,
          },
          annotations: { readOnlyHint: false, untrustedContentHint: false },
          execute(input: unknown) {
            const value = String(
              (input as { name?: string })?.name || "",
            ).trim();
            if (!value || value.length > 28)
              throw new Error("Enter a name between 1 and 28 characters.");
            setName(value);
            setDraftName(value);
            localStorage.setItem("weekword-name", value);
            return { name: value, saved: true };
          },
        },
        { signal: lifecycle.signal },
      ),
    ).catch(() => undefined);
    void Promise.resolve(
      modelContext.registerTool(
        {
          name: "submit_weekword_guess",
          title: "Submit VSA @ UVA guess",
          description:
            "Submit one five-letter guess to the currently visible weekly puzzle.",
          inputSchema: {
            type: "object",
            properties: {
              guess: { type: "string", minLength: 5, maxLength: 5 },
            },
            required: ["guess"],
            additionalProperties: false,
          },
          annotations: { readOnlyHint: false, untrustedContentHint: false },
          async execute(input: unknown) {
            const guess = String(
              (input as { guess?: string })?.guess || "",
            ).toUpperCase();
            if (!/^[A-Z]{5}$/.test(guess))
              throw new Error("Guess must be exactly five letters.");
            setCurrent(guess);
            const submitted = await submitGuessRef.current(guess);
            if (!submitted)
              throw new Error(
                "The guess could not be submitted in the current game state.",
              );
            return { guess, submitted: true };
          },
        },
        { signal: lifecycle.signal },
      ),
    ).catch(() => undefined);
    return () => lifecycle.abort();
  }, []);

  const keyStates = useMemo(() => {
    const states: Record<string, LetterState> = {};
    guesses.forEach((guess) =>
      guess.word.split("").forEach((letter, index) => {
        const next = guess.states[index];
        if (!states[letter] || priority[next] > priority[states[letter]])
          states[letter] = next;
      }),
    );
    return states;
  }, [guesses]);

  const updateName = (value: string) => {
    setName(value);
    setDraftName(value);
    localStorage.setItem("weekword-name", value);
  };
  const saveFromDialog = async () => {
    const clean = draftName.trim();
    if (!clean) {
      toast.info("Add your name to join the leaderboard.");
      return;
    }
    updateName(clean);
    if (await saveResult(clean))
      toast.success("Your result is on the admin leaderboard.");
  };

  return (
    <main className="game-shell">
      <header className="site-header">
        <a className="wordmark" href="/" aria-label="VSA at UVA home">
          <span>VSA @ UVA</span>
        </a>
        <div className="week-label">
          <strong>{puzzle?.weekLabel ?? "LOADING"}</strong>
        </div>
        <a className="icon-button" href="/admin" aria-label="Open admin panel">
          <Settings aria-hidden="true" size={20} />
        </a>
      </header>
      <section className="player-strip" aria-label="Player name">
        <span className="eyebrow">PLAYER</span>
        <input
          value={name}
          onChange={(event) => updateName(event.target.value)}
          placeholder="Enter your name"
          aria-label="Your name"
          maxLength={28}
        />
        <span className="saved-note">Saved for the leaderboard</span>
      </section>
      <section className="game-card" aria-labelledby="puzzle-heading">
        <div className="puzzle-kicker">
          <span>PUZZLE #{puzzle?.number ?? "—"}</span>
          <span>{puzzle?.length ?? 5} LETTERS · 6 TRIES</span>
        </div>
        {error ? (
          <div className="error-panel" role="alert">
            {error}
          </div>
        ) : (
          <>
            <div className="board" aria-label="Wordle game board">
              {Array.from({ length: 6 }, (_, rowIndex) => {
                const guess = guesses[rowIndex];
                const active = rowIndex === guesses.length && !finished;
                return (
                  <div className="board-row" key={rowIndex}>
                    {Array.from(
                      { length: puzzle?.length ?? 5 },
                      (_, colIndex) => {
                        const letter =
                          guess?.word[colIndex] ??
                          (active ? current[colIndex] : "");
                        const state = guess?.states[colIndex];
                        return (
                          <span
                            className={`letter-tile ${letter ? "filled" : ""} ${state ?? ""}`}
                            key={colIndex}
                            aria-label={
                              letter
                                ? `${letter}${state ? `, ${state}` : ""}`
                                : "empty"
                            }
                          >
                            {letter}
                          </span>
                        );
                      },
                    )}
                  </div>
                );
              })}
            </div>
            <div className="keyboard" aria-label="On-screen keyboard">
              {KEY_ROWS.map((row) => (
                <div className="key-row" key={row}>
                  {row.split("").map((key) => (
                    <button
                      className={keyStates[key] ?? ""}
                      key={key}
                      type="button"
                      onClick={() => pressKey(key)}
                      aria-label={key}
                    >
                      {key}
                    </button>
                  ))}
                </div>
              ))}
              <div className="key-row key-actions">
                <button
                  type="button"
                  onClick={() => pressKey("ENTER")}
                  disabled={submitting}
                >
                  ENTER
                </button>
                <button
                  type="button"
                  onClick={() => pressKey("DELETE")}
                  aria-label="Delete"
                >
                  <Delete size={18} />
                </button>
              </div>
            </div>
          </>
        )}
      </section>
      <footer>
        <span>A new puzzle every Monday</span>
        <span>Green means right spot. Yellow means wrong spot.</span>
      </footer>
      <Dialog open={resultOpen} onOpenChange={setResultOpen}>
        <DialogContent className="result-dialog">
          <DialogHeader>
            <DialogTitle>{won ? "Brilliant solve." : "Good run."}</DialogTitle>
            <DialogDescription>
              {won
                ? `You found it in ${guesses.length} ${guesses.length === 1 ? "guess" : "guesses"}.`
                : "This week’s word got away. Come back Monday for another."}
            </DialogDescription>
          </DialogHeader>
          <div className="mini-result" aria-label="Your result">
            {guesses.map((guess, index) => (
              <div key={index}>
                {guess.states.map((state, col) => (
                  <span className={state} key={col} />
                ))}
              </div>
            ))}
          </div>
          {!saved ? (
            <div className="result-form">
              <label htmlFor="result-name">Name for the leaderboard</label>
              <input
                id="result-name"
                value={draftName}
                onChange={(event) => setDraftName(event.target.value)}
                maxLength={28}
                placeholder="Your name"
              />
              <button type="button" onClick={saveFromDialog}>
                SAVE RESULT
              </button>
            </div>
          ) : (
            <p className="saved-result">
              ✓ Result saved to the admin leaderboard
            </p>
          )}
          <button
            className="quiet-button"
            type="button"
            onClick={() => setResultOpen(false)}
          >
            <ArrowLeft size={16} /> Back to board
          </button>
        </DialogContent>
      </Dialog>
    </main>
  );
}
