"use client";

import { useEffect, useState } from "react";

export function BackToTop() {
  const [visibile, setVisibile] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisibile(window.scrollY > 420);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <button
      type="button"
      aria-label="Torna all'inizio della pagina"
      title="Torna su"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      style={{
        position: "fixed",
        right: 18,
        bottom: 18,
        width: 46,
        height: 46,
        borderRadius: "50%",
        border: "1px solid var(--color-text)",
        background: "var(--color-text)",
        color: "var(--color-raised)",
        fontSize: "1.15rem",
        fontWeight: 800,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 80,
        opacity: visibile ? 1 : 0,
        pointerEvents: visibile ? "auto" : "none",
        transform: visibile ? "translateY(0)" : "translateY(10px)",
        transition: "opacity 0.2s ease, transform 0.2s ease",
      }}
    >
      ↑
    </button>
  );
}