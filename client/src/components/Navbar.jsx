import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth }  from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

// ── Swatch strip used inside the dropdown ─────────────────────────────────────
function ThemeOption({ theme, isActive, onSelect }) {
  return (
    <button
      onClick={() => onSelect(theme.id)}
      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left
                  transition-all duration-150
                  ${isActive
                    ? "bg-[var(--color-surface-2)] ring-1 ring-[var(--color-primary)]"
                    : "hover:bg-[var(--color-surface-2)]"
                  }`}
    >
      {/* 4-color swatch */}
      <div className="flex gap-0.5 shrink-0">
        {theme.swatch.map((hex) => (
          <span
            key={hex}
            className="w-3.5 h-3.5 rounded-sm border border-black/10"
            style={{ backgroundColor: hex }}
          />
        ))}
      </div>
      <span className="text-sm font-medium text-[var(--color-text)] truncate">
        {theme.label}
      </span>
      {isActive && (
        <span className="ml-auto text-[var(--color-primary)] text-xs">✓</span>
      )}
    </button>
  );
}

// ── Main Navbar ───────────────────────────────────────────────────────────────
export default function Navbar() {
  const { user, logout }           = useAuth();
  const { themeId, setThemeId, themes } = useTheme();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate    = useNavigate();

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    setDropdownOpen(false);
    navigate("/");
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50
                    bg-[var(--color-surface)]/80 backdrop-blur-md
                    border-b border-[var(--color-border)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* ── Logo ── */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center
                            bg-[var(--color-primary)] transition-opacity group-hover:opacity-80">
              <svg className="w-5 h-5 text-[var(--color-bg)]" fill="none" viewBox="0 0 24 24"
                   stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3
                     m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547
                     A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531
                     c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <span className="font-bold text-lg tracking-tight text-[var(--color-text)]">
              Mind<span className="text-[var(--color-primary)]">Lab</span>
            </span>
          </Link>

          {/* ── Right side ── */}
          <div className="flex items-center gap-3">
            

            {/* Guest: theme pill + auth buttons */}
            {!user ? (
              <>
                {/* Compact theme switcher for guests */}
                <div className="hidden sm:flex items-center gap-2 p-1 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-border)]">
                  <span className="text-xs font-semibold text-[var(--color-text)] uppercase tracking-wide">
                    Themes
                  </span>
                  <div className="flex items-center gap-1">
                    {themes.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => setThemeId(t.id)}
                        title={t.label}
                        className={`flex gap-0.5 p-1 rounded-lg transition-all duration-150
                                    ${themeId === t.id
                                      ? "ring-1 ring-[var(--color-primary)] bg-[var(--color-surface)]"
                                      : "hover:bg-[var(--color-surface)] opacity-60 hover:opacity-100"
                                    }`}
                      >
                        {t.swatch.slice(0, 2).map((hex) => (
                          <span key={hex} className="w-2.5 h-2.5 rounded-[3px]"
                                style={{ backgroundColor: hex }} />
                        ))}
                      </button>
                    ))}
                  </div>
                </div>

                <Link to="/login"
                  className="text-sm font-medium px-4 py-2 rounded-lg transition-all duration-200
                             text-[var(--color-text-muted)] hover:text-[var(--color-text)]
                             hover:bg-[var(--color-surface-2)]">
                  Log In
                </Link>
                <Link to="/register"
                  className="text-sm font-semibold px-4 py-2 rounded-lg transition-all duration-200
                             bg-[var(--color-primary)] text-[var(--color-bg)]
                             hover:opacity-90 shadow-md">
                  Sign Up
                </Link>
              </>
            ) : (
              <>
                {/* Compact theme switcher for logged-in users */}
                <div className="hidden sm:flex items-center gap-2 p-1 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-border)]">
                  <span className="text-xs font-semibold text-[var(--color-text)] uppercase tracking-wide">
                    Themes
                  </span>
                  <div className="flex items-center gap-1">
                    {themes.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => setThemeId(t.id)}
                        title={t.label}
                        className={`flex gap-0.5 p-1 rounded-lg transition-all duration-150
                                    ${themeId === t.id
                                      ? "ring-1 ring-[var(--color-primary)] bg-[var(--color-surface)]"
                                      : "hover:bg-[var(--color-surface)] opacity-60 hover:opacity-100"
                                    }`}
                      >
                        {t.swatch.slice(0, 2).map((hex) => (
                          <span key={hex} className="w-2.5 h-2.5 rounded-[3px]"
                                style={{ backgroundColor: hex }} />
                        ))}
                      </button>
                    ))}
                  </div>
                </div>

                {/* ── Logged-in dropdown ── */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setDropdownOpen((p) => !p)}
                    className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-full
                               border transition-all duration-200
                               bg-[var(--color-surface-2)] border-[var(--color-border)]
                               hover:border-[var(--color-primary)]/50"
                  >
                  <div className="w-7 h-7 rounded-full flex items-center justify-center
                                  text-xs font-bold uppercase
                                  bg-[var(--color-primary)] text-[var(--color-bg)]">
                    {user.username?.[0] ?? "U"}
                  </div>
                  <span className="text-sm font-medium hidden sm:block text-[var(--color-text)]">
                    {user.username}
                  </span>
                  <svg
                    className={`w-4 h-4 text-[var(--color-text-muted)] transition-transform duration-200
                                ${dropdownOpen ? "rotate-180" : ""}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Dropdown */}
                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-60
                                  rounded-2xl shadow-2xl overflow-hidden z-50
                                  bg-[var(--color-surface)] border border-[var(--color-border)]">

                    {/* User info */}
                    <div className="px-4 py-3 border-b border-[var(--color-border)]">
                      <p className="text-xs uppercase tracking-wider text-[var(--color-text-faint)]">
                        Signed in as
                      </p>
                      <p className="text-sm font-semibold truncate mt-0.5 text-[var(--color-text)]">
                        {user.email}
                      </p>
                    </div>

                    {/* Placeholder nav items */}
                    <div className="p-1.5 flex flex-col gap-0.5 border-b border-[var(--color-border)]">
                      {[
                        { icon: "👤", label: "Profile"   },
                        { icon: "📊", label: "My Stats"  },
                        { icon: "⚙️", label: "Settings"  },
                      ].map(({ icon, label }) => (
                        <button key={label} disabled
                          className="flex items-center justify-between w-full px-3 py-2
                                     rounded-lg text-left opacity-40 cursor-not-allowed">
                          <span className="flex items-center gap-2.5 text-sm
                                           text-[var(--color-text-muted)]">
                            <span>{icon}</span>{label}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded font-mono
                                           bg-[var(--color-surface-2)] text-[var(--color-text-faint)]">
                            soon
                          </span>
                        </button>
                      ))}
                    </div>

                    {/* Logout */}
                    <div className="p-1.5">
                      <button onClick={handleLogout}
                        className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg
                                   text-sm transition-colors duration-150
                                   text-red-400 hover:text-red-300 hover:bg-red-950/30">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24"
                             stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round"
                            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3
                               3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Log Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}