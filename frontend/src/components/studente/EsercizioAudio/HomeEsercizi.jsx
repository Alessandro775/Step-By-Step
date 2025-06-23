import React from 'react';
import styles from './HomeEsercizi.module.css';

const HomeEsercizi = ({ esercizi, loading, error, onStartEsercizio, onRetry }) => {
  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <span>Caricamento esercizi...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.error}>
        <h2>❌ Errore</h2>
        <p>{error}</p>
        <button onClick={onRetry} className={styles.button}>🔄 Riprova</button>
      </div>
    );
  }

  const eserciziRimanenti = esercizi.filter(e => !e.completato);
  const eserciziCompletati = esercizi.filter(e => e.completato);

  return (
    <>
      <div className={styles.stats}>
        <div className={styles.statCard}>
          <h3>📋 Totali</h3>
          <span className={styles.statNumber}>{esercizi.length}</span>
        </div>
        <div className={styles.statCard}>
          <h3>⏳ Da Fare</h3>
          <span className={styles.statNumber}>{eserciziRimanenti.length}</span>
        </div>
        <div className={styles.statCard}>
          <h3>✅ Completati</h3>
          <span className={styles.statNumber}>{eserciziCompletati.length}</span>
        </div>
      </div>

      {eserciziRimanenti.length > 0 && (
        <div className={styles.section}>
          <h2>🎯 Esercizi da Completare - Leggi la parola mostrata ad alta voce</h2>
          <div className={styles.grid}>
            {eserciziRimanenti.map((esercizio, index) => (
              <div key={`${esercizio.idEsercizioAssegnato}-${index}`} className={styles.card}>
                <div className={styles.cardHeader}>
                  <h3>{esercizio.testo}</h3>
                  <span className={styles.badge}>Da fare</span>
                </div>
                {esercizio.immagine && (
                  <div className={styles.cardImage}>
                    <img src={esercizio.immagine} alt={esercizio.testo} />
                  </div>
                )}
                <button className={styles.buttonPrimary} onClick={() => onStartEsercizio(esercizio)}>
                  🎤 Inizia Esercizio
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {eserciziCompletati.length > 0 && (
        <div className={styles.section}>
          <h2>✅ Esercizi Completati</h2>
          <div className={styles.grid}>
            {eserciziCompletati.map((esercizio) => (
              <div key={esercizio.idEsercizioAssegnato} className={`${styles.card} ${styles.completed}`}>
                <div className={styles.cardHeader}>
                  <h3>{esercizio.testo}</h3>
                  <span className={styles.badgeSuccess}>Completato</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {esercizi.length === 0 && (
        <div className={styles.empty}>
          <h2>📚 Nessun Esercizio Assegnato</h2>
          <p>Non hai ancora esercizi di pronuncia assegnati.</p>
          <button onClick={onRetry} className={styles.button}>🔄 Aggiorna</button>
        </div>
      )}
    </>
  );
};

export default HomeEsercizi;
