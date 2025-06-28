import React from 'react';
import FeedbackNotifica from './FeedbackNotifica';
import styles from './ContainerNotifiche.module.css';

const ContainerNotifiche = ({ notifiche }) => {
  // Raggruppa le notifiche per posizione
  const notificheRaggruppate = notifiche.reduce((acc, notifica) => {
    const posizione = notifica.posizione || 'topRight';
    if (!acc[posizione]) acc[posizione] = [];
    acc[posizione].push(notifica);
    return acc;
  }, {});

  return (
    <>
      {Object.entries(notificheRaggruppate).map(([posizione, notifichePosizione]) => (
        <div key={posizione} className={`${styles.container} ${styles[posizione]}`}>
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
