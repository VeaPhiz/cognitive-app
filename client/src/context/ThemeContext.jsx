import { createContext, useContext, useState, useEffect } from "react";

const THEMES = [
  { id: "deep-slate",     label: "Deep Slate",     swatch: ["#304f43", "#ACBAC4", "#E1D9BC", "#F0F0DB"] },
  { id: "pastel-sun",     label: "Pastel Sun",      swatch: ["#FFF9D2", "#FFEBCC", "#BFDDF0", "#8CC0EB"] },
  { id: "cyber-ocean",    label: "Cyber Ocean",     swatch: ["#093C5D", "#3B7597", "#6FD1D7", "#5DF8D8"] },
  { id: "nordic-luxury",  label: "Nordic Luxury",   swatch: ["#E8EDF2", "#2C3947", "#547A95", "#C2A56D"] },
  { id: "sunset-glow", label: "Testing Theme", swatch: ["#2F1B3B", "#F7A072", "#FFD8A9", "#FFF1D0"] }
];

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [themeId, setThemeId] = useState(
    () => localStorage.getItem("theme") ?? "deep-slate"
  );

  // Apply data-theme to <html> whenever it changes
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", themeId);
    localStorage.setItem("theme", themeId);
  }, [themeId]);

  return (
    <ThemeContext.Provider value={{ themeId, setThemeId, themes: THEMES }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside <ThemeProvider>");
  return ctx;
}