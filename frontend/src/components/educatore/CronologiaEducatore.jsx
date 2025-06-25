import React from "react";
import CronologiaBase from "../condivisi/Cronologia/CronologiaBase";
import styles from "./CronologiaEducatore.module.css";

const CronologiaEducatore = ({ studenteSelezionato, onTornaIndietro }) => {
  console.log("🔧 CronologiaEducatore - Props ricevute:", {
    studenteSelezionato,
    onTornaIndietro: typeof onTornaIndietro,
    hasId: studenteSelezionato?.id || studenteSelezionato?.idStudente
  });

  // ✅ VALIDAZIONE STUDENTE SELEZIONATO
  if (!studenteSelezionato) {
    return (
      <div style={{ 
        padding: '2rem', 
        textAlign: 'center',
        border: '2px solid #ff6b6b',
        borderRadius: '8px',
        backgroundColor: '#ffe6e6'
      }}>
        <h2>❌ Errore</h2>
        <p>Nessuno studente selezionato.</p>
        <button 
          onClick={onTornaIndietro}
          style={{
            backgroundColor: '#6c757d',
            color: 'white',
            padding: '10px 20px',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          ← Torna alla Lista Studenti
        </button>
      </div>
    );
  }

  // ✅ GESTIONE ID STUDENTE (potrebbe essere .id o .idStudente)
  const idStudente = studenteSelezionato.idStudente || studenteSelezionato.id;
  
  if (!idStudente) {
    return (
      <div style={{ 
        padding: '2rem', 
        textAlign: 'center',
        border: '2px solid #ff6b6b',
        borderRadius: '8px',
        backgroundColor: '#ffe6e6'
      }}>
        <h2>❌ Errore</h2>
        <p>ID studente non trovato.</p>
        <p style={{ fontSize: '0.8em', color: '#666' }}>
          Debug: {JSON.stringify(studenteSelezionato)}
        </p>
        <button onClick={onTornaIndietro}>← Torna Indietro</button>
      </div>
    );
  }

  // ✅ COSTRUZIONE NOME COMPLETO
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
      sottotitolo="Visualizza i progressi dello studente negli esercizi"
      nomeUtente={nomeCompleto} // ✅ PASSA IL NOME COMPLETO
      mostraBottoneTorna={true}
      onTornaIndietro={onTornaIndietro} // ✅ PASSA LA FUNZIONE DI CALLBACK
      testoBottoneGrafici="📊 Mostra Grafici"
      testoBottoneTabella="📋 Mostra Cronologia"
      mostraFormatoCompleto={false}
      // ✅ RIMUOVI styleClasses se causa problemi in CronologiaBase
    />
  );
};

export default CronologiaEducatore;
