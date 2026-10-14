import type { Metadata } from "next";
import { CronacaInfortuniClient } from "@/components/charts/cronaca-infortuni-client";

export const revalidate = 86_400;

export const metadata: Metadata = {
  title: "Cronaca di infortuni | Osservatorio Infortuni sul Lavoro",
  description:
    "Rassegna stampa automatica degli infortuni gravi e mortali sul lavoro in Italia: archivio a 365 giorni, KPI di periodo, mappa regionale e timeline filtrabile per categoria, regione, periodo e parole chiave. Indicatore congiunturale della cronaca, non dati INAIL.",
  alternates: { canonical: "/cronaca-infortuni" },
};

export default function CronacaInfortuniPage() {
  return (
    <div className="container" style={{ display: "grid", gap: "var(--space-6)", paddingTop: "var(--space-2)" }}>
      {/* 1. Header Istituzionale */}
      <header
        style={{
          background: "var(--color-raised)",
          border: "1px solid var(--color-divider)",
          padding: "var(--space-6)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            flexWrap: "wrap",
            gap: "var(--space-3)",
            marginBottom: "var(--space-2)",
          }}
        >
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "var(--space-2)",
                marginBottom: "var(--space-1)",
              }}
            >
              <span
                style={{
                  background: "var(--color-accent)",
                  color: "var(--color-raised)",
                  fontSize: "0.72rem",
                  fontWeight: 750,
                  padding: "2px 8px",
                  borderRadius: "4px",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Rassegna stampa automatica
              </span>
              <span style={{ fontSize: "0.82rem", color: "var(--color-text-muted)" }}>
                Google News RSS · aggiornamento giornaliero
              </span>
            </div>
            <h1 style={{ fontSize: "1.85rem", fontWeight: 800, margin: "0 0 var(--space-1)", letterSpacing: "-0.02em" }}>
              Cronaca di infortuni
            </h1>
            <p style={{ color: "var(--color-text-soft)", margin: 0, maxWidth: "78ch", fontSize: "0.95rem" }}>
              Gli infortuni gravi e mortali sul lavoro raccontati dalla cronaca italiana, giorno per giorno.
              Una rassegna automatica interroga le testate nazionali e locali, filtra i fatti pertinenti e li
              ordina in una timeline. Ogni voce è classificata in base al contenuto: {"mortale"} quando
              racconta un infortunio con esito fatale, {"grave"} quando l&apos;evento non è mortale ma ha
              provocato conseguenze serie (amputazioni, prognosi riservata), {"analisi"} per gli
              approfondimenti che commentano i numeri e il fenomeno: bilanci di periodo, dati INAIL, appelli,
              cerimonie e processi, anche quando citano &ldquo;morti sul lavoro&rdquo;. Il tag riflette la natura
              dell&apos;articolo e non cambia con il passare del tempo. I numeri di questa pagina sono un
              indicatore congiunturale della rassegna stampa: <strong>non sostituiscono</strong> i dati
              ufficiali INAIL, disponibili nella sezione statistiche.
            </p>
            <div style={{ marginTop: "var(--space-2)", fontSize: "0.82rem", color: "var(--color-text-muted)" }}>
              Finestra di osservazione: archivio fino a 365 giorni · ogni voce rimanda all&apos;articolo originale
            </div>
          </div>
        </div>
      </header>

      {/* 2. Contenuto interattivo */}
      <CronacaInfortuniClient />
    </div>
  );
}