import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Moon, Sun } from "lucide-react";

const THEME_KEY = "nv_theme"; // 'light' | 'dark'

function getSystemPref(): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function applyTheme(mode: "light" | "dark") {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("dark", mode === "dark");
}

export function ThemeToggle() {
  // Default to light if no preference is stored, ignoring system preference for initial load as requested
  const [mode, setMode] = useState<"light" | "dark">("light");

  useEffect(() => {
    const stored = localStorage.getItem(THEME_KEY) as "light" | "dark" | null;
    const initial = stored ?? "light";
    setMode(initial);
    applyTheme(initial);
  }, []);

  const toggle = () => {
    const next = mode === "dark" ? "light" : "dark";
    setMode(next);
    localStorage.setItem(THEME_KEY, next);
    applyTheme(next);
  };

  return (
    <Button
      aria-label={mode === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      title={mode === "dark" ? "Light mode" : "Dark mode"}
      onClick={toggle}
      variant="ghost"
      size="icon"
      className="rounded-full hover:bg-primary hover:text-white"
    >
      {mode === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  );
}
