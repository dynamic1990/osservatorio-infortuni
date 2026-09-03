import type { Metadata } from "next";
import { MalattieKpi } from "@/components/charts/malattie-kpi";
import { MalattieAndamentoWidget } from "@/components/charts/malattie-andamento-widget";
import { MalattiePatologieWidget } from "@/components/charts/malattie-patologie-widget";
import { MalattieRegioniWidget } from "@/components/charts/malattie-regioni-widget";
import { MalattieDecessiWidget } from "@/components/charts/malattie-decessi-widget";
import { InfoModalButton } from "@/components/ui/info-modal";

export const revalidate = 86_400;

export const metadata: Metadata = {
  title: "Malattie Professionali | Osservatorio Infortuni sul Lavoro",
  description:
    "Dashboard sulle malattie professionali in Italia: denunce INAIL a confronto tra i semestri 2025 e 2026, patologie ICD-10 più denunciate, distribuzione per regione e decessi per malattia professionale riconosciuta (2020-2024).",
};

export default function MalattieProfessionaliPage() {
  return (
    <div className="container" style={{ display: "grid", gap: "var(--space-6)", paddingTop: "var(--space-2)" }}>
      {/* Header */}
      <header
        style={{
          background: "var(--color-raised)",
          border: "1px solid var(--color-divider)",
          padding: "var(--space-6)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "var(--space-3)", marginBottom: "var(--space-2)" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", marginBottom: "var(--space-1)" }}>
              <span
                style={{
                  background: "var(--color-accent)",
                  color: "#ffffff",
                  fontSize: "0.72rem",
                  fontWeight: 750,
                  padding: "2px 8px",
                  borderRadius: "4px",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Malattie professionali
              </span>
              <span style={{ fontSize: "0.82rem", color: "var(--color-text-muted)" }}>
                Open Data INAIL
              </span>
            </div>
            <h1 style={{ fontSize: "1.85rem", fontWeight: 800, margin: "0 0 var(--space-1)", letterSpacing: "-0.02em" }}>
              Osservatorio Malattie Professionali
            </h1>
            <p style={{ color: "var(--color-text-soft)", margin: 0, maxWidth: "78ch", fontSize: "0.95rem" }}>
              Le malattie professionali raccontano il lato meno visibile della sicurezza sul lavoro:
              patologie che emergono dopo anni di esposizione a rumore, sovraccarico biomeccanico,
              polveri e agenti cancerogeni. Denunce protocollate a confronto tra i primi semestri
              2025 e 2026, raggruppamento clinico ICD-10, distribuzione territoriale e decessi
              riconosciuti nel quinquennio 2020-2024.
            </p>
            <div style={{ marginTop: "var(--space-2)", fontSize: "0.82rem", color: "var(--color-text-muted)" }}>
              Progetto a cura di{" "}
              <strong style={{ color: "var(--color-text)" }}>Ing. Damiano Salvati</strong>
            </div>
          </div>
          <InfoModalButton />
        </div>
      </header>

      {/* KPI di sintesi */}
      <section className="card" aria-label="Sintesi malattie professionali">
        <MalattieKpi />
      </section>

      {/* Andamento mensile confronto semestri */}
      <section className="card" aria-label="Andamento mensile denunce">
        <div className="card-header">
          <h2 className="card-title">Denunce mensili: I semestre 2025 vs 2026</h2>
          <p className="card-desc">
            Il confronto mese per mese a pari periodo mostra un aumento diffuso delle denunce di
            malattia professionale protocollate nel primo semestre 2026 rispetto allo stesso periodo
            del 2025.
          </p>
        </div>
        <MalattieAndamentoWidget />
      </section>

      {/* Patologie */}
      <section className="card" aria-label="Patologie denunciate">
        <div className="card-header">
          <h2 className="card-title">Le patologie più denunciate</h2>
          <p className="card-desc">
            I codici ICD-10 del dataset INAIL sono raggruppati in categorie cliniche leggibili:
            il quadro è dominato dalle malattie muscolo-scheletriche da sovraccarico biomeccanico,
            seguite da ipoacusia da rumore e sindromi canalicolari. Tocca una voce per i codici
            specifici più frequenti.
          </p>
        </div>
        <MalattiePatologieWidget />
      </section>

      {/* Mappa regionale */}
      <section className="card" aria-label="Distribuzione territoriale">
        <div className="card-header">
          <h2 className="card-title">Distribuzione territoriale delle denunce</h2>
          <p className="card-desc">
            La geografia delle denunce riflette la sede INAIL competente per la protocollazione:
            un indicatore dell&apos;attività di denuncia e gestione, non della distribuzione del rischio.
          </p>
        </div>
        <MalattieRegioniWidget />
      </section>

      {/* Decessi */}
      <section className="card" aria-label="Decessi per malattia professionale">
        <div className="card-header">
          <h2 className="card-title">Decessi per malattia professionale riconosciuta</h2>
          <p className="card-desc">
            L&apos;eredità più pesante delle esposizioni professionali: i decessi riconosciuti
            dall&apos;INAIL nel quinquennio 2020-2024, con il peso delle malattie da amianto
            (silicosi e asbestosi) che continuano a manifestarsi a distanza di decenni.
          </p>
        </div>
        <MalattieDecessiWidget />
      </section>
    </div>
  );
}
