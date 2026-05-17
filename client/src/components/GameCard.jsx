import { Link } from "react-router-dom";

export default function GameCard({ slug, name, description, icon, unit, available = false }) {
  const content = (
    <div className={`group relative flex flex-col gap-4 p-6 rounded-2xl border transition-all duration-300
      bg-gray-900 ${available
        ? "border-gray-700 hover:border-indigo-500/60 hover:bg-gray-800/80 hover:shadow-xl hover:shadow-indigo-950/30 cursor-pointer"
        : "border-gray-800 opacity-60 cursor-not-allowed"
      }`}
    >
      {/* Icon */}
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl
        bg-gray-800 group-hover:bg-indigo-600/20 transition-colors duration-300`}>
        {icon}
      </div>

      {/* Text */}
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="text-white font-semibold text-lg leading-tight">{name}</h3>
          {!available && (
            <span className="text-[10px] font-mono bg-gray-800 text-gray-500 px-2 py-0.5 rounded-full">
              soon
            </span>
          )}
        </div>
        <p className="text-gray-400 text-sm leading-relaxed">{description}</p>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-800">
        <span className="text-xs text-gray-600 font-mono uppercase tracking-wider">
          Metric: {unit}
        </span>
        {available && (
          <span className="text-xs text-indigo-400 font-medium group-hover:text-indigo-300
                           transition-colors flex items-center gap-1">
            Play →
          </span>
        )}
      </div>
    </div>
  );

  return available ? <Link to={`/game/${slug}`}>{content}</Link> : <div>{content}</div>;
}