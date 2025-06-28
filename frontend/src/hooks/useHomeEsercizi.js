import { useCallback } from 'react';
import useStatisticheEsercizi from './useStatisticheEsercizi';
import { useFeedback } from './useFeedback.js';


const useHomeEsercizi = (esercizi, onStartEsercizio, onRetry) => {
  const statistiche = useStatisticheEsercizi(esercizi);
  const { successo, avviso } = useFeedback();

  const gestisciInizioEsercizio = useCallback((esercizio) => {
    if (esercizio.completato) {
      avviso('Questo esercizio è già stato completato!', { durata: 3000 });
      return;
    }
    
    successo(`Iniziando esercizio: ${esercizio.testo}`, { durata: 2000 });
    onStartEsercizio(esercizio);
  }, [onStartEsercizio, successo, avviso]);

  const gestisciRiprova = useCallback(() => {
    successo('Aggiornamento esercizi...', { durata: 2000 });
    onRetry();
  }, [onRetry, successo]);

  return {
    statistiche,
    gestisciInizioEsercizio,
    gestisciRiprova
  };
};

export default useHomeEsercizi;
