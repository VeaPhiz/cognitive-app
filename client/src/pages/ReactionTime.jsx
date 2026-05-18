import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

// ── Constants ──────────────────────────────────────────────────────────────────
const STATE = {
  IDLE:     "idle",
  WAITING:  "waiting",
  GO:       "go",
  RESULT:   "result",
  TOO_SOON: "too_soon",
};

const MIN_WAIT = 2000;
const MAX_WAIT = 6000;
const MAX_HISTORY = 5;
const OUTLIER_THRESHOLD = 2500; // ms — scores above this are saved but excluded from avg
const MOVING_AVG_WINDOW = 10;  // last N valid attempts used for average

// ── Helpers ────────────────────────────────────────────────────────────────────
const randBetween = (min, max) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const getScoreRating = (ms) => {
  if (ms < 150) return { label: "Superhuman",    color: "#facc15", emoji: "🚀" };
  if (ms < 200) return { label: "Lightning Fast", color: "#4ade80", emoji: "⚡" };
  if (ms < 250) return { label: "Excellent",      color: "#86efac", emoji: "🎯" };
  if (ms < 300) return { label: "Good",           color: "#93c5fd", emoji: "👍" };
  if (ms < 400) return { label: "Average",        color: "#d1d5db", emoji: "🙂" };
  return              { label: "Keep Training",   color: "#f97316", emoji: "💪" };
};

const medal = (i) => ["🥇", "🥈", "🥉"][i] ?? null;

