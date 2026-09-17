"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, CalendarPlus, LogOut, Trophy, Users } from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type WordRow = { id: number; word: string; starts_on: string; created_at: string; plays: number; wins: number };
type ScoreRow = { id: number; player_name: string; guesses: number; won: number; duration_seconds: number; completed_at: string; word: string; starts_on: string };
type AdminData = { words: WordRow[]; scores: ScoreRow[] };

function defaultMonday(words: WordRow[]) {
  const today = new Date(); const day = today.getUTCDay() || 7; today.setUTCDate(today.getUTCDate() - day + 8); today.setUTCHours(0, 0, 0, 0);
  const latest = words[0]?.starts_on ? new Date(`${words[0].starts_on}T00:00:00Z`) : null;
  if (latest && latest >= today) { latest.setUTCDate(latest.getUTCDate() + 7); return latest.toISOString().slice(0, 10); }
  return today.toISOString().slice(0, 10);
}

export function AdminPanel() {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [code, setCode] = useState(""); const [data, setData] = useState<AdminData>({ words: [], scores: [] });
  const [word, setWord] = useState(""); const [startsOn, setStartsOn] = useState(""); const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try { const response = await fetch("/api/admin/data", { cache: "no-store" }); if (response.status === 401) { setAuthenticated(false); return; } const payload = await response.json(); if (!response.ok) throw new Error(payload.error); setData(payload); setAuthenticated(true); setStartsOn((value) => value || defaultMonday(payload.words)); }
    catch (reason) { toast.error(reason instanceof Error ? reason.message : "Admin data unavailable."); setAuthenticated(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  const signIn = async (event: React.FormEvent) => { event.preventDefault(); setBusy(true); try { const response = await fetch("/api/admin/login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ code }) }); const payload = await response.json(); if (!response.ok) throw new Error(payload.error); setCode(""); await load(); toast.success("Admin access unlocked."); } catch (reason) { toast.error(reason instanceof Error ? reason.message : "Couldn’t sign in."); } finally { setBusy(false); } };
  const logout = async () => { await fetch("/api/admin/logout", { method: "POST" }); setAuthenticated(false); setData({ words: [], scores: [] }); };
  const createWord = async (event: React.FormEvent) => { event.preventDefault(); setBusy(true); try { const response = await fetch("/api/admin/words", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ word, startsOn }) }); const payload = await response.json(); if (!response.ok) throw new Error(payload.error); setWord(""); await load(); toast.success(`Puzzle for ${startsOn} scheduled.`); } catch (reason) { toast.error(reason instanceof Error ? reason.message : "Puzzle not created."); } finally { setBusy(false); } };

  const totals = useMemo(() => { const plays = data.words.reduce((sum, item) => sum + Number(item.plays), 0); const wins = data.words.reduce((sum, item) => sum + Number(item.wins), 0); return { plays, wins, rate: plays ? Math.round((wins / plays) * 100) : 0 }; }, [data.words]);

  if (authenticated === null) return <main className="admin-loading"><span className="logo-tile">W</span><p>Opening the press room…</p></main>;
  if (!authenticated) return (
    <main className="admin-login-shell">
      <a className="back-link" href="/"><ArrowLeft size={16} /> Back to puzzle</a>
      <section className="login-card"><span className="logo-tile">W</span><p className="eyebrow">PRIVATE ACCESS</p><h1>Admin press room</h1><p>Enter the access code to schedule words and see the private leaderboard.</p><form onSubmit={signIn}><label htmlFor="access-code">Access code</label><input id="access-code" type="password" value={code} onChange={(event) => setCode(event.target.value)} autoComplete="current-password" required autoFocus /><button type="submit" disabled={busy}>{busy ? "CHECKING…" : "UNLOCK ADMIN"}</button></form></section>
    </main>
  );

  return (
    <main className="admin-shell">
      <header className="admin-header"><a className="wordmark" href="/"><span className="logo-tile">W</span><span>WEEKWORD</span></a><div><span className="admin-badge">ADMIN</span><button className="text-button" type="button" onClick={logout}><LogOut size={15} /> Log out</button></div></header>
      <section className="admin-intro"><div><p className="eyebrow">CONTROL DESK</p><h1>Weekly puzzle desk</h1><p>Schedule one five-letter word per week and review every submitted result.</p></div><a className="back-link" href="/"><ArrowLeft size={16} /> Play current puzzle</a></section>
      <section className="stats-grid"><article><Users size={20} /><span>PLAYS</span><strong>{totals.plays}</strong></article><article><Trophy size={20} /><span>WIN RATE</span><strong>{totals.rate}%</strong></article><article><CalendarPlus size={20} /><span>SCHEDULED</span><strong>{data.words.length}</strong></article></section>
      <Tabs defaultValue="leaderboard" className="admin-tabs">
        <TabsList variant="line"><TabsTrigger value="leaderboard">Leaderboard</TabsTrigger><TabsTrigger value="schedule">Word schedule</TabsTrigger></TabsList>
        <TabsContent value="leaderboard">
          <section className="admin-panel"><div className="panel-heading"><div><p className="eyebrow">PRIVATE</p><h2>Player results</h2></div><span>{data.scores.length} SUBMISSIONS</span></div>
            {data.scores.length ? <Table><TableHeader><TableRow><TableHead>Player</TableHead><TableHead>Word</TableHead><TableHead>Result</TableHead><TableHead>Time</TableHead><TableHead>Finished</TableHead></TableRow></TableHeader><TableBody>{data.scores.map((score) => <TableRow key={score.id}><TableCell className="player-cell">{score.player_name}</TableCell><TableCell><span className="word-chip">{score.word}</span></TableCell><TableCell><span className={score.won ? "result-win" : "result-loss"}>{score.won ? `${score.guesses}/6` : "MISS"}</span></TableCell><TableCell>{score.duration_seconds < 60 ? `${score.duration_seconds}s` : `${Math.floor(score.duration_seconds / 60)}m ${score.duration_seconds % 60}s`}</TableCell><TableCell>{new Date(score.completed_at + (score.completed_at.endsWith("Z") ? "" : "Z")).toLocaleDateString()}</TableCell></TableRow>)}</TableBody></Table> : <div className="empty-state"><Trophy size={28} /><h3>No results yet</h3><p>Completed games will appear here with the player’s name.</p></div>}
          </section>
        </TabsContent>
        <TabsContent value="schedule">
          <div className="schedule-layout"><section className="admin-panel create-panel"><div className="panel-heading"><div><p className="eyebrow">NEXT EDITION</p><h2>Schedule a word</h2></div></div><form onSubmit={createWord}><label htmlFor="word">Five-letter word</label><input id="word" value={word} onChange={(event) => setWord(event.target.value.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 5))} pattern="[A-Za-z]{5}" maxLength={5} placeholder="CRANE" required /><label htmlFor="starts-on">Starts Monday</label><input id="starts-on" type="date" value={startsOn} onChange={(event) => setStartsOn(event.target.value)} required /><button type="submit" disabled={busy || word.length !== 5}>{busy ? "SCHEDULING…" : "SCHEDULE PUZZLE"}</button><p className="form-note">Each Monday can have one word. Players see the latest word whose start date has arrived.</p></form></section>
            <section className="admin-panel"><div className="panel-heading"><div><p className="eyebrow">ARCHIVE</p><h2>Word calendar</h2></div></div><div className="word-list">{data.words.map((item) => <article key={item.id}><time>{new Date(`${item.starts_on}T00:00:00Z`).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" })}</time><strong>{item.word}</strong><span>{item.plays} {Number(item.plays) === 1 ? "play" : "plays"} · {item.wins} wins</span></article>)}</div></section>
          </div>
        </TabsContent>
      </Tabs>
    </main>
  );
}
