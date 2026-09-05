"use client";

import { useState, useEffect, type ReactNode } from "react";

// Bottone "Metodologia, Formule e Fonti" con modale, come nelle altre pagine.
// La home usa il contenuto di default (formule della piattaforma); le altre
// pagine possono passare un contenuto dedicato con `children`.
export function InfoModalButton({ children }: { children?: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="btn-info-header"
        aria-label="Metodologie, formule e fonti dei dati"
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="16" x2="12" y2="12"></line>
          <line x1="12" y1="8" x2="12.01" y2="8"></line>
        </svg>
        <span>Metodologia, Formule e Fonti</span>
      </button>

      {isOpen && (
        <div className="modal-backdrop" onClick={() => setIsOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <div className="modal-header">
              <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                <span className="modal-badge">Documentazione Tecnica</span>
                <h2 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 750 }}>
                  Metodologie di Calcolo, Formule e Fonti Ufficiali
                </h2>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="modal-close-btn"
                aria-label="Chiudi finestra"
              >
                &times;
              </button>
            </div>

            <div className="modal-body">
              {children ?? (
                <>
                  {/* 1. FORMULE */}
                  <section className="modal-section">
                    <h3 className="modal-section-title">1. Formule e Indicatori Statistici</h3>

                    <div className="formula-box">
                      <div className="formula-name">Tasso di Incidenza Infortunistico (standard 1.000 occupati)</div>
                      <div className="formula-math">
                        Tasso di Incidenza = (Numero Infortuni / Numero Occupati) &times; 1.000
                      </div>
                      <p className="formula-desc">
                        Rappresenta il numero medio di infortuni sul lavoro denunciati ogni 1.000 lavoratori occupati. Normalizza il dato eliminando la distorsione determinata dalla diversa grandezza demografica e produttiva dei territori e dei comparti economici.
                      </p>
                    </div>

                    <div className="formula-box">
                      <div className="formula-name">Tasso di Mortalità Infortunistica</div>
                      <div className="formula-math">
                        Tasso Mortalità = (Numero Infortuni Mortali / Numero Occupati) &times; 1.000
                      </div>
                      <p className="formula-desc">
                        Frequenza degli eventi infortunistici mortali accertati o denunciati in rapporto alla platea dei lavoratori occupati.
                      </p>
                    </div>

                    <div className="formula-box">
                      <div className="formula-name">Durata Media dell&apos;Inabilità Temporanea (Gravità Media per Evento)</div>
                      <div className="formula-math">
                        Durata Media (giorni) = Totale Giornate Indennizzate / Numero Infortuni Indennizzati
                      </div>
                      <p className="formula-desc">
                        Misura il numero medio di giornate di assenza per inabilità assoluta temporanea indennizzate dall&apos;INAIL per ciascun infortunio riconosciuto.
                      </p>
                    </div>

                    <div className="formula-box">
                      <div className="formula-name">Indice di Gravità / Tasso Giornate Perse</div>
                      <div className="formula-math">
                        Indice di Gravità = (Totale Giornate Indennizzate / Numero Occupati) &times; 1.000
                      </div>
                      <p className="formula-desc">
                        Misura il volume complessivo di giornate lavorative perse a causa di infortuni per ogni 1.000 lavoratori occupati (in linea con le linee guida INAIL e la norma tecnica UNI 7249).
                      </p>
                    </div>
                  </section>

                  {/* 2. FONTI DEI DATI */}
                  <section className="modal-section">
                    <h3 className="modal-section-title">2. Fonti Ufficiali e Origine dei Dati</h3>
                    <ul className="modal-list">
                      <li>
                        <strong>INAIL Open Data (Dati Consolidati Semestrali 2020–2024):</strong> microdati elementari e tabelle B1–B7 estratti dagli archivi ufficiali INAIL (cadenza semestrale), comprendenti esito amministrativo, grado di menomazione (D.Lgs. 38/2000), giornate indennizzate, gestione assicurativa, classificazione ATECO e provincia/regione di accadimento (3.024.370 record consolidati).
                      </li>
                      <li>
                        <strong>INAIL Open Data (Flussi mensili 2025–2026):</strong> dati provvisori mensili da inizio anno (YTD), con ultimo mese disponibile giugno 2026 e confronto a pari periodo con il 2025.
                      </li>
                      <li>
                        <strong>ISTAT &amp; Eurostat (Denominatori Occupazionali):</strong> dati della Rilevazione sulle Forze di Lavoro (RCFL) per regione (Eurostat NUTS2 <code>lfst_r_lfe2emp</code>) e per sezione di attività economica ATECO 2007 (lettere A–U).
                      </li>
                    </ul>
                  </section>

                  {/* 3. PARTICOLARITÀ TERRITORIALI */}
                  <section className="modal-section">
                    <h3 className="modal-section-title">3. Trattamento del Trentino-Alto Adige e Province Autonome</h3>
                    <p className="modal-text">
                      Negli standard Eurostat NUTS2 il Trentino-Alto Adige è censito separatamente nelle due Province Autonome:
                      <strong> P.A. di Bolzano / Bozen (ITH1)</strong> e <strong>P.A. di Trento (ITH2)</strong>.
                      La piattaforma aggrega correttamente entrambi i territori sia a livello regionale unitario (Regione 04: ~496.000 occupati nel 2024) sia con la possibilità di analizzare autonomamente le due province nel ranking e nella scheda di dettaglio.
                    </p>
                  </section>

                  {/* 4. DEFINIZIONI NORMATIVE */}
                  <section className="modal-section">
                    <h3 className="modal-section-title">4. Definizioni e Classificazioni</h3>
                    <div className="modal-grid-definitions">
                      <div>
                        <strong>In occasione di lavoro vs In itinere:</strong>
                        <span>Gli infortuni in occasione di lavoro avvengono durante lo svolgimento dell&apos;attività lavorativa; gli infortuni in itinere avvengono durante il tragitto di andata e ritorno tra abitazione e luogo di lavoro.</span>
                      </div>
                      <div>
                        <strong>Gradi di menomazione (D.Lgs. 38/2000):</strong>
                        <span>0–5% (franchigia, nessun danno permanente indennizzato), 6–15% (indennizzo del danno biologico in capitale), 16%+ (indennizzo mediante rendita diretta a vita).</span>
                      </div>
                    </div>
                  </section>
                </>
              )}
            </div>

            <div className="modal-footer">
              <span style={{ fontSize: "0.8rem", color: "var(--color-text-soft)" }}>
                Piattaforma di pubblico interesse basata esclusivamente su Open Data verificabili.
              </span>
              <button onClick={() => setIsOpen(false)} className="btn-pill btn-pill-accent active">
                Chiudi
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
