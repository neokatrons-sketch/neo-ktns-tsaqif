"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      setDark(document.documentElement.dataset.theme === "dark");
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  function toggle() {
    const next = document.documentElement.dataset.theme !== "dark";
    document.documentElement.dataset.theme = next ? "dark" : "light";
    localStorage.setItem("neo-theme", next ? "dark" : "light");
    setDark(next);
  }

  return (
    <button aria-label={dark ? "Gunakan mode terang" : "Gunakan mode gelap"} className="flex size-11 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] transition hover:border-gold" onClick={toggle} type="button">
      {dark ? <Sun size={17} /> : <Moon size={17} />}
    </button>
  );
}
