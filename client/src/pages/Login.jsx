import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useEffect } from "react";

export default function Login() {
  const { login, googleLogin } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();

  // Redirect back to the page they tried to visit, or home
  const from = location.state?.from?.pathname ?? "/";

  const [form, setForm]           = useState({ email: "", password: "" });
  const [errors, setErrors]       = useState({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading]     = useState(false);
  const [showPw, setShowPw]       = useState(false);

const set = (field) => (e) => {
  setForm((f) => ({ ...f, [field]: e.target.value }));
  setErrors((er) => ({ ...er, [field]: undefined }));
  // Only clear the server error when the user edits the password,
  // since that's what was wrong. Email is preserved and stays visible.
  if (field === "password") setServerError("");
};

  const validate = () => {
    const errs = {};
    if (!form.email.trim())               errs.email    = "Email is required.";
    else if (!/\S+@\S+\.\S+/.test(form.email))
                                          errs.email    = "Enter a valid email address.";
    if (!form.password)                   errs.password = "Password is required.";
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    setServerError("");
    try {
      await login(form.email, form.password);
      navigate(from, { replace: true });
    } catch (err) {
      setServerError(
        err.response?.data?.message ?? "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // Google Identity callback
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  const handleGoogleCredential = async (resp) => {
    if (!resp?.credential) return;
    try {
      setLoading(true);
      await googleLogin(resp.credential);
      navigate(from, { replace: true });
    } catch (err) {
      setServerError("Google sign-in failed.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!clientId || !window.google) return;
    try {
      window.google.accounts.id.initialize({ client_id: clientId, callback: handleGoogleCredential });
      window.google.accounts.id.renderButton(
        document.getElementById("g_id_signin"),
        { theme: "outline", size: "large", width: "100%" }
      );
    } catch (e) {
      // ignore if google isn't ready yet
    }
  }, [clientId]);

  const inputClass = (field) =>
    `w-full bg-[var(--color-surface-2)] text-[var(--color-text)] placeholder:text-[var(--color-text-faint)] rounded-xl px-4 py-3 text-sm
     border outline-none transition-all duration-200
     focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent
     ${errors[field] ? "border-red-500/70" : "border-[var(--color-border)] hover:border-[var(--color-primary)]"}`;

  return (
    <main className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center px-4 pt-16">

      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-[var(--color-primary)]/15
                        rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-[var(--color-surface-2)]/20
                        rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-8 shadow-2xl
                        shadow-black/20">

          {/* Header */}
          <div className="mb-8 text-center">
            <Link to="/" className="inline-flex items-center justify-center w-12 h-12
                                    rounded-xl bg-[var(--color-primary)] mb-4 hover:opacity-90
                                    transition-all duration-200">
              <svg className="w-6 h-6 text-[var(--color-bg)]" fill="none" viewBox="0 0 24 24"
                   stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3
                     m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547
                     A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531
                     c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </Link>
            <h1 className="text-2xl font-bold text-[var(--color-text)]">Welcome back</h1>
            <p className="text-[var(--color-text-muted)] text-sm mt-1.5">Log in to continue your training.</p>
          </div>

          {/* Server error */}
          {serverError && (
            <div className="mb-5 flex items-start gap-3 bg-red-950/40 border border-red-800/60
                            text-red-300 text-sm px-4 py-3 rounded-xl">
              <span className="mt-0.5 shrink-0">✕</span>
              <span>{serverError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">

            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="text-sm font-medium text-[var(--color-text)]">
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={set("email")}
                className={inputClass("email")}
              />
              {errors.email && (
                <p className="text-xs text-red-400 flex items-center gap-1">
                  <span>⚠</span> {errors.email}
                </p>
              )}
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="text-sm font-medium text-[var(--color-text)]">
                  Password
                </label>
                {/* Placeholder — wire up later */}
                <button
                  type="button"
                  tabIndex="-1"
                  className="text-xs text-[var(--color-primary)] hover:text-[var(--color-text)] transition-colors"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPw ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Your password"
                  value={form.password}
                  onChange={set("password")}
                  className={`${inputClass("password")} pr-11`}
                />
                <button
                  type="button"
                  tabIndex="-1"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]
                             hover:text-[var(--color-text)] transition-colors"
                  aria-label={showPw ? "Hide password" : "Show password"}
                >
                  {showPw ? "🙈" : "👁"}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-red-400 flex items-center gap-1">
                  <span>⚠</span> {errors.password}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[var(--color-primary)] hover:opacity-90 disabled:bg-[var(--color-primary)]/60
                         disabled:cursor-not-allowed text-[var(--color-bg)] font-semibold py-3 rounded-xl
                         transition-all duration-200 shadow-lg shadow-[rgba(74,222,128,0.25)] mt-1
                         flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white
                                   rounded-full animate-spin" />
                  Logging in…
                </>
              ) : "Log In"}
            </button>
          
            {/* Google sign-in */}
            <div className="pt-2">
              <div id="g_id_signin" />
            </div>
          </form>

          <p className="text-center text-sm text-[var(--color-text-muted)] mt-6">
            Don't have an account?{" "}
            <Link to="/register" className="text-[var(--color-primary)] hover:text-[var(--color-text)]
                                            font-medium transition-colors">
              Sign up free
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}