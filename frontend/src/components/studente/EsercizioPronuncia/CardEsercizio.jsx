import React from 'react';
import styles from './CardEsercizio.module.css';

const CardEsercizio = ({ esercizio, index, onStart, isCompletato = false }) => {
  return (
    <div 
      key={`${esercizio.idEsercizioAssegnato}-${index}`} 
      className={`${styles.card} ${isCompletato ? styles.completed : ''}`}
    >
      <div className={styles.cardHeader}>
        <h3>{esercizio.testo}</h3>
        <span className={isCompletato ? styles.badgeSuccess : styles.badge}>
          {isCompletato ? 'Completato' : 'Da fare'}
        </span>
      </div>
      
      {esercizio.immagine && (
        <div className={styles.cardImage}>
          <img src={esercizio.immagine} alt={esercizio.testo} />
        </div>
      )}
      
      {!isCompletato && (
        <button 
          className={styles.buttonPrimary} 
          onClick={() => onStart(esercizio)}
        >
          🎤 Inizia Esercizio
        </button>
      )}
    </div>
  );
};

export default CardEsercizio;
