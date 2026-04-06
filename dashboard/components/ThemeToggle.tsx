"use client";
import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

export default function ThemeToggle() {
  const [theme, setTheme] = useState<"light"|"dark">("light");
  useEffect(() => {
    const d = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    setTheme(d); document.documentElement.setAttribute("data-theme", d);
  }, []);
  function toggle() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next); document.documentElement.setAttribute("data-theme", next);
  }
  return (
    <button onClick={toggle} aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      style={{ padding:"var(--space-2)",borderRadius:"var(--radius-md)",color:"var(--text-muted)",display:"flex",alignItems:"center",justifyContent:"center" }}>
      {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}
