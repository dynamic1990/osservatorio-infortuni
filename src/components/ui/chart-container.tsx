"use client";

import React, { useEffect, useState, ReactNode } from "react";

interface Props {
  height: number | string;
  children: ReactNode;
}

export function ClientChartOnly({ height, children }: Props) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div
        style={{
          width: "100%",
          height: typeof height === "number" ? `${height}px` : height,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "var(--color-surface)",
          borderRadius: "var(--radius-md)",
          color: "var(--color-text-soft)",
          fontSize: "0.82rem",
        }}
      >
        Caricamento grafico...
      </div>
    );
  }

  return <>{children}</>;
}
