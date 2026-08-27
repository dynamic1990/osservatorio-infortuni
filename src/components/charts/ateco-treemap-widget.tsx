"use client";

import { useMemo, useState } from "react";
import { ResponsiveContainer, Treemap, Tooltip } from "recharts";
import { getMultidimensionaleData } from "@/lib/multidimensionale";
import { atecoLabel, atecoShort } from "@/lib/ateco";
import { compactNumber, exactNumber, percent } from "@/lib/format";
import { PALETTE } from "@/lib/palette";

// Palette cromatica sobria per blocchi ATECO
const BLOCK_COLORS = [
  "#2b5b8a",
  "#b3261e",
  "#2f8f5b",
  "#c77d0a",
  "#0e7c8a",
  "#7b4fa6",
  "#d45b2c",
  "#5b6db0",
  "#8a5a2b",
  "#4a7a4a",
  "#b0336b",
  "#3b5f8a",
  "#6c757d",
  "#495057",
  "#343a40",
];

// Componente rettangolo personalizzato per il Treemap
function CustomizedTreemapContent(props: any) {
  const { root, depth, x, y, width, height, index, name, value, casi, mortali, color } = props;

  if (width < 32 || height < 24) return null;

  const isBig = width > 110 && height > 55;
  const isMedium = width > 70 && height > 40;

  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        style={{
          fill: color || BLOCK_COLORS[index % BLOCK_COLORS.length],
          stroke: "#ffffff",
          strokeWidth: 2,
          strokeOpacity: 0.9,
          rx: 4,
          ry: 4,
          cursor: "pointer",
          transition: "opacity 0.2s ease",
        }}
      />
      {isMedium && (
        <foreignObject x={x + 4} y={y + 4} width={width - 8} height={height - 8}>
          <div
            style={{
              color: "#ffffff",
              fontSize: isBig ? "0.78rem" : "0.7rem",
              fontWeight: 650,
              lineHeight: 1.2,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: isBig ? "normal" : "nowrap",
              wordBreak: "break-word",
              textShadow: "0 1px 2px rgba(0,0,0,0.6)",
              pointerEvents: "none",
            }}
          >
            <div>{name}</div>
            <div style={{ fontWeight: 400, opacity: 0.95, marginTop: 2, fontSize: "0.72rem" }}>
              {compactNumber(casi)}
              {mortali > 0 && isBig ? ` (${mortali} mort.)` : ""}
            </div>
          </div>
        </foreignObject>
      )}
    </g>
  );
}

