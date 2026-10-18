import type { Metadata } from "next";
import { Newspaper } from "lucide-react";
import ReportExplorer, { type ReportItem } from "@/components/report/report-explorer";

export const metadata: Metadata = {
  title: "Report | Osservatorio Infortuni sul Lavoro",
  description:
    "Report brevi sui dati INAIL: infortuni, morti sul lavoro, malattie professionali, vigilanza e cause, con fonti e metodo.",
  alternates: { canonical: "/report" },
};

const REPORT: ReportItem[] = [
  {
    href: "/report/vigilanza-sul-lavoro",
    name: "Report vigilanza sul lavoro",
    title: "Vigilanza sul lavoro in Italia: ispezioni, lavoro nero e violazioni (2021-2025)",
    date: "17 ottobre 2026",
    isoDate: "2026-10-17",
    description:
      "112.768 ispezioni definite nel 2025 e il 74% delle aziende irregolari: controlli INL, lavoratori in nero, sospensioni, violazioni sicurezza e patente a crediti, con i dati ufficiali.",
    tags: ["Vigilanza", "Lavoro nero", "Ispezioni INL", "Patente a crediti"],
    area: "sicurezza-vigilanza",
  },
  {
    href: "/report/malattie-professionali-piu-denunciate",
    name: "Report malattie professionali",
    title: "Malattie professionali più denunciate in Italia (dati 2025-2026)",
    date: "17 ottobre 2026",
    isoDate: "2026-10-17",
    description:
      "98.312 denunce nel 2025, record da 26 anni: le patologie più comuni (rachide, spalla, tunnel carpale), i decessi e perché i numeri crescono, con i dati INAIL.",
    tags: ["Malattie professionali", "Dati INAIL", "Sovraccarico biomeccanico"],
    area: "dati-tendenze",
  },
  {
    href: "/report/lavori-piu-pericolosi-in-italia",
    name: "Report lavori più pericolosi",
    title: "Lavori più pericolosi in Italia: settori e cause delle morti sul lavoro",
    date: "16 ottobre 2026",
    isoDate: "2026-10-16",
    description:
      "Agricoltura e costruzioni in testa alle morti sul lavoro nei casi analizzati da Infor.MO (2014-2024): 2.617 casi, la caduta dall'alto come prima causa, i settori e i profili delle vittime, con dati INAIL.",
    tags: ["Morti sul lavoro", "Infor.MO", "Settori a rischio"],
    area: "sicurezza-vigilanza",
  },
  {
    href: "/report/infortunio-in-itinere",
    name: "Report infortunio in itinere",
    title: "Infortunio in itinere: cos'è, quando è riconosciuto, quanti casi in Italia",
    date: "16 ottobre 2026",
    isoDate: "2026-10-16",
    description:
      "106.581 denunce in itinere nel 2025, in crescita costante. La normativa (art. 12 D.Lgs. 38/2000), i requisiti di riconoscimento, la classifica per regione e i dati aggiornati del primo semestre 2026.",
    tags: ["Infortunio in itinere", "Normativa", "Dati INAIL"],
    area: "normativa-tutele",
  },
  {
    href: "/report/relazione-annuale-inail-2025",
    name: "Report Relazione annuale INAIL",
    title: "Relazione annuale INAIL 2025: meno morti sul lavoro, boom di malattie professionali",
    date: "23 settembre 2026",
    isoDate: "2026-09-23",
    description:
      "1.198 morti sul lavoro (-3,3%), 600.000 denunce di infortunio e 98.312 malattie professionali, record degli ultimi 26 anni. I dati presentati alla Camera e il PDF ufficiale.",
    tags: ["Relazione annuale", "Morti sul lavoro", "Malattie professionali", "Scarica PDF"],
    area: "dati-tendenze",
  },
  {
    href: "/report/infortuni-1-semestre-2026",
    name: "Report overview infortuni",
    title: "Infortuni sul lavoro, primo semestre 2026: più denunce, meno casi mortali",
    date: "16 settembre 2026",
    isoDate: "2026-09-16",
    description:
      "Quanti infortuni sono stati denunciati nei primi sei mesi del 2026? Il confronto con il 2025, la crescita dell'itinere e il calo dei casi mortali.",
    tags: ["Infortuni", "Morti sul lavoro", "Dati INAIL"],
    area: "dati-tendenze",
  },
];

export default function ReportIndexPage() {
  return (
    <main
      className="container"
      style={{
        display: "grid",
        gap: "var(--space-6)",
        paddingTop: "var(--space-5)",
        paddingBottom: "var(--space-8)",
      }}
    >
      <header style={{ borderLeft: "4px solid var(--color-accent)", paddingLeft: "var(--space-4)" }}>
        <p className="eyebrow" style={{ margin: 0 }}>REPORT · DATI E CONTESTO</p>
        <h1 style={{ margin: "var(--space-2) 0 var(--space-2)" }}>Report</h1>
        <p style={{ margin: 0, maxWidth: "70ch" }}>
          Report brevi per chi vuole i numeri senza navigare l&apos;intera app. Ogni report parte da una domanda
          frequente, risponde con i dati aggiornati e incrocia le fonti dell&apos;Osservatorio: infortuni,
          malattie professionali, vigilanza, cause e casi mortali. Lettura in cinque minuti, ogni numero con la
          sua fonte.
        </p>
      </header>

      <section aria-labelledby="report-esplora">
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "var(--space-2)",
            marginBottom: "var(--space-3)",
          }}
        >
          <Newspaper aria-hidden="true" size={22} strokeWidth={1.8} />
          <h2 id="report-esplora" style={{ margin: 0, fontSize: "1.45rem" }}>
            Esplora i report
          </h2>
        </div>
        <ReportExplorer reports={REPORT} latestDate="17 ottobre 2026" />
      </section>
    </main>
  );
}