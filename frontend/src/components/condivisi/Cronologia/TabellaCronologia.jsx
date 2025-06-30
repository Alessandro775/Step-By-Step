import React, { useEffect, useState } from 'react';
import ContainerNotifiche from '../Layout/ContainerNotifiche';
import { utilitaApiDati } from '../../../servizi/utilità/utilitaApiDati';
import { useFeedback } from '../../../hooks/useFeedback';
import styles from './TabellaCronologia.module.css';
//componente per visualizzare la cronologia degli esercizi
const TabellaCronologia = ({ cronologia, mostraFormatoDataOraCompleto = false }) => {
  const [datiValidati, setDatiValidati] = useState([]);
  const [erroriValidazione, setErroriValidazione] = useState([]);
// Hook personalizzato per gestire notifiche e feedback utente
  const { notifiche, errore, avviso } = useFeedback();

  // funzione di validazione centralizzata
  const validaRecord = (record, index) => {
    try {
      return {
        //mantenere tutti i campi originali
        ...record,
        // Utilizza utility esterna per formattare la data, con fallback
        dataFormatted: record.data_completamento 
          ? utilitaApiDati.formattaData(record.data_completamento)
          : "N/D",
        punteggioValidato: record.punteggio !== null && 
                          record.punteggio !== undefined && 
                          !isNaN(record.punteggio) 
                          ? record.punteggio 
                          : "N/D",
        // Gestisce diversi nomi di campo per i tentativi
        tentativiValidati: record.tentativi || record.numero_tentativi || "N/D",
        // Gestisce campo errori con fallback a "0"
        erroriValidati: record.numero_errori || "0"
      };
    } catch (error) {
      // Lancia errore specifico con informazioni di debug
      throw new Error(`Dati corrotti nella riga ${index + 1}: ${error.message}`);
    }
  };

//Effect per il processamento e validazione dei dati quando cambia la cronologia
  useEffect(() => {
    if (cronologia.length > 0) {
      // Array per raccogliere dati puliti e errori
      const datiPuliti = [];
      const errori = [];
// Processa ogni record individualmente per isolare gli errori
      cronologia.forEach((record, index) => {
        try {
          // Tenta la validazione del record
          const recordPulito = validaRecord(record, index);
          datiPuliti.push(recordPulito);
        } catch (error) {
          // Raccoglie errori senza interrompere il processamento
          errori.push(error.message);
        }
      });
// Aggiorna gli stati con i risultati del processamento
      setDatiValidati(datiPuliti);
      setErroriValidazione(errori);

      // Gestione errori
      if (errori.length > 0) {
        // Calcola la percentuale di errori per determinare la gravità
        const percentualeErrori = (errori.length / cronologia.length) * 100;
        // Errore critico: più del 50% dei dati è corrotto
        if (percentualeErrori > 50) {
          errore(`❌ Dati della tabella corrotti: ${errori.length}/${cronologia.length} righe non leggibili`, {
            durata: 8000,
            azione: {
              testo: "📋 Dettagli",
              onClick: () => {
                avviso(`Errori trovati: ${errori.join(', ')}`, { durata: 10000 });
              }
            }
          });
        } else {
          avviso(`⚠️ ${errori.length} rig${errori.length > 1 ? 'he' : 'a'} con dati incompleti`, {
            durata: 5000,
            azione: {
              testo: "📋 Dettagli",
              onClick: () => {
                console.warn("Righe con problemi:", errori);
                avviso(`Righe problematiche: ${errori.join(', ')}`, { durata: 8000 });
              }
            }
          });
        }
      }
    }
  }, [cronologia]); //riesegue quando cambia la cronologia

  // Funzioni di utilità per la formattazione e la classe CSS
  const getClassePunteggio = (punteggio) => {
    if (punteggio !== "N/D") {
      if (punteggio >= 80) return styles.cellaPunteggioAlto;//richiama il css, verde per il punteggio alto 
      if (punteggio < 60) return styles.cellaPunteggioBasso;//richiama il css, rosso per il punteggio basso
    }
    return styles.cellaPunteggio;// Stile neutro per valori normali o N/D
  };
// Funzione per ottenere la data formattata, con fallback a "N/D"
  const getDataFormattata = (record) => {
    return record.dataFormatted || 
           utilitaApiDati.formattaData(record.data_completamento) ||
           "N/D";
  };

  const handleRenderError = (error, recordIndex) => {
    errore(`❌ Errore visualizzazione riga ${recordIndex + 1}`, {
      durata: 4000,
      azione: {
        testo: "🔄 Ricarica",
        onClick: () => window.location.reload()
      }
    });
  };

  // Componente riga riutilizzabile
  const renderRiga = (record, index) => {
    try {
      return (
        <tr key={record.idRisultato || index}>
          <td>{record.titolo || "N/D"}</td>
          <td>{record.tipo_esercizio || record.descrizione || "N/D"}</td>
          {/* Punteggio con styling condizionale */}
          <td className={getClassePunteggio(record.punteggioValidato || record.punteggio)}>
            {record.punteggioValidato || (record.punteggio !== null ? record.punteggio : "N/D")}
          </td>
          {/* Tempo impiegato */}
          <td className={styles.cellaTempo}>
            {record.tempo_impiegato || record.tempo || "N/D"}
          </td>
          <td className={styles.cellaData}>
            {getDataFormattata(record)}
          </td>
           {/* Numero tentativi - gestisce diversi nomi di campo */}
          <td className={styles.cellaTentativi}>
            {record.tentativiValidati || record.tentativi || record.numero_tentativi || "N/D"}
          </td>
          {/* Numero errori */}
          <td className={styles.cellaErrori}>
            {record.erroriValidati || record.numero_errori || "0"}
          </td>
        </tr>
      );
    } catch (error) {
      // Gestione degli errori di rendering
      handleRenderError(error, index);
      return (
        <tr key={`error-${index}`} className={styles.rigaErrore}>
          <td colSpan="7" className={styles.cellaErrore}>
            ⚠️ Errore nella visualizzazione di questa riga
          </td>
        </tr>
      );
    }
  };
//stato vuoto, nessun stato disponibile
  if (cronologia.length === 0) {
    return (
      <>
        <ContainerNotifiche notifiche={notifiche} />
        <div className={styles.statoVuoto}>
          <p>Nessun esercizio completato.</p>
          <p>I progressi appariranno qui una volta completati gli esercizi assegnati.</p>
        </div>
      </>
    );
  }
// Priorità: dati validati se disponibili, altrimenti dati originali
  const datiDaRenderizzare = datiValidati.length > 0 ? datiValidati : cronologia;

  return (
    <div className={styles.contenitoreTabella}>
      <ContainerNotifiche notifiche={notifiche} />
      {/* Tabella principale */}
      <table className={styles.tabella}>
        {/* Header della tabella */}
        <thead>
          <tr>
            <th>Esercizio</th>
            <th>Tipo</th>
            <th>Punteggio</th>
            <th>Tempo Impiegato</th>
            <th>Data Completamento</th>
            <th>Tentativi</th>
            <th>Errori</th>
          </tr>
        </thead>
        {/* Corpo della tabella con rendering dinamico */}
        <tbody>
          {datiDaRenderizzare.map((record, index) => renderRiga(record, index))}
        </tbody>
      </table>
      {/* Mostra informazioni sui dati problematici se presenti */}
      {erroriValidazione.length > 0 && (
        <div className={styles.infoValidazione}>
          <small>
            ⚠️ {erroriValidazione.length} rig{erroriValidazione.length > 1 ? 'he' : 'a'} con dati incompleti
          </small>
        </div>
      )}
    </div>
  );
};

export default TabellaCronologia;
