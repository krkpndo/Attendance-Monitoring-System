import { useCallback, useEffect, useState } from "react";

/*
 * useTheme — owns the light/dark choice.
 *
 * This is CLIENT/UI state (a user preference), so it lives in plain React state
 * here, NOT in TanStack Query (which is for server data). It lives in hooks/
 * rather than a feature folder because the theme is cross-cutting — the whole
 * app reads it, no single feature owns it.
 *
 * Source of truth for the *applied* theme is the `data-theme` attribute on
 * <html> (that's what daisyUI reads). We mirror the choice into localStorage so
 * it survives reloads, and the pre-paint script in index.html reads that same
 * key to avoid a flash before this hook runs.
 */
const THEME_KEY = "theme";
const LIGHT = "attendance";
const DARK = "attendance-dark";

type ThemeName = typeof LIGHT | typeof DARK;

function currentTheme(): ThemeName {
  // What's actually on <html> right now (set by the index.html script, or below).
  const attr = document.documentElement.getAttribute("data-theme");
  if (attr === DARK) return DARK;
  if (attr === LIGHT) return LIGHT;
  // Nothing forced yet → fall back to the OS preference so the toggle's initial
  // label matches what the user is actually seeing via --prefersdark.
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? DARK : LIGHT;
}

export function useTheme() {
  const [theme, setThemeState] = useState<ThemeName>(currentTheme);

  // Keep <html data-theme> and localStorage in sync with our state.
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => (prev === DARK ? LIGHT : DARK));
  }, []);

  return { theme, isDark: theme === DARK, toggleTheme };
}
