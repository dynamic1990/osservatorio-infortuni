"use client";

// Barra di ripartizione di genere con percentuali, stile coerente tra sezioni.

export function QuotaGenere({
  maschi,
  femmine,
  compact = false,
}: {
  maschi: number;
  femmine: number;
  compact?: boolean;
}) {
  const tot = maschi + femmine;
  if (tot <= 0) return <span style={{ fontSize: "0.78rem", color: "var(--color-text-muted)" }}>Genere n.d.</span>;
  const pM = Math.round((maschi / tot) * 100);
  const pF = 100 - pM;

  return (
    <div style={{ display: "grid", gap: 4 }}>
      <div
        style={{
          display: "flex",
          height: compact ? 6 : 8,
          borderRadius: 4,
          overflow: "hidden",
          background: "var(--color-divider)",
        }}
      >
        <div style={{ width: `${pM}%`, background: "var(--color-link)" }} />
        <div style={{ width: `${pF}%`, background: "var(--color-accent)" }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: compact ? "0.72rem" : "0.78rem", color: "var(--color-text-soft)" }}>
        <span><strong style={{ color: "var(--color-link)" }}>{maschi.toLocaleString("it-IT")}</strong> M ({pM}%)</span>
        <span><strong style={{ color: "var(--color-accent)" }}>{femmine.toLocaleString("it-IT")}</strong> F ({pF}%)</span>
      </div>
    </div>
  );
}
