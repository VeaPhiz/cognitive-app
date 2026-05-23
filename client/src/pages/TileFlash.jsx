import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

// ── Constants ──────────────────────────────────────────────────────────────────
const STATE = {
  IDLE:      "idle",
  COUNTDOWN: "countdown",
  SHOWING:   "showing",
  INPUT:     "input",
  SUCCESS:   "success",
  FAIL:      "fail",
};

const MAX_HISTORY = 10; // max attempts shown in session history (all are saved to DB, but we don't want to overwhelm the UI)
const BASE_TIME = 15; // Seconds allowed for input at level 1
const EXTRA_TIME_PER_LEVEL = 5; // Seconds added for each subsequent level
const COUNTDOWN_START = 3;
const PATTERN_STEP_MS = 650;
const MOVING_AVG_WINDOW = 10; // last N valid attempts used for average
const OUTLIER_THRESHOLD = 999999; // no meaningful outlier filtering for level-based scores
const getAllowedTime = (level) => BASE_TIME + EXTRA_TIME_PER_LEVEL * level;
const getTileGrid = (level) => BASE_TILE + EXTRA_TILE_PER_LEVEL * level; // not currently used, but could be for future difficulty scaling by grid size instead of time limit     
// ── Helpers ────────────────────────────────────────────────────────────────────
const randBetween = (min, max) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const soundFrequency = 392.0; // single click sound for all tiles
//determine grid size based on level
const getGridSize = (level) => {
    if (level <= 3) return 3;
    if (level <= 6) return 4;
    if (level <= 9) return 5;
    if (level <= 12) return 6;
    return 7;
};

//determine number of tiles to show based on level
const getTileCount = (level) => {
    return 3 + level;
};

const playTone = (audioContext, frequency, duration = 0.16) => {
  if (!audioContext) return;
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  oscillator.type = "sine";
  oscillator.frequency.value = frequency;
  oscillator.connect(gain);
  gain.connect(audioContext.destination);
  gain.gain.setValueAtTime(0.001, audioContext.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.18, audioContext.currentTime + 0.01);
  oscillator.start();
  gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration);
  oscillator.stop(audioContext.currentTime + duration + 0.02);
};

const getScoreRating = (level) => {
  if (level > 12) return { label: "Superhuman",    colorClass: "text-[var(--color-rating-superhuman)]", fillClass: "bg-[var(--color-rating-superhuman)]", emoji: "🚀" };
  if (level > 9) return { label: "Excellent",      colorClass: "text-[var(--color-rating-excellent)]", fillClass: "bg-[var(--color-rating-excellent)]", emoji: "🎯" };
  if (level > 6) return { label: "Good",           colorClass: "text-[var(--color-rating-good)]", fillClass: "bg-[var(--color-rating-good)]", emoji: "👍" };
  if (level > 3) return { label: "Average",        colorClass: "text-[var(--color-rating-average)]", fillClass: "bg-[var(--color-rating-average)]", emoji: "🙂" };
  return              { label: "Keep Training",   colorClass: "text-[var(--color-rating-keep-training)]", fillClass: "bg-[var(--color-rating-keep-training)]", emoji: "💪" };
};

const medal = (i) => ["🥇", "🥈", "🥉"][i] ?? null;

