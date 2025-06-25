import React from 'react';
import { utilitaApiDati } from '../../../servizi/api/utilitaApiDati'; // Import aggiornato
import styles from './TabellaCronologia.module.css';

const TabellaCronologia = ({ cronologia, mostraFormatoDataOraCompleto = false }) => { // Rinominato
  if (cronologia.length === 0) {
    return (
      <div className={styles.statoVuoto}>
        <p>Nessun esercizio completato.</p>
        <p>I progressi appariranno qui una volta completati gli esercizi assegnati.</p>
      </div>
    );
  }

  return (
    <div className={styles.contenitoreTabella}>
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
          {cronologia.map((record, index) => (
            <tr key={record.idRisultato || index}>
              <td>{record.titolo || "N/D"}</td>
              <td>{record.tipo_esercizio || record.descrizione || "N/D"}</td>
              <td>{record.punteggio !== null ? record.punteggio : "N/D"}</td>
              <td>{record.tempo_impiegato || record.tempo || "N/D"}</td>
              <td>
                {mostraFormatoDataOraCompleto
                  ? utilitaApiDati.formattaData(record.data_completamento) // Funzione rinominata
                  : utilitaApiDati.formattaData(record.data_completamento) // Ho lasciato la stessa, se vuoi un formato diverso devi creare una funzione specifica in utilitaApiDati.js
                }
              </td>
              <td>{record.tentativi || record.numero_tentativi || "N/D"}</td>
              <td>{record.numero_errori || "0"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TabellaCronologia;
