import React from "react";
import CronologiaBase from "../../condivisi/Cronologia/CronologiaBase";
import styles from '../../condivisi/Cronologia/CronologiaBase.module.css';

const CronologiaEducatore = ({ studenteSelezionato, onTornaIndietro }) => {
//validazione dati studente
  if (!studenteSelezionato) {
    return (
      <div className={styles.errorContainer}>
        <h2>❌ Errore</h2>
        <p>Nessuno studente selezionato.</p>
      </div>
    );
  }
//esaminazioni ID studente
  const idStudente = studenteSelezionato.idStudente || studenteSelezionato.id;
  
  if (!idStudente) {
    return (
      <div className={styles.errorContainer}>
        <h2>❌ Errore</h2>
        <p>ID studente non trovato.</p>
        <p className={styles.debugInfo}>
        </p>
      </div>
    );
  }

  const nomeCompleto = `${studenteSelezionato.nome || ''} ${studenteSelezionato.cognome || ''}`.trim() || 'Studente';
  return (
    <CronologiaBase
     // Endpoint API specifico per la cronologia dello studente
      apiEndpoint={`studenti/${idStudente}/cronologia`}
      // Configurazione titoli per contesto educatore
      titolo="Cronologia Studente"
      sottotitolo="Visualizza i progressi nell'esecuzione degli esercizi"
      // Nome dello studente per visualizzazione
      nomeUtente={nomeCompleto}
      // Testi personalizzati per i pulsanti di toggle vista
      testoBottoneGrafici="📊 Mostra Grafici"
      testoBottoneTabella="📋 Mostra Cronologia"
      // Configurazione formato data (abbreviato per educatori)
      mostraFormatoCompleto={false}
    />
  );
};

export default CronologiaEducatore;
