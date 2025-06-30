import { useCallback } from 'react';
import useStatisticheEsercizi from './useStatisticheEsercizi';
import { useFeedback } from './useFeedback.js';
//Custom hook per la gestione della logica della home degli esercizi
const useHomeEsercizi = (esercizi, onStartEsercizio, onRetry) => {
  //Hook per calcolare e gestire le statistiche degli esercizi
  const statistiche = useStatisticheEsercizi(esercizi);
  //Hook per gestire notifiche e feedback utente
  const { successo, avviso } = useFeedback();

  const gestisciInizioEsercizio = useCallback((esercizio) => {
    //Controlla se l'esercizio è già stato completato
    if (esercizio.completato) {
      avviso('Questo esercizio è già stato completato!', { durata: 3000 });
      return;
    }
    //Notifica di successo per confermare l'avvio
    successo(`Iniziando esercizio: ${esercizio.testo}`, { durata: 2000 });
    onStartEsercizio(esercizio);
  }, [onStartEsercizio, successo, avviso]);// Dipendenze: callback e funzioni feedback

  const gestisciRiprova = useCallback(() => {
    //Notifica che informa l'utente dell'operazione di aggiornamento
    successo('Aggiornamento esercizi...', { durata: 2000 });
    onRetry();
  }, [onRetry, successo]);

  return {
    statistiche, // Statistiche calcolate degli esercizi
    gestisciInizioEsercizio,// Wrapper per avvio esercizio con validazione
    gestisciRiprova // Wrapper per retry con feedback
  };
};

export default useHomeEsercizi;