// ── Leaderboard Row ────────────────────────────────────────────────────────────
function LeaderboardRow({ row, index, isMe }) {
  return (
    <div
      className={`flex items-center gap-4 px-5 py-3.5 rounded-2xl border transition-all
        ${isMe
          ? "bg-indigo-950/50 border-indigo-600/40 shadow-lg shadow-indigo-950/30"
          : "bg-gray-900/60 border-gray-800/60 hover:border-gray-700/60"
        }`}
    >
      <div className="w-8 text-center shrink-0">
        {medal(index)
          ? <span className="text-xl">{medal(index)}</span>
          : <span className="text-sm font-mono text-gray-600">#{index + 1}</span>
        }
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold truncate ${isMe ? "text-indigo-300" : "text-gray-200"}`}>
          {row.username}
          {isMe && (
            <span className="ml-2 text-[10px] bg-indigo-800/70 text-indigo-300
                             px-1.5 py-0.5 rounded-full font-mono">you</span>
          )}
        </p>
        <p className="text-xs text-gray-600 mt-0.5">{row.attempts} attempt{row.attempts !== 1 ? "s" : ""}</p>
      </div>
      <div className="shrink-0 text-right">
        <p className={`font-mono font-bold text-base ${index === 0 ? "text-yellow-400" : isMe ? "text-indigo-300" : "text-gray-300"}`}>
          {Number(row.best_score).toFixed(0)}
          <span className="text-xs font-normal text-gray-600 ml-1">ms</span>
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
        <p className="text-gray-600 text-sm">Your session attempts will appear here.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {history.map((entry, i) => {
        const rating = getScoreRating(entry.ms);
        const barWidth = Math.max(10, Math.min(100, (500 - entry.ms) / 4));

        return (
          <div key={entry.id}
            className="flex items-center gap-4 px-4 py-3 rounded-2xl bg-gray-900/60
                       border border-gray-800/60">
            <span className="text-gray-500 text-xs font-mono w-4 shrink-0">
              {history.length - i}
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-sm font-medium" style={{ color: rating.color }}>
                  {rating.label}
                </span>
              </div>
              <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${barWidth}%`, backgroundColor: rating.color }}
                />
              </div>
            </div>
            <p className="font-mono font-bold text-sm text-slate-300 shrink-0">
              {entry.ms}
              <span className="text-xs text-slate-500 ml-0.5">ms</span>
            </p>
          </div>
        );
      })}
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function ReactionTime() {
  const { user } = useAuth();

  // Game
  const [phase, setPhase]           = useState(STATE.IDLE);
  const [reactionMs, setReactionMs] = useState(null);
  const [startTime, setStartTime]   = useState(null);
  const timeoutRef                  = useRef(null);
  const clickGuard                  = useRef(false); // prevent double-fire

  // Auto-save feedback
  const [saving, setSaving]         = useState(false);
  const [saved, setSaved]           = useState(false);
  const [saveError, setSaveError]   = useState("");

  // Session history (last MAX_HISTORY shown in UI)
  const [history, setHistory]       = useState([]);
  // All valid session scores (≤ OUTLIER_THRESHOLD) for moving average
  const allValidRef                 = useRef([]);
  const historyId                   = useRef(0);

  // Leaderboard
  const [board, setBoard]           = useState([]);
  const [boardLoading, setBoardLoading] = useState(true);

  // ── Derived all-time stats from leaderboard ──────────────────────────────────
  // The leaderboard row for the current user contains best_score and attempts
  // from the DB — the single source of truth for all-time stats.
  const myBoardRow = user ? board.find((r) => r.username === user.username) : null;

  // All-time PB: take the lower of DB best and current session best (covers the
  // case where the user just set a new PB that hasn't refreshed yet).
  const sessionBest = history.length ? Math.min(...history.map((h) => h.ms)) : null;
  const dbBest      = myBoardRow ? Number(myBoardRow.best_score) : null;
  const allTimePB   = dbBest !== null && sessionBest !== null
    ? Math.min(dbBest, sessionBest)
    : dbBest ?? sessionBest;

  // Total attempts: DB count + current session attempts (before next leaderboard refresh)
  const dbAttempts      = myBoardRow ? Number(myBoardRow.attempts) : 0;
  const sessionAttempts = history.length;
  // After save the leaderboard refreshes, so DB count already includes latest attempt.
  // We only add sessionAttempts for the attempts that haven't been reflected yet (unsaved).
  // Simplest approach: show dbAttempts (refreshed after each save) + unsaved count (0 or 1).
  const totalAttempts = dbAttempts > 0
    ? dbAttempts  // leaderboard already up-to-date after each auto-save + refresh
    : sessionAttempts; // guest or no DB row yet

  // Moving average: last MOVING_AVG_WINDOW valid (non-outlier) session scores
  const movingAvgScores = allValidRef.current.slice(-MOVING_AVG_WINDOW);
  const movingAvg = movingAvgScores.length
    ? Math.round(movingAvgScores.reduce((a, v) => a + v, 0) / movingAvgScores.length)
    : null;

  // ── Fetch leaderboard ────────────────────────────────────────────────────────
  const fetchLeaderboard = useCallback(async () => {
    setBoardLoading(true);
    try {
      const { data } = await api.get("/scores/reaction-time/leaderboard");
      setBoard(data.leaderboard);
    } catch {
      /* non-critical */
    } finally {
      setBoardLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeaderboard();
    return () => clearTimeout(timeoutRef.current);
  }, [fetchLeaderboard]);

  // ── Auto-save ────────────────────────────────────────────────────────────────
  const autoSave = useCallback(async (ms) => {
    if (!user) return;
    setSaving(true);
    setSaveError("");
    try {
      await api.post("/scores/save", { game_slug: "reaction-time", value: ms });
      setSaved(true);
      fetchLeaderboard();
    } catch (err) {
      setSaveError(err.response?.data?.message ?? "Could not save score.");
    } finally {
      setSaving(false);
    }
  }, [user, fetchLeaderboard]);

  // ── Game logic ───────────────────────────────────────────────────────────────
  const startGame = useCallback(() => {
    clearTimeout(timeoutRef.current);
    clickGuard.current = false;
    setSaved(false);
    setSaveError("");
    setReactionMs(null);
    setPhase(STATE.WAITING);

    const delay = randBetween(MIN_WAIT, MAX_WAIT);
    timeoutRef.current = setTimeout(() => {
      setStartTime(performance.now());
      setPhase(STATE.GO);
    }, delay);
  }, []);

  const handleScreenClick = useCallback(() => {
    // IDLE or RESULT → start a new round
    if (phase === STATE.IDLE || phase === STATE.RESULT) {
      startGame();
      return;
    }

    // TOO_SOON → restart on click
    if (phase === STATE.TOO_SOON) {
      startGame();
      return;
    }

    // WAITING → anti-abuse: clicked too early
    if (phase === STATE.WAITING) {
      clearTimeout(timeoutRef.current);
      clickGuard.current = true;
      setPhase(STATE.TOO_SOON);
      return;
    }

    // GO → valid click, record time
    if (phase === STATE.GO) {
      if (clickGuard.current) return; // guard against ghost clicks
      clickGuard.current = true;

      const ms = Math.round(performance.now() - startTime);
      setReactionMs(ms);
      setPhase(STATE.RESULT);

      // Add to session history (display, last MAX_HISTORY)
      setHistory((prev) => {
        const entry = { id: ++historyId.current, ms };
        return [entry, ...prev].slice(0, MAX_HISTORY);
      });

      // Track valid scores separately for moving average (outlier filter)
      if (ms <= OUTLIER_THRESHOLD) {
        allValidRef.current = [...allValidRef.current, ms];
      }

      // Auto-save ALL scores to DB (including outliers — raw data is valuable)
      autoSave(ms);
    }
  }, [phase, startTime, startGame, autoSave]);

  // ── Screen config ────────────────────────────────────────────────────────────
  const rating = reactionMs ? getScoreRating(reactionMs) : null;

  const screenConfig = {
    [STATE.IDLE]: {
      bg:       "bg-gray-900 hover:bg-gray-800",
      border:   "border-gray-700/50",
      cursor:   "cursor-pointer",
      glow:     "shadow-indigo-950/20",
    },
    [STATE.WAITING]: {
      bg:       "bg-red-950",
      border:   "border-red-900/60",
      cursor:   "cursor-not-allowed",
      glow:     "shadow-red-950/40",
    },
    [STATE.GO]: {
      bg:       "bg-green-900 hover:bg-green-800",
      border:   "border-green-700/60",
      cursor:   "cursor-pointer",
      glow:     "shadow-green-950/50",
    },
    [STATE.TOO_SOON]: {
      bg:       "bg-orange-950",
      border:   "border-orange-900/60",
      cursor:   "cursor-pointer",
      glow:     "shadow-orange-950/30",
    },
    [STATE.RESULT]: {
      bg:       "bg-gray-900 hover:bg-gray-800",
      border:   "border-gray-700/50",
      cursor:   "cursor-pointer",
      glow:     "shadow-indigo-950/20",
    },
  }[phase];

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <main className="min-h-screen bg-gray-950 pt-16 pb-24">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* Back */}
        <Link to="/"
          className="inline-flex items-center gap-2 text-sm text-gray-600
                     hover:text-gray-400 transition-colors mb-10 group">
          <span className="group-hover:-translate-x-0.5 transition-transform">←</span>
          Back to Dashboard
        </Link>

        {/* Page title */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl">⚡</span>
            <h1 className="text-4xl font-bold text-white tracking-tight">Reaction Time</h1>
          </div>
          <p className="text-gray-500 text-base ml-12">
            Measure how fast your brain processes visual information.
          </p>
        </div>

        {/* ── GAME SCREEN ──────────────────────────────────────────────────────── */}
        <div
          onClick={handleScreenClick}
          className={`relative w-full rounded-3xl border-2 transition-all duration-150
                      flex flex-col items-center justify-center
                      min-h-[28rem] sm:min-h-[32rem] select-none
                      shadow-2xl active:scale-[0.995]
                      ${screenConfig.bg} ${screenConfig.border}
                      ${screenConfig.cursor} ${screenConfig.glow}`}
        >
          {/* Subtle noise overlay */}
          <div className="absolute inset-0 rounded-3xl opacity-[0.03] pointer-events-none"
               style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E\")" }} />

          {/* IDLE */}
          {phase === STATE.IDLE && (
            <div className="flex flex-col items-center gap-6 px-6 text-center">
              <div className="w-20 h-20 rounded-2xl bg-indigo-600/20 border border-indigo-600/30
                              flex items-center justify-center text-4xl">⚡</div>
              <div>
                <p className="text-3xl sm:text-4xl font-bold text-white mb-3">Ready to test?</p>
                <p className="text-gray-500 text-lg">Click anywhere to begin</p>
              </div>
              <div className="flex items-center gap-2 mt-2 text-gray-700 text-sm">
                <span className="w-2 h-2 bg-red-700 rounded-full" />
                <span>Wait for green</span>
                <span className="mx-2">→</span>
                <span className="w-2 h-2 bg-green-600 rounded-full" />
                <span>Click fast!</span>
              </div>
            </div>
          )}

          {/* WAITING */}
          {phase === STATE.WAITING && (
            <div className="flex flex-col items-center gap-6 px-6 text-center">
              <div className="relative">
                <div className="w-6 h-6 bg-red-500 rounded-full animate-ping absolute
                                inset-0 m-auto opacity-40" />
                <div className="w-6 h-6 bg-red-500 rounded-full relative" />
              </div>
              <div>
                <p className="text-5xl sm:text-6xl font-black text-red-300 mb-3 tracking-tight">
                  Wait…
                </p>
                <p className="text-slate-400 text-xl font-semibold">Don't click yet!</p>
              </div>
            </div>
          )}

          {/* GO */}
          {phase === STATE.GO && (
            <div className="flex flex-col items-center gap-6 px-6 text-center">
              <div className="relative">
                <div className="w-8 h-8 bg-green-400 rounded-full animate-ping absolute
                                inset-0 m-auto opacity-50" />
                <div className="w-8 h-8 bg-green-400 rounded-full relative" />
              </div>
              <div>
                <p className="text-6xl sm:text-8xl font-black text-green-300 tracking-tight mb-3
                              drop-shadow-[0_0_40px_rgba(74,222,128,0.4)]">
                  CLICK!
                </p>
                <p className="text-slate-400 text-xl font-semibold">Go go go!</p>
              </div>
            </div>
          )}

          {/* TOO SOON */}
          {phase === STATE.TOO_SOON && (
            <div className="flex flex-col items-center gap-6 px-6 text-center">
              <span className="text-6xl">⚠️</span>
              <div>
                <p className="text-5xl sm:text-6xl font-black text-orange-300 mb-3 tracking-tight">
                  Too Early!
                </p>
                <p className="text-slate-400 text-xl font-semibold">Click to try again</p>
              </div>
            </div>
          )}

          {/* RESULT */}
          {phase === STATE.RESULT && reactionMs && rating && (
            <div className="flex flex-col items-center gap-6 px-6 text-center">
              <span className="text-5xl">{rating.emoji}</span>
              <div>
                <p
                  className="text-7xl sm:text-8xl font-black tracking-tight mb-2"
                  style={{ color: rating.color, textShadow: `0 0 60px ${rating.color}55` }}
                >
                  {reactionMs}
                  <span className="text-3xl sm:text-4xl font-semibold text-gray-500 ml-2">ms</span>
                </p>
                <p className="text-2xl font-semibold mb-1" style={{ color: rating.color }}>
                  {rating.label}
                </p>
              </div>

              {/* Save status */}
              <div className="flex items-center gap-2 text-base">
                {!user && (
                  <p className="text-gray-500 text-base">
                    <Link to="/login" className="text-indigo-400 hover:text-indigo-300">Log in</Link>
                    {" "}to save your score
                  </p>
                )}
                {user && saving && (
                  <span className="flex items-center gap-2 text-gray-400 text-base">
                    <span className="w-4 h-4 border-2 border-gray-600 border-t-gray-400
                                     rounded-full animate-spin" />
                    Saving…
                  </span>
                )}
                {user && saved && (
                  <span className="flex items-center gap-2 text-green-400 text-base font-medium">
                    <span>✓</span> Score saved to leaderboard
                  </span>
                )}
                {user && saveError && (
                  <span className="text-red-400 text-sm">{saveError}</span>
                )}
              </div>

              <p className="text-slate-400 text-base font-medium mt-2">
                Click anywhere to play again
              </p>
            </div>
          )}
        </div>

        {/* ── STATS ROW ─────────────────────────────────────────────────────────── */}
        {(history.length > 0 || myBoardRow) && (
          <div className="grid grid-cols-3 gap-4 mt-6">
            {[
              {
                label: "All-Time PB",
                value: allTimePB !== null ? `${allTimePB} ms` : "—",
                sub:   "personal best",
                color: "text-yellow-400",
              },
              {
                label: `Last ${movingAvgScores.length > 0 ? Math.min(movingAvgScores.length, MOVING_AVG_WINDOW) : "—"} Avg`,
                value: movingAvg !== null ? `${movingAvg} ms` : "—",
                sub:   "outliers excluded",
                color: "text-indigo-400",
              },
              {
                label: "Total Attempts",
                value: totalAttempts > 0 ? totalAttempts : sessionAttempts || "—",
                sub:   "all time",
                color: "text-gray-300",
              },
            ].map(({ label, value, sub, color }) => (
              <div key={label}
                className="bg-gray-900 border border-gray-800 rounded-2xl px-5 py-4 text-center">
                <p className="text-xs text-slate-400 uppercase tracking-widest mb-1 font-semibold">{label}</p>
                <p className={`text-2xl font-bold font-mono ${color}`}>{value}</p>
                <p className="text-[11px] text-slate-500 mt-1 font-mono">{sub}</p>
              </div>
            ))}
          </div>
        )}

        {/* ── RECENT ATTEMPTS + LEADERBOARD ────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-10">

          {/* Recent Attempts */}
          <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-white font-semibold text-lg">Session History</h2>
              <span className="text-xs text-slate-500 font-mono">last {MAX_HISTORY} attempts</span>
            </div>
            <RecentAttempts history={history} />
          </div>

          {/* Leaderboard */}
          <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-white font-semibold text-lg">Leaderboard</h2>
              <button
                onClick={fetchLeaderboard}
                className="text-xs text-gray-600 hover:text-gray-400 transition-colors
                           flex items-center gap-1"
              >
                ↻ Refresh
              </button>
            </div>

            {boardLoading ? (
              <div className="flex flex-col gap-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-14 rounded-2xl bg-gray-800/60 animate-pulse" />
                ))}
              </div>
            ) : board.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
                <span className="text-4xl opacity-30">🏁</span>
                <p className="text-gray-600 text-sm">No scores yet — be the first!</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {board.map((row, i) => (
                  <LeaderboardRow
                    key={row.username}
                    row={row}
                    index={i}
                    isMe={user?.username === row.username}
                  />
                ))}
              </div>
            )}

            {!user && board.length > 0 && (
              <p className="text-xs text-gray-700 text-center mt-5 border-t
                            border-gray-800 pt-4">
                <Link to="/register" className="text-indigo-500 hover:text-indigo-400">
                  Sign up
                </Link>{" "}
                to appear on the leaderboard
              </p>
            )}
          </div>
        </div>

        {/* ── SCIENCE SECTION ───────────────────────────────────────────────────── */}
        <div className="mt-10 bg-gray-900 border border-gray-800 rounded-3xl p-8">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-10 h-10 rounded-xl bg-indigo-950 border border-indigo-800/50
                            flex items-center justify-center text-xl shrink-0">🧠</div>
            <div>
              <h2 className="text-white font-semibold text-lg">The Neuroscience Behind It</h2>
              <p className="text-gray-600 text-sm mt-0.5">
                Why training reaction time rewires your brain
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              {
                icon: "🔗",
                title: "Neuroplasticity",
                body: "Repeated reaction-time training strengthens synaptic connections in the motor cortex. Each practice session literally reshapes neural pathways, making signal transmission faster and more efficient over time.",
              },
              {
                icon: "⚡",
                title: "Processing Speed",
                body: "Your brain's processing speed — the rate at which neurons fire and communicate — improves with consistent cognitive training. Faster processing underlies everything from athletic performance to decision-making.",
              },
              {
                icon: "🎯",
                title: "Attention Networks",
                body: "Reaction training activates and strengthens the brain's alerting and executive attention networks. Studies show regular practice correlates with improved focus, reduced cognitive fatigue, and better sustained attention.",
              },
            ].map(({ icon, title, body }) => (
              <div key={title} className="flex flex-col gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="text-xl">{icon}</span>
                  <h3 className="text-white font-semibold text-sm">{title}</h3>
                </div>
                <p className="text-gray-500 text-sm leading-relaxed">{body}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-6 border-t border-gray-800">
            <p className="text-xs text-gray-700 leading-relaxed">
              <span className="text-gray-600 font-medium">Reference: </span>
              Dux, P.E., et al. (2009). Training improves multitasking performance by increasing the speed of
              information processing in human prefrontal cortex. <em>Neuron</em>, 63(1), 127–138. — Consistent
              reaction training produces measurable structural changes in prefrontal white matter associated
              with improved cognitive throughput.
            </p>
          </div>
        </div>

      </div>
    </main>
  );
}