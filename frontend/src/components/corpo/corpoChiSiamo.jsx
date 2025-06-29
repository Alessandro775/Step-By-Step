import React from 'react';
import styles from './CorpoChiSiamo.module.css';
//componente della pagina chi siamo, solo descrizioni testuali con titoli, sottotitoli e testi
const CorpoChiSiamo = () => {
  return (
    <div className={styles.container}>
      <div className={styles.heroSection}>
        <h1 className={styles.mainTitle}>Chi Siamo</h1>
        <div className={styles.subtitle}>
          Un progetto nato dalla passione per l'inclusione educativa
        </div>
      </div>

      <div className={styles.contentSection}>
        <div className={styles.teamCard}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>Il Nostro Team</h2>
          </div>
          <p className={styles.teamDescription}>
            Siamo tre studenti dell'<strong>Università degli studi di Bari "Aldo Moro"</strong> 
            con una grande sensibilità nei confronti di bambini e ragazzi con 
            <strong> Disturbi Specifici dell'Apprendimento (DSA)</strong>, in particolare 
            dislessia e disortografia.
          </p>
        </div>

        <div className={styles.missionCard}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>La Nostra Missione</h2>
          </div>
          <p className={styles.missionDescription}>
            Il nostro obiettivo è fornire uno <strong>strumento utile e accessibile</strong> 
            per migliorare le abilità linguistiche attraverso <strong>esercizi interattivi</strong> 
            e <strong>monitoraggio dei progressi</strong>.
          </p>
        </div>

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
