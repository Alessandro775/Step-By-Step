import React from 'react';
import FeedbackNotifica from './FeedbackNotifica';
import styles from './ContainerNotifiche.module.css';

const ContainerNotifiche = ({ notifiche }) => {
  // Raggruppa le notifiche per posizione
  const notificheRaggruppate = notifiche.reduce((acc, notifica) => {
    // Estrae la posizione dalla notifica, con fallback a 'topRight'
    const posizione = notifica.posizione || 'topRight';
     // Inizializza l'array per la posizione se non esiste
    if (!acc[posizione]) acc[posizione] = [];
     // Aggiunge la notifica all'array della posizione corrispondent
    acc[posizione].push(notifica);
    return acc;
  }, {});// Oggetto vuoto come valore iniziale

  return (
    <>
    {/*itera su ogni gruppo di notifiche*/}
      {Object.entries(notificheRaggruppate).map(([posizione, notifichePosizione]) => (
        <div key={posizione} className={`${styles.container} ${styles[posizione]}`}>
          {/* Mappa le notifiche per la posizione corrente */}
          {notifichePosizione.map((notifica) => (
            <FeedbackNotifica
              key={notifica.id}
              {...notifica}
            />
          ))}
        </div>
      ))}
    </>
  );
};

export default ContainerNotifiche;
