import { Link } from "react-router-dom";

export default function GameCard({ slug, name, description, icon, unit, available = false }) {
  const content = (
    <div className={`group relative flex flex-col gap-4 p-6 rounded-2xl border transition-all duration-300
      bg-[var(--color-surface)] ${available
        ? "border-[var(--color-border)] hover:border-[var(--color-primary)]/60 hover:bg-[var(--color-surface-2)] hover:shadow-xl hover:shadow-[rgba(0,0,0,0.18)] cursor-pointer"
        : "border-[var(--color-border)] opacity-70 cursor-not-allowed"
      }`}
    >
      {/* Icon */}
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl
        bg-[var(--color-surface-2)] group-hover:bg-[var(--color-primary)]/20 transition-colors duration-300`}>
        {icon}
      </div>

      {/* Text */}
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="text-[var(--color-text)] font-semibold text-lg leading-tight">{name}</h3>
          {!available && (
            <span className="text-[10px] font-mono bg-[var(--color-surface-2)] text-[var(--color-text-muted)] px-2 py-0.5 rounded-full">
              soon
            </span>
          )}
        </div>
        <p className="text-[var(--color-text-muted)] text-sm leading-relaxed">{description}</p>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-auto pt-3 border-t border-[var(--color-border)]">
        <span className="text-xs text-[var(--color-text-faint)] font-mono uppercase tracking-wider">
          Metric: {unit}
        </span>
        {available && (
          <span className="text-xs text-[var(--color-primary)] font-medium group-hover:text-[var(--color-text)]
                           transition-colors flex items-center gap-1">
            Play →
          </span>
        )}
      </div>
    </div>
  );

  return available ? <Link to={`/game/${slug}`}>{content}</Link> : <div>{content}</div>;
}