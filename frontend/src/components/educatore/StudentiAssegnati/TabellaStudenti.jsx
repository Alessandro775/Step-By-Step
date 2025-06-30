import React from 'react';
import { usaDialogoConferma } from '../../../hooks/usaDialogoConferma';
import { utilitaApiDati } from '../../../servizi/utilità/utilitaApiDati';
import { useFeedback } from '../../../hooks/useFeedback';
import DialogoConferma from '../../condivisi/Layout/DialogoConferma';
import ContainerNotifiche from '../../condivisi/Layout/ContainerNotifiche';
import styles from './TabellaStudenti.module.css';

const TabellaStudenti = ({
  studenti, // Lista degli studenti assegnati all'educatore
  onVisualizzaContenuti, // Handler per navigazione ai contenuti
  onVisualizzaCronologia, // Handler per navigazione alla cronologia
  onEliminaStudente  // Handler per eliminazione studente
}) => {
  const { statoDialogo, mostraConferma, gestisciConferma, gestisciAnnulla } = usaDialogoConferma();
  const { notifiche, info, avviso } = useFeedback();

  //  Gestione eliminazione con conferma
  const handleEliminaConferma = async (idStudente, nomeCompleto) => {
    const conferma = await mostraConferma({
      titolo: "Rimuovi Studente",
      messaggio: `Sei sicuro di voler rimuovere "${nomeCompleto}" dalla tua lista studenti?\n\nQuesta azione rimuoverà l'associazione ma non eliminerà l'account dello studente.`,
      testoConferma: "Rimuovi",
      testoAnnulla: "Annulla",
      variante: "avviso"
    });

    if (conferma) {
      // Feedback immediato all'utente
      avviso(`Rimozione di ${nomeCompleto} in corso...`, { durata: 2000 });
      onEliminaStudente(idStudente, nomeCompleto);
    }
  };

  // Gestione azioni con feedback
  const handleVisualizzaContenuti = (idStudente, nomeCompleto) => {
    onVisualizzaContenuti(idStudente, nomeCompleto);
  };

  const handleVisualizzaCronologia = (idStudente, nomeCompleto) => {
    onVisualizzaCronologia(idStudente, nomeCompleto);
  };

  if (studenti.length === 0) {
    return (
      <>
      {/* Notifiche sempre visibili anche in stato vuoto */}
        <ContainerNotifiche notifiche={notifiche} />
        <div className={styles.emptyState}>
          {/* Icona rappresentativa per stato vuoto */}
          <div className={styles.emptyIcon}>👥</div>
          {/* Messaggio principale */}
          <p><strong>Nessuno studente associato al momento</strong></p>
          {/* Suggerimento per l'azione successiva */}
          <p>Aggiungi studenti utilizzando il form sopra per iniziare a gestire i loro contenuti ed esercizi.</p>
        </div>
      </>
    );
  }

  return (
    <>
      {/* Sistema di notifiche sempre presente */}
      <ContainerNotifiche notifiche={notifiche} />
      <DialogoConferma
        aperto={statoDialogo.aperto}
        titolo={statoDialogo.titolo}
        messaggio={statoDialogo.messaggio}
        testoConferma={statoDialogo.testoConferma}
        testoAnnulla={statoDialogo.testoAnnulla}
        variante={statoDialogo.variante}
        onConferma={gestisciConferma}
        onAnnulla={gestisciAnnulla}
        onChiudi={gestisciAnnulla}
      />
      {/* === TABELLA PRINCIPALE === */}
      <div className={styles.tableContainer}>
         {/*tabella*/}     
        <table className={styles.table}>
          <thead>
            <tr>
              <th>👤 Nome</th>
              <th>👤 Cognome</th>
              <th>📧 Email</th>
              <th>📅 Data Assegnazione</th>
              <th>⚙️ Azioni</th>
            </tr>
          </thead>
          {/*corpo tabella*/}
          <tbody>
            {studenti.map((studente) => {
              const nomeCompleto = `${studente.nome || "N/D"} ${studente.cognome || "N/D"}`.trim();
              const dataAssegnazione = studente.data_assegnazione 
                ? utilitaApiDati.formattaData(studente.data_assegnazione)
                : "N/D";

              return ( 
                <tr key={studente.idStudente} className={styles.studentRow}> {/*celle con i dati*/}
                  <td className={styles.nameCell}>{studente.nome || "N/D"}</td>
                  <td className={styles.nameCell}>{studente.cognome || "N/D"}</td>
                  <td className={styles.emailCell}>{studente.email}</td>
                  <td className={styles.dateCell}>{dataAssegnazione}</td>
                  <td className={styles.actionsCell}>
                    <div className={styles.buttonGroup}>
                      {/*pulsante contenuti*/}
                      <button
                        className={styles.viewButton}
                        onClick={() => handleVisualizzaContenuti(studente.idStudente, nomeCompleto)}
                        title="Visualizza e gestisci contenuti assegnati"
                      >
                        📋 Contenuti
                      </button>
                      {/*pulsante cronologia*/}
                      <button
                        className={styles.historyButton}
                        onClick={() => handleVisualizzaCronologia(studente.idStudente, nomeCompleto)}
                        title="Visualizza cronologia e progressi"
                      >
                        📊 Cronologia
                      </button>
                      {/*pulsante eliminazione*/}
                      <button
                        className={styles.deleteButton}
                        onClick={() => handleEliminaConferma(studente.idStudente, nomeCompleto)}
                        title="Rimuovi studente dalla lista"
                      >
                        🗑️ Rimuovi
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
};

export default TabellaStudenti;
