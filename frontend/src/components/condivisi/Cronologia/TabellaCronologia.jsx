import React, { useEffect, useState } from 'react';
import ContainerNotifiche from '../Layout/ContainerNotifiche';
import { utilitaApiDati } from '../../../servizi/utilità/utilitaApiDati';
import { useFeedback } from '../../../hooks/useFeedback';
import styles from './TabellaCronologia.module.css';

const TabellaCronologia = ({ cronologia, mostraFormatoDataOraCompleto = false }) => {
  const [datiValidati, setDatiValidati] = useState([]);
  const [erroriValidazione, setErroriValidazione] = useState([]);

  const { notifiche, errore, avviso } = useFeedback();

  // ✅ Funzione di validazione centralizzata
  const validaRecord = (record, index) => {
    try {
      return {
        ...record,
        dataFormatted: record.data_completamento 
          ? utilitaApiDati.formattaData(record.data_completamento)
          : "N/D",
        punteggioValidato: record.punteggio !== null && 
                          record.punteggio !== undefined && 
                          !isNaN(record.punteggio) 
                          ? record.punteggio 
                          : "N/D",
        tentativiValidati: record.tentativi || record.numero_tentativi || "N/D",
        erroriValidati: record.numero_errori || "0"
      };
    } catch (error) {
      throw new Error(`Dati corrotti nella riga ${index + 1}: ${error.message}`);
    }
  };

  // ✅ Processamento dati usando pattern dal contesto
  useEffect(() => {
    if (cronologia.length > 0) {
      const datiPuliti = [];
      const errori = [];

      cronologia.forEach((record, index) => {
        try {
          const recordPulito = validaRecord(record, index);
          datiPuliti.push(recordPulito);
        } catch (error) {
          errori.push(error.message);
          console.error(`Errore processamento record ${index}:`, error, record);
        }
      });

      setDatiValidati(datiPuliti);
      setErroriValidazione(errori);

      // ✅ Gestione errori usando logica del contesto
      if (errori.length > 0) {
        const percentualeErrori = (errori.length / cronologia.length) * 100;
        
        if (percentualeErrori > 50) {
          errore(`❌ Dati della tabella corrotti: ${errori.length}/${cronologia.length} righe non leggibili`, {
            durata: 8000,
            azione: {
              testo: "📋 Dettagli",
              onClick: () => {
                console.error("Errori dettagliati:", errori);
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
  }, [cronologia]);

  // ✅ Funzioni helper per rendering
  const getClassePunteggio = (punteggio) => {
    if (punteggio !== "N/D") {
      if (punteggio >= 80) return styles.cellaPunteggioAlto;
      if (punteggio < 60) return styles.cellaPunteggioBasso;
    }
    return styles.cellaPunteggio;
  };

  const getDataFormattata = (record) => {
    return record.dataFormatted || 
           utilitaApiDati.formattaData(record.data_completamento) ||
           "N/D";
  };

  const handleRenderError = (error, recordIndex) => {
    console.error(`Errore rendering riga ${recordIndex}:`, error);
    errore(`❌ Errore visualizzazione riga ${recordIndex + 1}`, {
      durata: 4000,
      azione: {
        testo: "🔄 Ricarica",
        onClick: () => window.location.reload()
      }
    });
  };

  // ✅ Componente riga riutilizzabile
  const renderRiga = (record, index) => {
    try {
      return (
        <tr key={record.idRisultato || index}>
          <td>{record.titolo || "N/D"}</td>
          <td>{record.tipo_esercizio || record.descrizione || "N/D"}</td>
          <td className={getClassePunteggio(record.punteggioValidato || record.punteggio)}>
            {record.punteggioValidato || (record.punteggio !== null ? record.punteggio : "N/D")}
          </td>
          <td className={styles.cellaTempo}>
            {record.tempo_impiegato || record.tempo || "N/D"}
          </td>
          <td className={styles.cellaData}>
            {getDataFormattata(record)}
          </td>
          <td className={styles.cellaTentativi}>
            {record.tentativiValidati || record.tentativi || record.numero_tentativi || "N/D"}
          </td>
          <td className={styles.cellaErrori}>
            {record.erroriValidati || record.numero_errori || "0"}
          </td>
        </tr>
      );
    } catch (error) {
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

  const datiDaRenderizzare = datiValidati.length > 0 ? datiValidati : cronologia;

  return (
    <div className={styles.contenitoreTabella}>
      <ContainerNotifiche notifiche={notifiche} />
      
      <table className={styles.tabella}>
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
        <tbody>
          {datiDaRenderizzare.map((record, index) => renderRiga(record, index))}
        </tbody>
      </table>
      
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
