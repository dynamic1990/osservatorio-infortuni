"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

interface CausaQuota {
  causa: string;
  casi: number;
  quota: number;
}

interface SettoreCause {
  settore: string;
  casi: number;
  casiConCausa: number;
  cause: CausaQuota[];
}

interface CauseSettori {
  meta?: {
    nota?: string;
    criteri?: {
      casiTotali?: number;
      casiConSettore?: number;
      casiConIncrocio?: number;
    };
  };
  settori: SettoreCause[];
}

// Mostra per ogni settore economico le cause prevalenti con quota percentuale.
// Card espandibili: il settore si apre e mostra le cause ordinali.
export function CausePerSettore() {
  const [dati, setDati] = useState<CauseSettori | null>(null);
  const [aperti, setAperti] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetch("/data/informo-cause-settori.json")
      .then((r) => r.json())
      .then((d) => setDati(d as CauseSettori))
      .catch(() => setDati(null));
  }, []);

  const toggle = (settore: string) => {
    setAperti((prev) => {
      const next = new Set(prev);
      if (next.has(settore)) next.delete(settore);
      else next.add(settore);
      return next;
    });
  };

  // Ordina per casi desc, poi per nome.
  const settoriOrdinati = useMemo(
    () => [...(dati?.settori ?? [])].sort((a, b) => b.casi - a.casi),
    [dati]
  );

  const copertura = dati?.meta?.criteri;

  if (!dati) {
    return (
      <p className="source-note" aria-live="polite">
        Caricamento incrocio causa &times; settore&hellip;
      </p>
    );
  }

  return (
    <div style={{ display: "grid", gap: "var(--space-3)" }}>
      {/* Nota di copertura */}
      {copertura && (
        <p className="source-note" style={{ marginBottom: 0 }}>
          Incrocio calcolato su {copertura.casiConIncrocio?.toLocaleString("it-IT")} casi su{" "}
          {copertura.casiTotali?.toLocaleString("it-IT")} con settore e causa classificati
          (periodo 2020-2024). Quote riferite al totale casi del settore.
        </p>
      )}

      {settoriOrdinati.map((s) => {
        const aperto = aperti.has(s.settore);
        return (
          <div
            key={s.settore}
            style={{
              border: "1px solid var(--color-divider)",
              background: "var(--color-raised)",
              borderRadius: "6px",
              overflow: "hidden",
            }}
          >
            <button
              type="button"
              onClick={() => toggle(s.settore)}
              aria-expanded={aperto}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "var(--space-3)",
                padding: "var(--space-3) var(--space-4)",
                background: "none",
                border: "none",
                cursor: "pointer",
                textAlign: "left",
                font: "inherit",
                color: "var(--color-text)",
              }}
            >
              <span style={{ display: "grid", gap: 2, minWidth: 0 }}>
                <strong style={{ fontSize: "0.92rem", lineHeight: 1.3 }}>{s.settore}</strong>
                <span style={{ fontSize: "0.78rem", color: "var(--color-text-soft)" }}>
                  {s.casi.toLocaleString("it-IT")} casi · {s.casiConCausa.toLocaleString("it-IT")} con causa classificata
                </span>
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", flexShrink: 0 }}>
                <span
                  style={{
                    fontSize: "0.78rem",
                    fontWeight: 700,
                    color: "var(--color-accent)",
                    border: "1px solid var(--color-divider)",
                    borderRadius: "999px",
                    padding: "2px 10px",
                  }}
                >
                  {s.cause.length} cause
                </span>
                {aperto ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </span>
            </button>

            {aperto && (
              <div
                style={{
                  borderTop: "1px solid var(--color-divider)",
                  padding: "var(--space-3) var(--space-4)",
                  display: "grid",
                  gap: "var(--space-2)",
                }}
              >
                {s.cause.map((c, i) => (
                  <div key={c.causa} style={{ display: "grid", gap: 4 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: "var(--space-2)", fontSize: "0.82rem" }}>
                      <span style={{ color: "var(--color-text)" }}>
                        <strong style={{ marginRight: 6 }}>{i + 1}.</strong>
                        {c.causa}
                      </span>
                      <strong style={{ flexShrink: 0, color: "var(--color-text-soft)" }}>
                        {c.casi} ({c.quota.toLocaleString("it-IT", { maximumFractionDigits: 1 })}%)
                      </strong>
                    </div>
                    <div
                      role="progressbar"
                      aria-valuenow={c.quota}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label={`${c.causa}: ${c.quota}%`}
                      style={{
                        height: 4,
                        borderRadius: 999,
                        background: "var(--color-divider)",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          height: "100%",
                          width: `${Math.min(c.quota, 100)}%`,
                          background: "var(--color-accent)",
                        }}
                      />
                    </div>
                  </div>
                ))}
                {s.cause.length === 0 && (
                  <p className="source-note" style={{ margin: 0 }}>
                    Nessuna causa classificata per questo settore.
                  </p>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}