export type StatoBando = "Aperto" | "In scadenza" | "Prossima apertura" | "Da verificare";

export interface BandoPrevenzione {
  id: string;
  ente: string;
  titolo: string;
  descrizione: string;
  dotazione?: string;
  contributo?: string;
  scadenzaLabel?: string;
  regione: string;
  stato: StatoBando;
  link: string;
  note?: string;
}

export const AGGIORNATO_AL = "17 settembre 2026";

export const BANDI_PREVENZIONE: BandoPrevenzione[] = [
  {
    id: "inail-isi-2025-2026",
    ente: "INAIL",
    titolo: "Bando ISI 2025/2026",
    descrizione:
      "Contributi a fondo perduto per progetti che migliorano le condizioni di salute e sicurezza nei luoghi di lavoro: bonifica amianto, riduzione del rischio, robotica e macchinari innovativi, ambienti confinati, progetti per micro e piccole imprese di settori specifici.",
    dotazione: "600 milioni di euro",
    contributo: "Fino a 130.000 euro (65%, fino all'80% per alcune tipologie); intervento aggiuntivo fino a 20.000 euro",
    scadenzaLabel: "Fase documentale domande ammesse: 26 ottobre 2026",
    regione: "Nazionale",
    stato: "Aperto",
    link: "https://www.inail.it/portale/prevenzione-e-sicurezza/it/prevenzione-e-sicurezza/finanziamenti-per-la-sicurezza/incentivi-alle-imprese.html",
    note: "Selezione a sportello con click day; risorse ripartite per regione e asse di intervento.",
  },
  {
    id: "inail-formazione",
    ente: "INAIL",
    titolo: "Bando per la formazione in materia di salute e sicurezza",
    descrizione:
      "Iniziativa INAIL per finanziare progetti di formazione dei lavoratori, dei datori di lavoro e delle figure della prevenzione previste dal D.Lgs. 81/2008.",
    dotazione: "Da comunicare di edizione in edizione",
    regione: "Nazionale",
    stato: "Da verificare",
    link: "https://www.inail.it/portale/prevenzione-e-sicurezza/it/prevenzione-e-sicurezza/finanziamenti-per-la-sicurezza/incentivi-alle-imprese/bando-per-la-formazione.html",
    note: "Bando a cadenza periodica: verificare sul portale INAIL la disponibilità dell'edizione corrente.",
  },
  {
    id: "fondimpresa-avviso-4-2026",
    ente: "Fondimpresa",
    titolo: "Avviso 4/2026, Competenze avanzate e sicurezza obbligatoria",
    descrizione:
      "Finanziamento di piani formativi per le MPMI aderenti al Fondo, con priorità alla formazione obbligatoria in materia di sicurezza sul lavoro e alle competenze avanzate (inclusa l'area intelligenza artificiale).",
    dotazione: "30 milioni di euro",
    contributo: "Copertura dei piani formativi presentati dalle aziende aderenti (contributo 0,30%)",
    scadenzaLabel: "Procedura a fasi: qualificazione dei cataloghi formativi e presentazione dei piani",
    regione: "Nazionale",
    stato: "Aperto",
    link: "https://www.fondimpresa.it/",
  },
  {
    id: "lazio-fse-sicurezza",
    ente: "Regione Lazio",
    titolo: "Avviso sicurezza sul lavoro (PR FSE+ 2021-2027)",
    descrizione:
      "Contributi alle imprese per la realizzazione di interventi di consulenza, formazione e informazione sulla salute e sicurezza nei luoghi di lavoro, con priorità per i sistemi organizzativi avanzati di prevenzione.",
    dotazione: "5 milioni di euro",
    contributo: "Contributo a fondo perduto sui costi ammissibili, in regime de minimis o in esenzione",
    regione: "Lazio",
    stato: "Aperto",
    link: "https://www.regione.lazio.it/sicurezzalavoro",
    note: "Domanda telematica: le condizioni operative sono definite nell'avviso pubblicato dalla Regione.",
  },
  {
    id: "campania-piu-sicurezza",
    ente: "Regione Campania",
    titolo: "Misura Più Sicurezza",
    descrizione:
      "Misura del Piano di Azione Campania al Lavoro a sostegno delle aziende che investono in prevenzione e sicurezza nei luoghi di lavoro.",
    dotazione: "2 milioni di euro",
    regione: "Campania",
    stato: "Da verificare",
    link: "https://www.regione.campania.it/cittadini/it/tematiche/regione-informa-lavoro/sicurezza-sul-lavoro-prevenzione-rischi-e-formazione",
    note: "La misura è stata annunciata dalla Regione (2 milioni di euro), ma lo stato attuale della finestra di domanda non è confermabile dalle pagine ufficiali consultate: verificare sul BURC e sul portale della Regione se il bando è aperto.",
  },
  {
    id: "cosenza-impresa-sicura",
    ente: "Confcommercio Cosenza",
    titolo: "Bando Impresa Sicura 2026",
    descrizione:
      "Contributi per interventi di formazione e consulenza finalizzati a migliorare la sicurezza e la prevenzione nei luoghi di lavoro delle imprese associate.",
    regione: "Calabria (Cosenza)",
    stato: "Da verificare",
    link: "https://confcommerciocosenza.it/bando-impresa-sicura-2026-contributi-per-la-sicurezza-nei-luoghi-di-lavoro/",
  },

  {
    id: "calabria-impresa-sicura",
    ente: "Regione Calabria",
    titolo: "Avviso Impresa Sicura (PR Calabria FESR-FSE+ 2021-2027)",
    descrizione:
      "Intervento a sostegno delle imprese che rafforzano la prevenzione e la sicurezza nei luoghi di lavoro, finanziato dal Programma Regionale Calabria FESR-FSE+ 2021-2027.",
    regione: "Calabria",
    stato: "Da verificare",
    link: "https://confcommerciocosenza.it/bando-impresa-sicura-2026-contributi-per-la-sicurezza-nei-luoghi-di-lavoro/",
    note: "L'avviso risulta in fase di pre-informazione (gennaio 2026): verificare l'apertura della procedura sul portale della Regione Calabria e sul BURC.",
  },
  {
    id: "emilia-romagna-formazione",
    ente: "Regione Emilia-Romagna",
    titolo: "Terzo avviso formazione aggiuntiva salute e sicurezza",
    descrizione:
      "Procedura a evidenza pubblica per selezionare e finanziare interventi formativi aggiuntivi in materia di salute e sicurezza nei luoghi di lavoro, in attuazione dell'Accordo quadro INAIL-Conferenza delle Regioni.",
    regione: "Emilia-Romagna",
    stato: "Da verificare",
    link: "https://formazionelavoro.regione.emilia-romagna.it/leggi-atti-bandi/bandi-regionali/bandi-per-annualita/2026/terzo-avviso-a-presentare-interventi-di-formazione-aggiuntiva-in-materia-di-salute-e-sicurezza-nei-luoghi-di-lavoro",
    note: "Avviso pubblicato a febbraio 2026: verificare scadenze e modalità di presentazione delle domande sul portale della Regione.",
  },
  {
    id: "lombardia-voucher-sicurezza",
    ente: "Regione Lombardia",
    titolo: "Voucher aziendali formazione aggiuntiva sicurezza",
    descrizione:
      "Voucher per interventi di formazione aggiuntiva in materia di sicurezza nei luoghi di lavoro, rivolti a dipendenti e datori di lavoro delle aziende con codici ATECO C23-C33, E, F41-F43.",
    regione: "Lombardia",
    stato: "Da verificare",
    link: "https://www.bandi.regione.lombardia.it/servizi/servizio/bandi/dettaglio/istruzione-formazione-lavoro/lavoro-occupazione/avviso-pubblico-l-assegnazione-voucher-aziendali-interventi-formazione-aggiuntiva-materia-sicurezza-salute-luoghi-lavoro-RLW12024041803",
    note: "Il contributo è erogato a rimborso dopo il completamento del corso e il rilascio delle attestazioni. Verificare la disponibilità dell'edizione corrente sul portale bandi della Regione.",
  },
  {
    id: "abruzzo-formazione-fse",
    ente: "Regione Abruzzo",
    titolo: "Contributi formazione su sicurezza e salute sul lavoro (FSE+ 2021-2027)",
    descrizione:
      "Contributi a fondo perduto per la formazione su salute e sicurezza sul lavoro, cofinanziati dal Fondo Sociale Europeo Plus 2021-2027, per rafforzare la consapevolezza dei rischi negli ambienti professionali.",
    regione: "Abruzzo",
    stato: "Da verificare",
    link: "https://edunews24.it/bandi/abruzzo-formazione-sicurezza-salute-lavoro",
    note: "Bando FSE+ con finestra recente (settembre 2026): verificare apertura e scadenze sul portale della Regione Abruzzo.",
  },
];
