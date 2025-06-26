import React from "react";
import CronologiaBase from "../condivisi/Cronologia/CronologiaBase";
import styles from '../condivisi/Cronologia/CronologiaBase.module.css';

const CronologiaEducatore = ({ studenteSelezionato, onTornaIndietro }) => {
  console.log("🔧 CronologiaEducatore - Props ricevute:", {
    studenteSelezionato,
    onTornaIndietro: typeof onTornaIndietro,
    hasId: studenteSelezionato?.id || studenteSelezionato?.idStudente
  });

  if (!studenteSelezionato) {
    return (
      <div className={styles.errorContainer}>
        <h2>❌ Errore</h2>
        <p>Nessuno studente selezionato.</p>
        <button onClick={onTornaIndietro} className={styles.backButton}>
          ← Torna alla Lista Studenti
        </button>
      </div>
    );
  }

  const idStudente = studenteSelezionato.idStudente || studenteSelezionato.id;
  
  if (!idStudente) {
    return (
      <div className={styles.errorContainer}>
        <h2>❌ Errore</h2>
        <p>ID studente non trovato.</p>
        <p className={styles.debugInfo}>
          Debug: {JSON.stringify(studenteSelezionato)}
        </p>
        <button onClick={onTornaIndietro} className={styles.backButton}>
          ← Torna Indietro
        </button>
      </div>
    );
  }

  const nomeCompleto = `${studenteSelezionato.nome || ''} ${studenteSelezionato.cognome || ''}`.trim() || 'Studente';
  
  console.log("✅ CronologiaEducatore - Dati costruiti:", {
    idStudente,
    nomeCompleto,
    apiEndpoint: `studenti/${idStudente}/cronologia`
  });

  return (
    <CronologiaBase
      apiEndpoint={`studenti/${idStudente}/cronologia`}
      titolo="Cronologia Studente"
      sottotitolo="Visualizza i progressi nell'esecuzione degli esercizi"
      nomeUtente={nomeCompleto}
      mostraBottoneTorna={true}
      onTornaIndietro={onTornaIndietro}
      testoBottoneGrafici="📊 Mostra Grafici"
      testoBottoneTabella="📋 Mostra Cronologia"
      mostraFormatoCompleto={false}
    />
  );
};

export default CronologiaEducatore;
