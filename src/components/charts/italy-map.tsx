"use client";

import { useMemo, useState } from "react";
import italy from "@svg-maps/italy";
import { regioneName } from "@/lib/labels";
import { MAP_ID_REGIONE } from "@/lib/regioni-map";
import { MAP_SCALE } from "@/lib/palette";
import { compactNumber } from "@/lib/format";

interface ItalyMapProps {
  // codice regione ("01".."20") -> casi
  regions: Record<string, number>;
  onSelect: (code: string | null) => void;
  selected: string | null;
  title?: string;
}

export function ItalyMap({ regions, onSelect, selected, title }: ItalyMapProps) {
  const [hover, setHover] = useState<string | null>(null); // map id

  const max = useMemo(() => {
    let m = 0;
    for (const k in regions) if (regions[k] > m) m = regions[k];
    return m || 1;
  }, [regions]);

  const colorFor = (code?: string): string => {
    if (!code) return "#e2e0de";
    const v = code ? regions[code] : undefined;
    if (v === undefined) return "#e2e0de";
    const idx = Math.round((v / max) * (MAP_SCALE.length - 1));
    return MAP_SCALE[idx];
  };

  const hoverCode = hover ? MAP_ID_REGIONE[hover] : undefined;
  const hoverValue = hoverCode ? regions[hoverCode] : undefined;

  return (
    <div>
      {title && <h3 style={{ fontSize: "1rem", margin: "0 0 var(--space-2)" }}>{title}</h3>}
      <svg
        viewBox={italy.viewBox}
        role="img"
        aria-label="Mappa interattiva delle regioni italiane"
        style={{ width: "100%", maxWidth: 460, height: "auto", display: "block", margin: "0 auto" }}
      >
        {italy.locations.map((loc: { id: string; name: string; path: string }, i: number) => {
          const code = MAP_ID_REGIONE[loc.id];
          const value = code ? regions[code] : undefined;
          const isActive = selected === code;
          const isHover = hover === loc.id;
          return (
            <path
              key={loc.id + i}
              d={loc.path}
              onClick={() => code && onSelect(isActive ? null : code)}
              onMouseEnter={() => setHover(loc.id)}
              onMouseLeave={() => setHover(null)}
              fill={colorFor(code)}
              stroke={isHover || isActive ? "var(--color-text)" : "#ffffff"}
              strokeWidth={isHover || isActive ? 2 : 0.8}
              style={{
                cursor: code ? "pointer" : "default",
                transition: "fill 0.15s, stroke 0.15s",
                opacity: isHover || isActive ? 1 : 0.92,
              }}
            />
          );
        })}
      </svg>
      <div style={{ fontSize: "0.82rem", color: "var(--color-text-soft)", textAlign: "center", marginTop: "var(--space-2)" }}>
        {hoverCode ? (
          <>
            <strong>{regioneName(hoverCode)}</strong>
            {" · "}
            {hoverValue !== undefined ? `${compactNumber(hoverValue)} casi` : "nessun dato"}
          </>
        ) : selected ? (
          <>
            <strong>{regioneName(selected)}</strong> selezionata (clicca per deselezionare)
          </>
        ) : (
          "Passa il mouse su una regione o clicca per selezionarla"
        )}
      </div>
    </div>
  );
}