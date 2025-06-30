import { useState, useCallback } from 'react';

export const usaDialogoConferma = () => {
  //Stato centralizzato che gestisce tutte le proprietà del dialogo di conferma
  const [statoDialogo, setStatoDialogo] = useState({
    aperto: false, // Flag per controllare la visibilità del dialogo
    titolo: '', // Titolo del dialogo
    messaggio: '', // Messaggio principale da mostrare
    testoConferma: 'Conferma', // Testo del pulsante di conferma
    testoAnnulla: 'Annulla', // Testo del pulsante di annullamento
    variante: 'default', // Variante stilistica ('default', 'pericolo', 'avviso')
    promiseResolve: null // Funzione resolve della Promise per gestire la risposta
  });

  const mostraConferma = useCallback((opzioni) => {
    return new Promise((resolve) => {
      setStatoDialogo({
        // Imposta il dialogo come aperto
        aperto: true,
        // Configurazione con valori di default per robustezza
        titolo: opzioni.titolo || 'Conferma',
        messaggio: opzioni.messaggio || 'Sei sicuro?',
        testoConferma: opzioni.testoConferma || 'Conferma',
        testoAnnulla: opzioni.testoAnnulla || 'Annulla',
        variante: opzioni.variante || 'default',
          // Salva la funzione resolve per chiamarla successivamente
        promiseResolve: resolve
      });
    });
  }, []);// Nessuna dipendenza - la funzione è stabile

  //gestire la conferma dell'utente e risolvere la promise con true e chiude il dialogo
  const gestisciConferma = useCallback(() => {
    // Risolve la Promise con true (confermato)
    statoDialogo.promiseResolve?.(true);
    // Chiude il dialogo mantenendo gli altri valori
    setStatoDialogo(prev => ({ ...prev, aperto: false }));
  }, [statoDialogo.promiseResolve]);
//gestire l'annulamento dell'utente e risolvere le promis con false e chiudere il dialogo
  const gestisciAnnulla = useCallback(() => {
    // Risolve la Promise con false (annullato)
    statoDialogo.promiseResolve?.(false);
    setStatoDialogo(prev => ({ ...prev, aperto: false }));
  }, [statoDialogo.promiseResolve]);// Dipende dalla funzione resolve corrente

  return {
    statoDialogo, // Stato completo del dialogo per il rendering
    mostraConferma, // Funzione per mostrare il dialogo (Promise-based)
    gestisciConferma, // Handler per il pulsante di conferma
    gestisciAnnulla  // Handler per il pulsante di annullamento
  };
};
