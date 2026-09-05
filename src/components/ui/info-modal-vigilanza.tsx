"use client";

import { useState, useEffect } from "react";

export function InfoModalVigilanza() {
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
                  Vigilanza sul lavoro: Metodologie, Formule e Fonti Ufficiali
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
              {/* 1. FORMULE */}
              <section className="modal-section">
                <h3 className="modal-section-title">1. Formule e Indicatori Statistici</h3>
                <div className="formula-box">
                  <div className="formula-name">Tasso di Irregolarità</div>
                  <div className="formula-math">
                    Tasso di Irregolarità = (Ispezioni Definite con Esito Irregolare / Totale Ispezioni Definite) &times; 100
                  </div>
                  <p className="formula-desc">
                    Quota delle ispezioni concluse nell&apos;anno in cui sono stati accertati illeciti. È l&apos;indicatore
                    principale dell&apos;efficacia selettiva della vigilanza: negli ultimi anni si attesta stabilmente
                    attorno al 72-74%, con differenze significative tra ambito lavoristico, previdenziale e assicurativo.
                  </p>
                </div>

                <div className="formula-box">
                  <div className="formula-name">Provvedimenti di Sospensione (art. 14 D.Lgs. 81/2008)</div>
                  <div className="formula-math">
                    Sospensione = impiego di personale non risultante dalla documentazione obbligatoria &ge; 10% dei presenti, oppure gravi violazioni in materia di salute e sicurezza (Allegato I)
                  </div>
                  <p className="formula-desc">
                    Dal D.L. 146/2021 la soglia per il lavoro nero è scesa dal 20% al 10% e la sospensione per gravi
                    violazioni in materia di sicurezza non richiede più la reiterazione. I provvedimenti sono quasi
                    sempre seguiti dalla revoca a seguito di regolarizzazione (83-89%).
                  </p>
                </div>

                <div className="formula-box">
                  <div className="formula-name">Recupero Contributi e Premi Evasi</div>
                  <div className="formula-math">
                    Recupero (€) = Contributi INPS non versati accertati + Premi INAIL non versati accertati
                  </div>
                  <p className="formula-desc">
                    Importo complessivo contestato al termine dell&apos;attività ispettiva, comprensivo degli interessi
                    legali e delle sanzioni civili. Misura la capacità di riportare nella legalità posizioni contributive
                    e assicurative irregolari.
                  </p>
                </div>
              </section>

              {/* 2. FONTI DEI DATI */}
              <section className="modal-section">
                <h3 className="modal-section-title">2. Fonti Ufficiali e Origine dei Dati</h3>
                <ul className="modal-list">
                  <li>
                    <strong>INL – Rapporti annuali sull&apos;attività di vigilanza (2021-2025):</strong> documenti ufficiali
                    dell&apos;Ispettorato Nazionale del Lavoro redatti ai sensi dell&apos;art. 20 della Convenzione OIL n. 81
                    e dell&apos;art. 13, comma 7-bis, D.Lgs. 81/2008. Contengono i risultati degli accertamenti del personale
                    ispettivo INL (compresi i Carabinieri per la Tutela del Lavoro), INPS e INAIL.
                  </li>
                  <li>
                    <strong>Monitoraggio provvedimenti di sospensione:</strong> rilevazioni mensili e annuali pubblicate
                    dall&apos;INL e dal Ministero del Lavoro sull&apos;applicazione dell&apos;art. 14 D.Lgs. 81/2008.
                  </li>
                  <li>
                    <strong>Patente a crediti:</strong> dati del Sistema informativo nazionale per la prevenzione (SINP),
                    patenti rilasciate e provvedimenti sanzionatori comunicati dall&apos;INL (art. 27 D.Lgs. 81/2008, come
                    modificato dal D.L. 19/2024).
                  </li>
                </ul>
              </section>

              {/* 3. NOTE METODOLOGICHE */}
              <section className="modal-section">
                <h3 className="modal-section-title">3. Note Metodologiche e Limiti</h3>
                <div className="modal-grid-definitions">
                  <div>
                    <strong>Controlli avviati vs ispezioni definite:</strong>
                    <span>I controlli avviati sono le ispezioni iniziate nell&apos;anno (incluse verifiche e accertamenti tecnici); le ispezioni definite sono quelle concluse. I due aggregati non coincidono perché alcune ispezioni si chiudono nell&apos;anno successivo.</span>
                  </div>
                  <div>
                    <strong>Lavoratori irregolari:</strong>
                    <span>Valore complessivo INL+INPS+INAIL disponibile dal 2022. Nel 2021 il dato INL (59.362) non è confrontabile con la stessa base. I lavoratori irregolari non vanno confusi con i lavoratori in nero, che sono il sottoinsieme senza alcuna documentazione.</span>
                  </div>
                  <div>
                    <strong>Violazioni in materia di salute e sicurezza:</strong>
                    <span>Serie delle violazioni penali accertate in materia di prevenzione (D.Lgs. 81/2008). Il forte aumento dal 2023 riflette anche il potenziamento della vigilanza e l&apos;estensione delle competenze INL: l&apos;indicatore misura l&apos;attività accertata, non necessariamente un peggioramento del fenomeno.</span>
                  </div>
                </div>
              </section>
            </div>

            <div className="modal-footer">
              <span style={{ fontSize: "0.8rem", color: "var(--color-text-soft)" }}>
                Piattaforma di pubblico interesse basata esclusivamente su fonti istituzionali verificabili.
              </span>
              <button onClick={() => setIsOpen(false)} className="btn-pill active">
                Chiudi
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}