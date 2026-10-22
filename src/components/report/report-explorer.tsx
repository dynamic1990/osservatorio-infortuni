"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Scale, Search, ShieldCheck, TrendingUp, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";

type AreaId = "dati-tendenze" | "sicurezza-vigilanza" | "normativa-tutele";

export interface ReportItem {
  href: string;
  name: string;
  title: string;
  date: string;
  isoDate: string;
  description: string;
  tags: string[];
  area: AreaId;
}

interface ReportExplorerProps {
  reports: ReportItem[];
  latestDate: string;
}

interface AreaMeta {
  label: string;
  description: string;
  icon: LucideIcon;
}

const AREE: Record<AreaId, AreaMeta> = {
  "dati-tendenze": {
    label: "Dati e tendenze",
    description:
      "I numeri complessivi dell'Osservatorio: infortuni, malattie professionali e andamenti nel tempo.",
    icon: TrendingUp,
  },
  "sicurezza-vigilanza": {
    label: "Sicurezza e vigilanza",
    description:
      "Controlli, ispezioni e i luoghi di lavoro dove il rischio è più alto.",
    icon: ShieldCheck,
  },
  "normativa-tutele": {
    label: "Normativa e tutele",
    description:
      "Le regole da conoscere quando accade un infortunio e come funziona il riconoscimento.",
    icon: Scale,
  },
};

const AREE_IDS = Object.keys(AREE) as AreaId[];

