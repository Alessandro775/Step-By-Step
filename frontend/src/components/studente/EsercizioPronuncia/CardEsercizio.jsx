import React from 'react';
import styles from './CardEsercizio.module.css';

const CardEsercizio = ({ esercizio, index, onStart, isCompletato = false }) => {
  return (
    <div 
    // Combina ID esercizio e indice per garantire unicità
      key={`${esercizio.idEsercizioAssegnato}-${index}`} 
      // Applica stili diversi basati sullo stato di completamento
      className={`${styles.card} ${isCompletato ? styles.completed : ''}`}
    >
      <div className={styles.cardHeader}>
        <h3>{esercizio.testo}</h3>
        {/* Badge visivo che indica lo stato dell'esercizio */}
        <span className={isCompletato ? styles.badgeSuccess : styles.badge}>
          {isCompletato ? 'Completato' : 'Da fare'}
        </span>
      </div>
      {/* Renderizzata condizionalmente solo se presente */}
      {esercizio.immagine && (
        <div className={styles.cardImage}>
          <img src={esercizio.immagine} alt={esercizio.testo} />
        </div>
      )}
      {/* Mostrato solo per esercizi non completati */}
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
