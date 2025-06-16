import React from 'react';
import styles from './CorpoHomePageEducatore.module.css';
import studentiImg from '/src/assets/studenti.png';    // Inserisci l'immagine nella cartella corretta
import contenutiImg from '/src/assets/contenuti.png';  // Inserisci l'immagine nella cartella corretta
import { useNavigate } from 'react-router-dom';

const CorpoHomePageEducatore = () => {
  const navigate = useNavigate();

  return (
    <div className={styles.container}>
      <div
        className={styles.card}
        onClick={() => navigate('/studenti-educatore')}
        tabIndex={0}
        role="button"
        aria-label="Vai alla lista degli studenti"
      >
        <img src={studentiImg} alt="Lista Studenti" className={styles.image} />
        <h2 className={styles.title}>Studenti</h2>
      </div>
      <div
        className={styles.card}
        onClick={() => navigate('/contenuto-educatore')}
        tabIndex={0}
        role="button"
        aria-label="Vai ai contenuti"
      >
        <img src={contenutiImg} alt="Contenuti" className={styles.image} />
        <h2 className={styles.title}>Contenuti</h2>
      </div>
    </div>
  );
};

export default CorpoHomePageEducatore;
