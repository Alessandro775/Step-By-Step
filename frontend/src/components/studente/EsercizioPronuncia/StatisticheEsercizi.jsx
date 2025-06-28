import React from 'react';
import styles from './StatisticheEsercizi.module.css';

const StatisticheEsercizi = ({ statistiche }) => {
  const { totali, daFare, completati } = statistiche;

  return (
    <div className={styles.stats}>
      <div className={styles.statCard}>
        <h3>📋 Totali</h3>
        <span className={styles.statNumber}>{totali}</span>
      </div>
      <div className={styles.statCard}>
        <h3>⏳ Da Fare</h3>
        <span className={styles.statNumber}>{daFare}</span>
      </div>
      <div className={styles.statCard}>
        <h3>✅ Completati</h3>
        <span className={styles.statNumber}>{completati}</span>
      </div>
    </div>
  );
};

export default StatisticheEsercizi;
