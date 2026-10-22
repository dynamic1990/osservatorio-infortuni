"use client";

import React, { ReactNode } from "react";
import { useMounted } from "@/lib/use-mounted";

interface Props {
  height: number | string;
  children: ReactNode;
}

export function ClientChartOnly({ height, children }: Props) {
  const mounted = useMounted();

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