import React from 'react';
import styles from './StatisticheEsercizi.module.css';

const StatisticheEsercizi = ({ statistiche }) => {
  const { totali, daFare, completati } = statistiche; // Oggetto con i dati numerici delle statistiche

  return (
    <div className={styles.stats}>
      {/* Mostra il numero complessivo di esercizi assegnati */}
      <div className={styles.statCard}>
        <h3>📋 Totali</h3>
        <span className={styles.statNumber}>{totali}</span>
      </div>
      {/* Evidenzia gli esercizi ancora da completare*/}
      <div className={styles.statCard}>
        <h3>⏳ Da Fare</h3>
        <span className={styles.statNumber}>{daFare}</span>
      </div>
      {/* Celebra i progressi già raggiunti*/}
      <div className={styles.statCard}>
        <h3>✅ Completati</h3>
        <span className={styles.statNumber}>{completati}</span>
      </div>
    </div>
  );
};

export default StatisticheEsercizi;
