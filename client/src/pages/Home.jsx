import GameCard from "../components/GameCard";
import { useAuth } from "../context/AuthContext";

const GAMES = [
  {
    slug: "reaction-time",
    name: "Reaction Time",
    description: "Tap as fast as you can the moment the screen changes. Train your reflexes.",
    icon: "⚡",
    unit: "ms",
    available: true,
  },
  {
    slug: "memory-matrix",
    name: "Memory Matrix",
    description: "Memorize a grid of highlighted squares, then reproduce the pattern from memory.",
    icon: "🧩",
    unit: "score",
    available: true,
  },
  {
    slug: "tile-flash",
    name: "Tile Flash",
    description: "Watch the flashing tiles, then tap them all before time runs out.",
    icon: "✨",
    unit: "lvl",
    available: true,
  },
  {
    slug: "number-memory",
    name: "Number Memory",
    description: "Remember the longest number sequence you can before your recall breaks down.",
    icon: "🔢",
    unit: "digits",
    available: false,
  },
  {
    slug: "typing-speed",
    name: "Typing Speed",
    description: "Type a passage as fast and accurately as possible. Measures WPM and accuracy.",
    icon: "⌨️",
    unit: "wpm",
    available: false,
  },
  {
    slug: "aim-trainer",
    name: "Aim Trainer",
    description: "Click randomized targets as quickly and precisely as possible.",
    icon: "🎯",
    unit: "ms",
    available: false,
  },
];

export default function Home() {
  const { user } = useAuth();

  return (
    <main className="min-h-screen bg-[var(--color-bg)] pt-16">

      {/* ── Hero ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 bg-[var(--color-surface-2)] border border-[var(--color-border)]
                          text-[var(--color-primary)] text-xs font-medium px-3 py-1.5 rounded-full mb-6">
            <span className="w-1.5 h-1.5 bg-[var(--color-primary)] rounded-full animate-pulse" />
            Cognitive Training Platform
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-[var(--color-text)] leading-tight tracking-tight mb-4">
            Train your mind,<br />
            <span className="text-[var(--color-primary)]">measure your limits.</span>
          </h1>
          <p className="text-[var(--color-text-muted)] text-lg leading-relaxed">
            A suite of science-inspired benchmarks to sharpen your reaction time,
            memory, focus, and more — all tracked over time.
          </p>
        </div>
      </section>

      {/* ── Games Grid ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-[var(--color-text)] font-semibold text-xl">Games</h2>
          <span className="text-sm text-[var(--color-text-muted)]">
            {GAMES.filter(g => g.available).length} of {GAMES.length} available
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {GAMES.map((game) => (
            <GameCard key={game.slug} {...game} />
          ))}
        </div>
      </section>

      {/* ── Stats placeholder ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="flex items-center gap-3 mb-6">
          <h2 className="text-[var(--color-text)] font-semibold text-xl">Your Statistics</h2>
          <span className="text-[10px] font-mono bg-[var(--color-surface-2)] text-[var(--color-text-muted)] px-2 py-0.5
                           rounded-full border border-[var(--color-border)]">coming soon</span>
        </div>

        {!user ? (
          /* Logged-out CTA */
          <div className="rounded-2xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface)]/80 p-12
                          flex flex-col items-center justify-center text-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[var(--color-surface-2)] flex items-center justify-center text-3xl text-[var(--color-text)]">
              📈
            </div>
            <div>
              <p className="text-[var(--color-text)] font-medium mb-1">Track your progress over time</p>
              <p className="text-[var(--color-text-muted)] text-sm">
                Create a free account to save scores and view your performance graphs.
              </p>
            </div>
            <div className="flex gap-3 mt-2">
              <a href="/register"
                 className="text-sm text-[var(--color-bg)] bg-[var(--color-primary)] hover:opacity-90 px-5 py-2.5
                            rounded-lg font-medium transition-colors shadow-lg shadow-[rgba(0,0,0,0.25)]">
                Sign Up Free
              </a>
              <a href="/login"
                 className="text-sm text-[var(--color-text)] hover:text-[var(--color-text)] px-5 py-2.5 rounded-lg
                            border border-[var(--color-border)] hover:bg-[var(--color-surface)] transition-colors">
                Log In
              </a>
            </div>
          </div>
        ) : (
          /* Logged-in placeholder grid */
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {["Best Reaction Time", "Memory High Score", "Avg Typing Speed"].map((label) => (
              <div key={label}
                   className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6
                              flex flex-col gap-2">
                <p className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider font-medium">{label}</p>
                <div className="h-8 w-24 bg-[var(--color-surface-2)] rounded-lg animate-pulse" />
                <div className="h-16 w-full bg-[var(--color-surface-2)]/80 rounded-xl mt-2 animate-pulse" />
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}