import React from 'react';
import styles from './HomeEserciziPronuncia.module.css';
import useHomeEserciziPronuncia from '../../../hooks/useHomeEsercizi';
import CaricamentoSpinner from '../../condivisi/Layout/CaricamentoSpinner';
import MessaggioErrore from '../../condivisi/Layout/MessaggioErrore';
import StatisticheEsercizi from './StatisticheEsercizi';
import CardEsercizio from './CardEsercizio';

const HomeEserciziPronuncia = ({ esercizi, loading, error, onStartEsercizio, onRetry }) => {
  const { statistiche, gestisciInizioEsercizio, gestisciRiprova } = useHomeEserciziPronuncia(
    esercizi, 
    onStartEsercizio, 
    onRetry
  );
//caricamento
  if (loading) {
    return <CaricamentoSpinner messaggio="Caricamento esercizi..." />;
  }
//errore, mostra il messaggio
  if (error) {
    return (
      <MessaggioErrore 
        titolo="❌ Errore"
        messaggio={error}
        mostraBottoneTorna={true}
        onTornaIndietro={gestisciRiprova}
      />
    );
  }

  const { eserciziRimanenti, eserciziCompletati } = statistiche;

  return (
    <>
    {/*componente che mostra la panoramica generale dei progressi*/}
      <StatisticheEsercizi statistiche={statistiche} />
    {/*reinderizza solo se ci sono esercizi rimanenti*/}
      {eserciziRimanenti.length > 0 && (
        <div className={styles.section}>
          <h2>🎯 Esercizi da Completare - Leggi la parola mostrata ad alta voce</h2>
          <div className={styles.grid}>
            {eserciziRimanenti.map((esercizio, index) => (
              <CardEsercizio 
                key={`${esercizio.idEsercizioAssegnato}-${index}`}
                esercizio={esercizio}
                index={index}
                onStart={gestisciInizioEsercizio}
                isCompletato={false}
              />
            ))}
          </div>
        </div>
      )}
    {/*reidirizza solo se ci sono esercizi completati*/}
      {eserciziCompletati.length > 0 && (
        <div className={styles.section}>
          <h2>✅ Esercizi Completati</h2>
          <div className={styles.grid}>
            {eserciziCompletati.map((esercizio, index) => (
              <CardEsercizio 
                key={esercizio.idEsercizioAssegnato}
                esercizio={esercizio}
                index={index}
                onStart={gestisciInizioEsercizio}
                isCompletato={true}
              />
            ))}
          </div>
        </div>
      )}
    {/* Mostrato quando non ci sono esercizi assegnati */}
      {esercizi.length === 0 && (
        <div className={styles.empty}>
          <h2>📚 Nessun Esercizio Assegnato</h2>
          <p>Non hai ancora esercizi di pronuncia assegnati.</p>
        </div>
      )}
    </>
  );
};

export default HomeEserciziPronuncia;
