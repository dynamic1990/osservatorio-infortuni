import { redirect } from "next/navigation";

// Redirect permanente: la rotta storica /casi-mortali ora vive in /analisi-delle-cause.
// Mantenuta per compatibilità con link esterni, segnalibri e motori di ricerca.
export const dynamic = "force-static";

export default function CasiMortaliRedirect() {
  redirect("/analisi-delle-cause");
}