export default function ReportExplorer({ reports, latestDate }: ReportExplorerProps) {
  const [area, setArea] = useState<AreaId | "tutti">("tutti");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return reports.filter((r) => {
      if (area !== "tutti" && r.area !== area) return false;
      if (!q) return true;
      const haystack = `${r.title} ${r.description} ${r.tags.join(" ")} ${r.name}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [reports, area, query]);

  const countFor = (a: AreaId | "tutti") =>
    a === "tutti" ? reports.length : reports.filter((r) => r.area === a).length;

  const visibleAree = AREE_IDS.filter((a) => filtered.some((r) => r.area === a));

  const selectArea = (a: AreaId | "tutti") => {
    setArea(a);
    setQuery("");
    if (a !== "tutti") {
      requestAnimationFrame(() => {
        document
          .getElementById(`area-${a}`)
          ?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }
  };

  const reset = () => {
    setArea("tutti");
    setQuery("");
  };

  return (
    <div style={{ display: "grid", gap: "var(--space-6)" }}>
      {/* Filtri: area tematica + ricerca, stessa riga su desktop */}
      <section aria-label="Filtra i report" style={{ display: "grid", gap: "var(--space-3)" }}>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "var(--space-2)",
            alignItems: "center",
          }}
        >
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "var(--space-2)",
              alignItems: "center",
            }}
          >
            <span className="metric-label" style={{ marginRight: "var(--space-1)" }}>
              Filtra per tema
            </span>
            <button
              type="button"
              className={`btn-pill ${area === "tutti" ? "active" : ""}`}
              aria-pressed={area === "tutti"}
              onClick={() => selectArea("tutti")}
            >
              Tutti
              <span style={{ marginLeft: 8, opacity: 0.75, fontSize: "0.72rem" }}>{countFor("tutti")}</span>
            </button>
            {AREE_IDS.map((a) => (
              <button
                key={a}
                type="button"
                className={`btn-pill ${area === a ? "active" : ""}`}
                aria-pressed={area === a}
                onClick={() => selectArea(a)}
              >
                {AREE[a].label}
                <span style={{ marginLeft: 8, opacity: 0.75, fontSize: "0.72rem" }}>{countFor(a)}</span>
              </button>
            ))}
          </div>

          <div
            role="search"
            style={{
              position: "relative",
              width: 280,
              maxWidth: "100%",
              minWidth: 200,
              marginLeft: "auto",
              flexShrink: 1,
            }}
          >
            <Search
              aria-hidden="true"
              size={15}
              style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--color-text-muted)" }}
            />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cerca nei report…"
              aria-label="Cerca nei report"
              style={{
                width: "100%",
                border: "1px solid var(--color-border)",
                borderRadius: "var(--radius-md)",
                background: "var(--color-raised)",
                color: "var(--color-text)",
                padding: "6px 30px 6px 32px",
                fontSize: "0.84rem",
                minHeight: 34,
              }}
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label="Cancella la ricerca"
                style={{
                  position: "absolute",
                  right: 7,
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--color-text-muted)",
                  display: "inline-flex",
                  padding: 4,
                }}
              >
                <X aria-hidden="true" size={15} />
              </button>
            )}
          </div>
        </div>
      </section>

      <p role="status" style={{ margin: 0, color: "var(--color-text-muted)", fontSize: "0.82rem" }}>
        {filtered.length} report disponibili
        {area !== "tutti" ? ` · ${AREE[area].label}` : ""}
        {query.trim() ? ` · ricerca «${query.trim()}»` : ""}
        {" · "}aggiornati al {latestDate}
      </p>

      {filtered.length === 0 ? (
        <div className="card" style={{ display: "grid", gap: "var(--space-3)", justifyItems: "start" }}>
          <p style={{ margin: 0, fontWeight: 600 }}>Nessun report trovato.</p>
          <p style={{ margin: 0, color: "var(--color-text-soft)" }}>
            Prova con un&apos;altra parola chiave o togli il filtro per tema.
          </p>
          <button type="button" className="btn-pill" onClick={reset} style={{ cursor: "pointer" }}>
            Mostra tutti i report
          </button>
        </div>
      ) : (
        visibleAree.map((a) => {
          const meta = AREE[a];
          const Icon = meta.icon;
          const areaItems = filtered.filter((r) => r.area === a);
          const isActiveFilter = area === a;
          return (
            <section
              key={a}
              id={`area-${a}`}
              aria-labelledby={`area-title-${a}`}
              style={{
                display: "grid",
                gap: "var(--space-4)",
                borderLeft: isActiveFilter ? "3px solid var(--color-accent)" : "1px solid var(--color-divider)",
                paddingLeft: isActiveFilter ? "var(--space-4)" : "calc(var(--space-4) - 1px)",
                paddingTop: "var(--space-1)",
              }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", gap: "var(--space-3)" }}>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 40,
                    height: 40,
                    border: "1px solid var(--color-border)",
                    background: "var(--color-surface)",
                    flexShrink: 0,
                  }}
                >
                  <Icon aria-hidden="true" size={20} strokeWidth={1.8} />
                </span>
                <div style={{ minWidth: 0 }}>
                  <h2 id={`area-title-${a}`} style={{ margin: 0, fontSize: "1.35rem" }}>
                    {meta.label}
                  </h2>
                  <p style={{ margin: "2px 0 0", color: "var(--color-text-soft)", fontSize: "0.86rem", lineHeight: 1.5 }}>
                    {meta.description}
                  </p>
                </div>
                <span
                  className="btn-pill"
                  style={{ cursor: "default", fontSize: "0.74rem", minHeight: 26, marginLeft: "auto", flexShrink: 0 }}
                >
                  {areaItems.length} report
                </span>
              </div>

              <div style={{ display: "grid", gap: "var(--space-4)" }}>
                {areaItems.map((report) => (
                  <article key={report.href} className="card" style={{ display: "grid", gap: "var(--space-3)" }}>
                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        justifyContent: "space-between",
                        gap: "var(--space-2)",
                        alignItems: "center",
                      }}
                    >
                      <span className="eyebrow" style={{ margin: 0 }}>{report.name}</span>
                      <time dateTime={report.isoDate} style={{ color: "var(--color-text-muted)", fontSize: "0.82rem" }}>
                        Pubblicato il {report.date}
                      </time>
                    </div>
                    <h3
                      style={{
                        margin: 0,
                        fontSize: "clamp(1.35rem, 3.6vw, 1.85rem)",
                        maxWidth: "28ch",
                        fontWeight: 650,
                      }}
                    >
                      <Link href={report.href} style={{ color: "var(--color-text)", textDecoration: "none" }}>
                        {report.title}
                      </Link>
                    </h3>
                    <p style={{ margin: 0, color: "var(--color-text-soft)", lineHeight: 1.6 }}>{report.description}</p>
                    <div
                      style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-2)", alignItems: "center" }}
                      aria-label="Argomenti del report"
                    >
                      {report.tags.map((tag) => (
                        <span key={tag} className="btn-pill" style={{ cursor: "default", fontSize: "0.76rem", minHeight: 30 }}>
                          {tag}
                        </span>
                      ))}
                      <Link href={report.href} className="btn-pill" style={{ marginLeft: "auto", textDecoration: "none" }}>
                        Leggi il report <ArrowRight aria-hidden="true" size={16} />
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          );
        })
      )}
    </div>
  );
}