import React from 'react';
import styles from './corpoChiSiamo.module.css';

const CorpoChiSiamo = () => {
  return (
    <div className={styles.container}>
      {/* Sezione Hero */}
      <div className={styles.heroSection}>
        <h1 className={styles.mainTitle}>Chi Siamo</h1>
        <div className={styles.subtitle}>
          Un progetto nato dalla passione per l'inclusione educativa
        </div>
      </div>

      {/* Sezione principale del contenuto */}
      <div className={styles.contentSection}>
        {/* Card del team */}
        <div className={styles.teamCard}>
          <div className={styles.cardHeader}>
            <svg className={styles.icon} width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
              <path d="M16 4c0-1.11.89-2 2-2s2 .89 2 2-.89 2-2 2-2-.89-2-2zM4 18v-4h3v-3c0-1.1.9-2 2-2h2c1.1 0 2 .9 2 2v3h3v4H4z"/>
            </svg>
            <h2 className={styles.cardTitle}>Il Nostro Team</h2>
          </div>
          <p className={styles.teamDescription}>
            Siamo tre studenti dell'<strong>Università degli studi di Bari "Aldo Moro"</strong> 
            con una grande sensibilità nei confronti di bambini e ragazzi con 
            <strong> Disturbi Specifici dell'Apprendimento (DSA)</strong>, in particolare 
            dislessia e disortografia.
          </p>
        </div>

        {/* Card della missione */}
        <div className={styles.missionCard}>
          <div className={styles.cardHeader}>
            <svg className={styles.icon} width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
            <h2 className={styles.cardTitle}>La Nostra Missione</h2>
          </div>
          <p className={styles.missionDescription}>
            Il nostro obiettivo è fornire uno <strong>strumento utile e accessibile</strong> 
            per migliorare le abilità linguistiche attraverso <strong>esercizi interattivi</strong> 
            e <strong>monitoraggio dei progressi</strong>.
          </p>
        </div>

        {/* Sezione valori */}
        <div className={styles.valuesSection}>
          <h3 className={styles.valuesTitle}>I Nostri Valori</h3>
          <div className={styles.valuesGrid}>
            <div className={styles.valueItem}>
              <div className={styles.valueIcon}>🎯</div>
              <h4>Accessibilità</h4>
              <p>Strumenti pensati per essere facilmente utilizzabili da tutti</p>
            </div>
            <div className={styles.valueItem}>
              <div className={styles.valueIcon}>💡</div>
              <h4>Innovazione</h4>
              <p>Soluzioni tecnologiche moderne per l'apprendimento</p>
            </div>
            <div className={styles.valueItem}>
              <div className={styles.valueIcon}>🤝</div>
              <h4>Inclusione</h4>
              <p>Supporto personalizzato per ogni studente</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CorpoChiSiamo;
