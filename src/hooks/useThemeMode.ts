import { useTheme, type ThemePreference } from "../theme/ThemeProvider";

export function useThemeMode() {
  const { resolvedTheme, setTheme, theme, toggleTheme } = useTheme();

  return {
    isDarkMode: resolvedTheme === "dark",
    resolvedTheme,
    setThemeMode: (nextTheme: ThemePreference) => setTheme(nextTheme),
    themeMode: theme,
    toggleThemeMode: toggleTheme,
  };
}
