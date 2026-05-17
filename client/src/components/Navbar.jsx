import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Close dropdown when clicking outside
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
    <nav className="fixed top-0 left-0 right-0 z-50 bg-gray-950/80 backdrop-blur-md border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* ── Logo ── */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center
                            group-hover:bg-indigo-500 transition-colors duration-200">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3
                     m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547
                     A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531
                     c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <span className="text-white font-bold text-lg tracking-tight">
              Mind<span className="text-indigo-400">Lab</span>
            </span>
          </Link>

          {/* ── Right side ── */}
          <div className="flex items-center gap-3">
            {!user ? (
              /* Guest Mode */
              <>
                <Link
                  to="/login"
                  className="text-sm text-gray-300 hover:text-white px-4 py-2 rounded-lg
                             hover:bg-gray-800 transition-all duration-200"
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  className="text-sm text-white bg-indigo-600 hover:bg-indigo-500 px-4 py-2
                             rounded-lg font-medium transition-all duration-200 shadow-lg
                             shadow-indigo-900/30"
                >
                  Sign Up
                </Link>
              </>
            ) : (
              /* Logged-in Mode */
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen((prev) => !prev)}
                  className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-full
                             bg-gray-800 hover:bg-gray-700 border border-gray-700
                             hover:border-gray-600 transition-all duration-200 group"
                >
                  {/* Avatar circle */}
                  <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center
                                  justify-center text-white text-xs font-bold uppercase">
                    {user.username?.[0] ?? "U"}
                  </div>
                  <span className="text-sm text-gray-200 font-medium hidden sm:block">
                    {user.username}
                  </span>
                  {/* Chevron */}
                  <svg
                    className={`w-4 h-4 text-gray-400 transition-transform duration-200
                                ${dropdownOpen ? "rotate-180" : ""}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Dropdown Menu */}
                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-52 bg-gray-900 border border-gray-700
                                  rounded-xl shadow-2xl shadow-black/50 overflow-hidden
                                  animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="px-4 py-3 border-b border-gray-800">
                      <p className="text-xs text-gray-500 uppercase tracking-wider">Signed in as</p>
                      <p className="text-sm text-white font-medium truncate mt-0.5">{user.email}</p>
                    </div>
                    <div className="p-1.5 flex flex-col gap-0.5">
                      {[
                        { icon: "👤", label: "Profile", note: "coming soon" },
                        { icon: "📊", label: "My Stats",  note: "coming soon" },
                        { icon: "⚙️", label: "Settings",  note: "coming soon" },
                      ].map(({ icon, label, note }) => (
                        <button
                          key={label}
                          disabled
                          className="flex items-center justify-between w-full px-3 py-2 rounded-lg
                                     text-left text-gray-500 cursor-not-allowed select-none"
                        >
                          <span className="flex items-center gap-2.5 text-sm">
                            <span>{icon}</span>{label}
                          </span>
                          <span className="text-[10px] bg-gray-800 text-gray-600 px-1.5 py-0.5
                                           rounded-md font-mono">{note}</span>
                        </button>
                      ))}
                    </div>
                    <div className="p-1.5 border-t border-gray-800">
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg
                                   text-sm text-red-400 hover:text-red-300 hover:bg-red-950/40
                                   transition-colors duration-150"
                      >
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
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}