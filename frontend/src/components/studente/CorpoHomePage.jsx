import React from 'react';
import styles from './corpoHomePage.module.css';
import useEsercizi from '../../hooks/useEsercizi';
import useNavigazioneEsercizi from '../../hooks/useNavigazioneEsercizi';

const CorpoHomePage = () => {
  const { esercizi, loading } = useEsercizi();
  const { navigaAEsercizio } = useNavigazioneEsercizi();

  if (loading) {
    return <div>Caricamento...</div>;
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Esercizi da svolgere</h1>
      
      <div className={styles.exercisesGrid}>
        {esercizi.map((esercizio) => (
          <div key={esercizio.id} className={styles.exerciseCard}>
            <div className={styles.imageContainer}>
              <img 
                src={esercizio.immagine}
                alt={esercizio.nome}
                className={styles.exerciseImage}
                onClick={() => navigaAEsercizio(esercizio.tipo)}
              />
            </div>
            <h3 className={styles.exerciseName}>{esercizio.nome}</h3>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CorpoHomePage;
