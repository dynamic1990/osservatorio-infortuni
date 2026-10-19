import type { Metadata } from "next";
import { AnalisiCauseContent } from "./analisi-cause-content";

export const revalidate = 86_400;

export const metadata: Metadata = {
  title: "Analisi delle cause | Infor.MO INAIL",
  description:
    "Analisi di dettaglio dei casi mortali e gravi sul lavoro dell'archivio Infor.MO INAIL 2010-2024: dinamica degli eventi, settori e territori a maggior rischio, profilo dei lavoratori e delle aziende coinvolti. Consulta solo i mortali, solo i gravi o entrambi.",
  alternates: { canonical: "/analisi-delle-cause" },
};

export default function AnalisiCausePage() {
  return <AnalisiCauseContent />;
}