// ── Leaderboard Row ────────────────────────────────────────────────────────────
function LeaderboardRow({ row, index, isMe, unit }) {
  const unitLabel = unit === "ms" ? "ms" : "lvl";
  return (
    <div
      className={`flex items-center gap-4 px-5 py-3.5 rounded-2xl border transition-all
        ${isMe
          ? "bg-[var(--color-surface-2)] border-[var(--color-primary)] shadow-lg shadow-[rgba(0,0,0,0.2)]"
          : "bg-[var(--color-surface)] border-[var(--color-border)] hover:bg-[var(--color-surface-2)]"
        }`}
    >
      <div className="w-8 text-center shrink-0">
        {medal(index)
          ? <span className="text-xl">{medal(index)}</span>
          : <span className="text-sm font-mono text-[var(--color-text-muted)]">#{index + 1}</span>
        }
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold truncate ${isMe ? "text-[var(--color-primary)]" : "text-[var(--color-text)]"}`}>
          {row.username}
          {isMe && (
            <span className="ml-2 text-[10px] bg-[var(--color-surface-2)] text-[var(--color-primary)]
                             px-1.5 py-0.5 rounded-full font-mono">you</span>
          )}
        </p>
        <p className="text-xs text-[var(--color-text-muted)] mt-0.5">{row.attempts} attempt{row.attempts !== 1 ? "s" : ""}</p>
      </div>
      <div className="shrink-0 text-right">
        <p className={`font-mono font-bold text-base ${index === 0 ? "text-[var(--color-primary)]" : isMe ? "text-[var(--color-primary)]" : "text-[var(--color-text)]"}`}>
          {Number(row.best_score).toFixed(0)}
          <span className="text-xs font-normal text-[var(--color-text-muted)] ml-1">{unitLabel}</span>
        </p>
      </div>
    </div>
  );
}

// ── Recent Attempts ────────────────────────────────────────────────────────────
function RecentAttempts({ history }) {
  if (!history.length) {
    return (
      <div className="flex flex-col items-center justify-center py-10 gap-3 text-center">
        <span className="text-4xl opacity-30">📋</span>
        <p className="text-[var(--color-text)] text-base font-small">Your session attempts will appear here.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {history.map((entry, i) => {
        const value = entry.value ?? 0;
        const rating = getScoreRating(value);
        const barWidth = Math.max(10, Math.min(100, (value / 12) * 100));

        return (
          <div key={entry.id}
            className="flex items-center gap-4 px-4 py-3 rounded-2xl bg-[var(--color-surface-2)]/75
                       border border-[var(--color-border)]/60">
            <span className="text-[var(--color-text-faint)] text-xs font-mono w-4 shrink-0">
              {history.length - i}
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1.5">
                <span className={`text-sm font-medium ${rating.colorClass}`}>
                  {rating.label}
                </span>
              </div>
              <div className="h-1 bg-[var(--color-surface-2)] rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${rating.fillClass}`}
                  style={{ width: `${barWidth}%` }}
                />
              </div>
            </div>
            <p className="font-mono font-bold text-sm text-[var(--color-text-muted)] shrink-0">
              {value}
              <span className="text-xs text-[var(--color-text-faint)] ml-0.5">lvl</span>
            </p>
          </div>
        );
      })}
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function TileFlash() {
  const { user } = useAuth();

  const audioContextRef = useRef(null);
  const countdownRef = useRef(null);
  const showingRef = useRef(null);
  const inputTimerRef = useRef(null);
  const autoAdvanceRef = useRef(null);
  const highlightTimeoutRef = useRef(null);
  const [level, setLevel] = useState(1);

  const gridSize = getGridSize(level);
  const gridCells = Array.from({ length: gridSize * gridSize }, (_, i) => i);
  const gameSlug = "tile-flash";

  const [phase, setPhase] = useState(STATE.IDLE);
  
  const [pattern, setPattern] = useState([]);
  const [selectedTiles, setSelectedTiles] = useState(new Set());
  const [highlightedCell, setHighlightedCell] = useState(null);
  const [message, setMessage] = useState("Press Start to begin");
  const [countdown, setCountdown] = useState(COUNTDOWN_START);
  const [timeLeft, setTimeLeft] = useState(getAllowedTime(1));
  const [showCorrectOnFail, setShowCorrectOnFail] = useState(false);
  const [correctPattern, setCorrectPattern] = useState([]);

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [history, setHistory] = useState([]);
  const historyId = useRef(0);
  const [board, setBoard] = useState([]);
  const [boardLoading, setBoardLoading] = useState(false);
  const [dbHistory, setDbHistory] = useState([]);
  const [dbHistoryLoading, setDbHistoryLoading] = useState(false);
  const [unit, setUnit] = useState("lvl");

  const myBoardRow = user ? board.find((r) => r.username === user.username) : null;
  const dbAttempts = myBoardRow ? Number(myBoardRow.attempts) : 0;
  const sessionAttempts = history.length;
  const totalAttempts = dbAttempts > 0 ? dbAttempts : sessionAttempts;

  const sessionValidLevels = history.map((h) => h.value).filter((value) => value !== undefined);
  const dbValidLevels = dbHistory.map((r) => Number(r.value)).filter((value) => !Number.isNaN(value));
  const extraSession = sessionValidLevels.slice(0, Math.max(0, sessionValidLevels.length - dbValidLevels.length));
  const mergedValid = [...extraSession, ...dbValidLevels].slice(0, MOVING_AVG_WINDOW);
  const movingAvgScores = mergedValid;
  const movingAvg = movingAvgScores.length ? Math.round(movingAvgScores.reduce((a, v) => a + v, 0) / movingAvgScores.length) : null;

  const sessionBest = sessionValidLevels.length ? Math.max(...sessionValidLevels) : null;
  const dbBest = myBoardRow ? Number(myBoardRow.best_score) : null;
  const allTimePB = dbBest !== null && sessionBest !== null ? Math.max(dbBest, sessionBest) : dbBest ?? sessionBest;

  const startAudio = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioContextRef.current.state === "suspended") {
      audioContextRef.current.resume();
    }
    return audioContextRef.current;
  }, []);

  const playCellSound = useCallback((cell) => {
    const audio = startAudio();
    playTone(audio, soundFrequency);
  }, [startAudio]);

  const generatePattern = (level) => {
    const gridSize = getGridSize(level);
    const totalTiles = gridSize * gridSize;
    const tilesToMatch = Math.min(totalTiles, 3 + level);
    const pattern = new Set();
    while (pattern.size < tilesToMatch) {
        pattern.add(Math.floor(Math.random() * totalTiles));
    }
    return Array.from(pattern);
  };

  const clearTimers = useCallback(() => {
    clearTimeout(countdownRef.current);
    clearTimeout(showingRef.current);
    clearTimeout(autoAdvanceRef.current);
    clearTimeout(highlightTimeoutRef.current);
    clearInterval(inputTimerRef.current);
  }, []);

  const resetGame = useCallback(() => {
    clearTimers();
    setLevel(1);
    const firstPattern = generatePattern(1);
    setPattern(firstPattern);
    setSelectedTiles(new Set());
    setCorrectPattern([]);
    setSaved(false);
    setSaveError("");
    setPhase(STATE.COUNTDOWN);
    setCountdown(COUNTDOWN_START);
    setTimeLeft(getAllowedTime(1));
    setMessage("Get ready for level 1");
  }, [clearTimers, generatePattern]);

  const failRound = useCallback((reason) => {
    clearTimers();
    setHighlightedCell(null);
    setCorrectPattern(pattern);
    setPhase(STATE.FAIL);
    setMessage(reason);
    setHistory((prev) => [{ id: ++historyId.current, value: Math.max(0, level - 1) }, ...prev].slice(0, MAX_HISTORY));
  }, [clearTimers, level, pattern]);

  const advanceLevel = useCallback(() => {
    clearTimers();
    const nextPattern = generatePattern(level + 1);
    setPattern(nextPattern);
    setLevel((prev) => prev + 1);
    setSelectedTiles(new Set());
    setPhase(STATE.COUNTDOWN);
    setCountdown(COUNTDOWN_START);
    setTimeLeft(getAllowedTime(level + 1));
    setMessage(`Level ${level + 1} is coming up`);
  }, [clearTimers, generatePattern, level]);

  const fetchLeaderboard = useCallback(async () => {
    setBoardLoading(true);
    try {
      const { data } = await api.get("/scores/tile-flash/leaderboard");
      setBoard(data.leaderboard);
      setUnit(data.unit || "lvl");
    } catch {
      /* non-critical */
    } finally {
      setBoardLoading(false);
    }
  }, []);

  const fetchMyHistory = useCallback(async () => {
    if (!user) return;
    setDbHistoryLoading(true);
    try {
      const { data } = await api.get(`/scores/tile-flash/my-history?limit=${MOVING_AVG_WINDOW}`);
      setDbHistory(data.scores);
    } catch {
      /* non-critical */
    } finally {
      setDbHistoryLoading(false);
    }
  }, [user]);

  const saveScore = useCallback(async (value) => {
    if (!user || value <= 0) return;
    setSaving(true);
    setSaveError("");
    setSaved(false);
    try {
      await api.post("/scores/save", { game_slug: gameSlug, value });
      setSaved(true);
      fetchLeaderboard();
      fetchMyHistory();
    } catch (err) {
      setSaveError(err.response?.data?.message ?? "Could not save score.");
    } finally {
      setSaving(false);
    }
  }, [fetchLeaderboard, fetchMyHistory, user]);

  const completeRound = useCallback(() => {
    setPhase(STATE.SUCCESS);
    setMessage(`Level ${level} complete!`);
    if (user) saveScore(level);
    autoAdvanceRef.current = setTimeout(() => advanceLevel(), 1400);
  }, [advanceLevel, level, saveScore, user]);

  const handleTileClick = useCallback((cell) => {
    if (phase !== STATE.INPUT) return;

    if (!pattern.includes(cell)) {
      failRound("Wrong tile! Try again.");
      return;
    }

    playCellSound(cell);
    setHighlightedCell(cell);
    highlightTimeoutRef.current = setTimeout(() => setHighlightedCell(null), 180);

    setSelectedTiles((prev) => {
      const next = new Set(prev);
      next.add(cell);
      if (pattern.every((idx) => next.has(idx))) {
        completeRound();
      }
      return next;
    });
  }, [completeRound, failRound, phase, playCellSound, pattern]);

  useEffect(() => () => clearTimers(), [clearTimers]);

  useEffect(() => {
    if (phase !== STATE.COUNTDOWN) return;
    setMessage(`Level ${level} starts in ${COUNTDOWN_START}...`);
    setCountdown(COUNTDOWN_START);
    let current = COUNTDOWN_START;

    countdownRef.current = setInterval(() => {
      current -= 1;
      setCountdown(current);
      if (current <= 0) {
        clearInterval(countdownRef.current);
        setPhase(STATE.SHOWING);
      }
    }, 1000);

    return () => clearInterval(countdownRef.current);
  }, [level, phase]);

  useEffect(() => {
    if (phase !== STATE.SHOWING || pattern.length === 0) return;
    setMessage("Watch the pattern");

    pattern.forEach((cell) => playCellSound(cell));
    showingRef.current = setTimeout(() => {
      setPhase(STATE.INPUT);
      setSelectedTiles(new Set());
      setTimeLeft(getAllowedTime(level));
      setMessage("Tap all lit tiles in any order");
    }, PATTERN_STEP_MS * 2);

    return () => clearTimeout(showingRef.current);
  }, [level, phase, playCellSound, pattern]);

  useEffect(() => {
    if (phase !== STATE.INPUT) return;
    setTimeLeft(getAllowedTime(level));
    setMessage(`Your turn — ${getAllowedTime(level)} seconds remaining`);

    inputTimerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(inputTimerRef.current);
          failRound("Time's up! Try again.");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(inputTimerRef.current);
  }, [failRound, level, phase]);

  const handleStartClick = useCallback(() => {
    resetGame();
  }, [resetGame]);

  useEffect(() => {
    fetchLeaderboard();
    fetchMyHistory();
  }, [fetchLeaderboard, fetchMyHistory]);

  const unitLabel = unit === "ms" ? "ms" : "lvl";
  const rating = level ? getScoreRating(level) : null;
  const inputAllowed = phase === STATE.INPUT;

  // ── Render ───────────────────────────────────────────────────────────────────
    return (
      <main className="min-h-screen bg-[var(--color-bg)] pt-16 pb-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
  
          {/* Back */}
          <Link to="/"
            className="inline-flex items-center gap-2 text-sm transition-colors mb-10 group
                       text-[var(--color-text-faint)] hover:text-[var(--color-text-muted)]">
            <span className="group-hover:-translate-x-0.5 transition-transform">←</span>
            Back to Dashboard
          </Link>
  
          {/* Page title */}
          <div className="mb-10">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-3xl">🧩</span>
              <h1 className="text-4xl font-bold tracking-tight text-[var(--color-text)]">
                Tile Flash
              </h1>
            </div>
            <p className="text-base ml-12 text-[var(--color-text-muted)]">
              Test your memory with this challenging grid-based game.
            </p>
          </div>
  
          {/* ── GAME CONTROLS ────────────────────────────────────────────────────── */}
          <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-2xl mb-10">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xl font-semibold text-[var(--color-text)]">Tile Flash</p>
                <p className="text-sm text-[var(--color-text-muted)] mt-1">
                  Watch which tiles light up, then tap them all in any order to clear the level.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="rounded-2xl bg-[var(--color-surface-2)] px-4 py-3 text-sm text-[var(--color-text)]">
                  Level {level}
                </div>
                <button
                  type="button"
                  onClick={handleStartClick}
                  className="rounded-2xl bg-[var(--color-primary)] text-[var(--color-bg)] px-5 py-3 font-semibold transition hover:opacity-90"
                >
                  {phase === STATE.INPUT ? `Restart level ${level}` : phase === STATE.SUCCESS ? "Restart" : phase === STATE.COUNTDOWN ? "Preparing..." : phase === STATE.FAIL ? "Retry" : `Start level ${level}`}
                </button>
              </div>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-[1.5fr_0.7fr]">
              <div>
                <p className="text-sm text-[var(--color-text-muted)]">{message}</p>
              </div>
              <div className="flex flex-wrap gap-2 items-center justify-start sm:justify-end">
                <span className="rounded-2xl bg-[var(--color-surface-2)] px-3 py-2 text-xs text-[var(--color-text-muted)]">
                  {phase === STATE.COUNTDOWN && `Starting in ${countdown}s`}
                  {phase === STATE.SHOWING && `Watching pattern`}
                  {phase === STATE.INPUT && `${timeLeft}s left`}
                  {phase === STATE.SUCCESS && `Success!`}
                  {phase === STATE.FAIL && `Failed`}
                  {phase === STATE.IDLE && `Ready`}
                </span>
                <span className={`rounded-2xl px-3 py-2 text-xs font-semibold ${rating?.colorClass ?? "text-[var(--color-text)]"}`}>
                  {rating?.emoji} {rating?.label}
                </span>
              </div>
            </div>

            <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <label className="flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
                <input
                  type="checkbox"
                  checked={showCorrectOnFail}
                  onChange={(event) => setShowCorrectOnFail(event.target.checked)}
                  className="h-4 w-4 rounded border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
                />
                Show correct pattern after fail
              </label>
              {user && (
                <div className="text-xs text-[var(--color-text-muted)]">
                  {saving ? "Saving score..." : saved ? "Score saved" : saveError ? saveError : "Logged in scores are stored automatically."}
                </div>
              )}
            </div>
          </div>

          {/* ── Tile Flash grid ───────────────────────────────────────────────── */}
          <div className="mt-10">
            <div className="mb-4 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-[var(--color-text)] font-semibold text-lg">Tile Flash</h2>
                <p className="text-sm text-[var(--color-text-muted)]">Tap all lit tiles in any order.</p>
              </div>
              <span className="text-sm text-[var(--color-text-muted)]">{gridSize}×{gridSize} tiles</span>
            </div>

            <div className={`grid gap-3 ${inputAllowed ? "" : "pointer-events-none blur-sm opacity-80"}`} style={{ gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))` }}>
              {gridCells.map((cell) => {
                const isShowingTile = phase === STATE.SHOWING && pattern.includes(cell);
                const isSelectedTile = phase === STATE.INPUT && selectedTiles.has(cell);
                const isHighlighted = highlightedCell === cell || isShowingTile || isSelectedTile;
                return (
                  <button
                    key={cell}
                    type="button"
                    onClick={() => handleTileClick(cell)}
                    className={`aspect-square rounded-3xl border transition-all duration-150
                               ${isHighlighted ? "border-[var(--color-primary)] bg-[var(--color-primary)] shadow-xl" : "border-[var(--color-border)] bg-[var(--color-surface-2)] hover:bg-[var(--color-surface)]"}`}
                    aria-label={`Tile ${cell + 1}`}
                  />
                );
              })}
            </div>

            {phase === STATE.FAIL && showCorrectOnFail && correctPattern.length > 0 && (
              <div className="mt-4 rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
                <p className="text-sm text-[var(--color-text-muted)] mb-3">Correct pattern:</p>
                <div className="flex flex-wrap gap-2">
                  {correctPattern.map((cell, index) => (
                    <div key={`${cell}-${index}`} className="min-w-[2.5rem] rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-3 py-2 text-center text-sm text-[var(--color-text)]">
                      {cell + 1}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── STATS ROW ─────────────────────────────────────────────────────────── */}
          {(history.length > 0 || myBoardRow) && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              {[
                {
                  label: "Best Completed",
                  value: allTimePB !== null ? `${allTimePB} ${unitLabel}` : "—",
                  sub:   "personal best",
                  color: "text-[var(--color-primary)]",
                },
                {
                  label: `Last ${movingAvgScores.length > 0 ? Math.min(movingAvgScores.length, MOVING_AVG_WINDOW) : "—"} Avg`,
                  value: movingAvg !== null ? `${movingAvg} ${unitLabel}` : "—",
                  sub:   "recent levels",
                  color: "text-[var(--color-primary)]",
                },
                {
                  label: "Total Attempts",
                  value: totalAttempts > 0 ? totalAttempts : sessionAttempts || "—",
                  sub:   "all time",
                  color: "text-[var(--color-text-muted)]",
                },
              ].map(({ label, value, sub, color }) => (
                <div key={label}
                  className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl px-5 py-4 text-center">
                  <p className="text-xs text-[var(--color-text-muted)] uppercase tracking-widest mb-1 font-semibold">{label}</p>
                  <p className={`text-2xl font-bold font-mono ${color}`}>{value}</p>
                  <p className="text-[11px] text-[var(--color-text-muted)] mt-1 font-mono">{sub}</p>
                </div>
              ))}
            </div>
          )}
  
          {/* ── RECENT ATTEMPTS + LEADERBOARD ────────────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-10">

            {/* Recent Attempts */}
            <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-3xl p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-[var(--color-text)] font-semibold text-lg">Session History</h2>
                <span className="text-xs text-[var(--color-text-muted)] font-mono">last {MAX_HISTORY} attempts</span>
              </div>
              <RecentAttempts history={history} />
            </div>

            {/* Leaderboard */}
            <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-3xl p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-[var(--color-text)] font-semibold text-lg">Leaderboard</h2>
                <button
                  onClick={fetchLeaderboard}
                  className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors
                             flex items-center gap-1"
                >
                  ↻ Refresh
                </button>
              </div>
  
              {boardLoading ? (
                <div className="flex flex-col gap-3">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-14 rounded-2xl bg-[var(--color-surface-2)]/60 animate-pulse" />
                  ))}
                </div>
              ) : board.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
                  <span className="text-4xl opacity-30">🏁</span>
                  <p className="text-[var(--color-text-muted)] text-sm">No scores yet — be the first!</p>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {board.map((row, i) => (
                    <LeaderboardRow
                      key={row.username}
                      row={row}
                      index={i}
                      unit={unit}
                      isMe={user?.username === row.username}
                    />
                  ))}
                </div>
              )}
  
              {!user && board.length > 0 && (
                <p className="text-xs text-[var(--color-text)] text-center mt-5 border-t
                              border-[var(--color-border)] pt-4">
                  <Link to="/register" className="text-[var(--color-primary)] hover:text-[var(--color-text)]">
                    Sign up
                  </Link>{" "}
                  to appear on the leaderboard
                </p>
              )}
            </div>
          </div>
  
          {/* ── SCIENCE SECTION ───────────────────────────────────────────────────── */}
          <div className="mt-10 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-3xl p-8">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-10 h-10 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-border)]
                              flex items-center justify-center text-xl shrink-0">🧠</div>
              <div>
                <h2 className="text-[var(--color-text)] font-semibold text-lg">The Neuroscience Behind It</h2>
                <p className="text-[var(--color-text-muted)] text-sm mt-0.5">
                  Why training memory skills rewires your brain
                </p>
              </div>
            </div>
  
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {[
                {
                  icon: "🔗",
                  title: "Neuroplasticity",
                  body: "Repeated memory training strengthens synaptic connections in the motor cortex. Each practice session literally reshapes neural pathways, making signal transmission faster and more efficient over time.",
                },
                {
                  icon: "⚡",
                  title: "Short-Term Memory",
                  body: "Your brain's processing speed — the rate at which neurons fire and communicate — improves with consistent cognitive training. Faster processing underlies everything from athletic performance to decision-making.",
                },
                {
                  icon: "🎯",
                  title: "Attention Networks",
                  body: "Memory training activates and strengthens the brain's alerting and executive attention networks. Studies show regular practice correlates with improved focus, reduced cognitive fatigue, and better sustained attention.",
                },
              ].map(({ icon, title, body }) => (
                <div key={title} className="flex flex-col gap-3">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xl">{icon}</span>
                    <h3 className="text-[var(--color-text)] font-semibold text-sm">{title}</h3>
                  </div>
                  <p className="text-[var(--color-text-muted)] text-sm leading-relaxed">{body}</p>
                </div>
              ))}
            </div>
  
            <div className="mt-6 pt-6 border-t border-[var(--color-border)]">
              <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">
                <span className="text-[var(--color-text-muted)] font-medium">Reference: </span>
                info about memory training <em>Neuron</em>, 63(1), 127–138. — Consistent
                memory training leads to significant improvements in working memory capacity and processing speed,
                with improved cognitive throughput.
              </p>
            </div>
          </div>
  
        </div>
      </main>
    );
  }