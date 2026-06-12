import { Laptop2, MoonStar, SunMedium } from "lucide-react";
import { useTheme } from "../theme/ThemeProvider";

const themeOptions = [
  { icon: SunMedium, label: "Sáng", value: "light" as const },
  { icon: MoonStar, label: "Tối", value: "dark" as const },
  { icon: Laptop2, label: "Hệ thống", value: "system" as const },
];

type ThemeToggleProps = {
  compact?: boolean;
  className?: string;
};

export function ThemeToggle({ compact = false, className = "" }: ThemeToggleProps) {
  const { setTheme, theme } = useTheme();

  return (
    <div className={`theme-toggle ${compact ? "theme-toggle-compact" : ""} ${className}`.trim()}>
      {themeOptions.map(({ icon: Icon, label, value }) => {
        const isActive = theme === value;

        return (
          <button
            aria-label={label}
            aria-pressed={isActive}
            className={`theme-toggle-option ${isActive ? "theme-toggle-option-active" : ""}`}
            key={value}
            onClick={() => setTheme(value)}
            title={label}
            type="button"
          >
            <Icon size={compact ? 16 : 18} />
          </button>
        );
      })}
    </div>
  );
}