export function AtecoTreemapWidget() {
  const multidim = useMemo(() => getMultidimensionaleData(), []);
  const [anno, setAnno] = useState<string>("2024");
  const [livello, setLivello] = useState<"macro" | "divisioni">("macro");

  const annoData = useMemo(() => {
    return multidim.perAnno[anno] || multidim.consolidatoTotale;
  }, [multidim, anno]);

  // Preparazione dati Treemap gerarchico a blocchi
  const treemapData = useMemo(() => {
    if (livello === "macro") {
      const items = annoData.atecoMacro.filter((m) => m.key !== "ND");
      const totNoti = items.reduce((acc, curr) => acc + curr.casi, 0);

      return items.map((item, idx) => {
        const desc = atecoLabel(item.key);
        return {
          name: `${item.key} · ${desc}`,
          key: item.key,
          size: item.casi,
          casi: item.casi,
          mortali: item.mortali || 0,
          quota: totNoti > 0 ? (item.casi / totNoti) * 100 : 0,
          color: BLOCK_COLORS[idx % BLOCK_COLORS.length],
        };
      });
    } else {
      const items = annoData.atecoDivisioni.filter((d) => d.key !== "ND").slice(0, 18);
      const totNoti = items.reduce((acc, curr) => acc + curr.casi, 0);

      return items.map((item, idx) => {
        const desc = atecoShort(item.key);
        return {
          name: desc,
          key: item.key,
          size: item.casi,
          casi: item.casi,
          mortali: item.mortali || 0,
          quota: totNoti > 0 ? (item.casi / totNoti) * 100 : 0,
          color: BLOCK_COLORS[idx % BLOCK_COLORS.length],
        };
      });
    }
  }, [annoData, livello]);

  const casiND = annoData.atecoMacro.find((m) => m.key === "ND")?.casi || 0;
  const percND = ((casiND / (annoData.totale || 1)) * 100).toFixed(1);

  return (
    <div style={{ display: "grid", gap: "var(--space-4)" }}>
      {/* Controlli Anno e Livello ATECO */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "var(--space-3)",
          borderBottom: "1px solid var(--color-divider)",
          paddingBottom: "var(--space-3)",
        }}
      >
        {/* Selettore Anno */}
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", flexWrap: "wrap" }}>
          <span style={{ fontSize: "0.82rem", color: "var(--color-text-soft)", fontWeight: 600 }}>Anno:</span>
          {multidim.anniDisponibili.map((a) => (
            <button
              key={a}
              onClick={() => setAnno(a)}
              className={`btn-pill ${anno === a ? "active" : ""}`}
            >
              {a}
            </button>
          ))}
        </div>

        {/* Livello di dettaglio: Macro-settori o Top Divisioni */}
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", flexWrap: "wrap" }}>
          <span style={{ fontSize: "0.82rem", color: "var(--color-text-soft)", fontWeight: 600 }}>Dettaglio:</span>
          <button
            onClick={() => setLivello("macro")}
            className={`btn-pill ${livello === "macro" ? "btn-pill-accent active" : ""}`}
          >
            Macro-Settori (Sezioni A–U)
          </button>
          <button
            onClick={() => setLivello("divisioni")}
            className={`btn-pill ${livello === "divisioni" ? "btn-pill-accent active" : ""}`}
          >
            Top 18 Attività Specifiche
          </button>
        </div>
      </div>

      {/* Grafico Treemap a blocchi con proporzione visiva */}
      <div style={{ width: "100%", height: 380, background: "var(--color-surface)", borderRadius: "var(--radius-md)", padding: "var(--space-2)" }}>
        <ResponsiveContainer width="100%" height="100%">
          <Treemap
            data={treemapData}
            dataKey="size"
            aspectRatio={4 / 3}
            stroke="#ffffff"
            isAnimationActive={false}
            content={<CustomizedTreemapContent />}
          >
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload || !payload.length) return null;
                const p = payload[0].payload;
                return (
                  <div className="custom-chart-tooltip">
                    <div className="tooltip-title">{p.name}</div>
                    <div className="tooltip-row">
                      <span>Infortuni ({anno}):</span>
                      <strong>{exactNumber(p.casi)} casi</strong>
                    </div>
                    <div className="tooltip-row">
                      <span>Quota sui settori noti:</span>
                      <strong>{p.quota.toFixed(1)}%</strong>
                    </div>
                    {p.mortali > 0 && (
                      <div className="tooltip-row">
                        <span>Esiti mortali:</span>
                        <strong style={{ color: "#ff8b80" }}>{exactNumber(p.mortali)}</strong>
                      </div>
                    )}
                  </div>
                );
              }}
            />
          </Treemap>
        </ResponsiveContainer>
      </div>

      {/* Tabella / Legenda descrittiva dei principali comparti */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: "var(--space-2)",
          fontSize: "0.82rem",
        }}
      >
        {treemapData.slice(0, 6).map((item, idx) => (
          <div
            key={item.key}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "6px 10px",
              background: "var(--color-surface)",
              borderRadius: "4px",
              borderLeft: `4px solid ${item.color}`,
            }}
          >
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "65%" }}>
              {item.name}
            </span>
            <span style={{ fontWeight: 650, fontVariantNumeric: "tabular-nums" }}>
              {compactNumber(item.casi)} ({item.quota.toFixed(1)}%)
            </span>
          </div>
        ))}
      </div>

      <p className="source-note">
        Grafico a blocchi (Treemap ATECO): la superficie di ciascun blocco è proporzionale al volume degli infortuni denunciati nel comparto per l&apos;anno selezionato ({anno}). Casi senza codice settore attribuito (ND): {exactNumber(casiND)} ({percND}% del totale).
      </p>
    </div>
  );
}