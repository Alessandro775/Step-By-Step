import { useState, useCallback } from 'react';

export const usaDialogoConferma = () => {
  const [statoDialogo, setStatoDialogo] = useState({
    aperto: false,
    titolo: '',
    messaggio: '',
    testoConferma: 'Conferma',
    testoAnnulla: 'Annulla',
    variante: 'default',
    promiseResolve: null
  });

  const mostraConferma = useCallback((opzioni) => {
    return new Promise((resolve) => {
      setStatoDialogo({
        aperto: true,
        titolo: opzioni.titolo || 'Conferma',
        messaggio: opzioni.messaggio || 'Sei sicuro?',
        testoConferma: opzioni.testoConferma || 'Conferma',
        testoAnnulla: opzioni.testoAnnulla || 'Annulla',
        variante: opzioni.variante || 'default',
        promiseResolve: resolve
      });
    });
  }, []);

  const gestisciConferma = useCallback(() => {
    statoDialogo.promiseResolve?.(true);
    setStatoDialogo(prev => ({ ...prev, aperto: false }));
  }, [statoDialogo.promiseResolve]);

  const gestisciAnnulla = useCallback(() => {
    statoDialogo.promiseResolve?.(false);
    setStatoDialogo(prev => ({ ...prev, aperto: false }));
  }, [statoDialogo.promiseResolve]);

  return {
    statoDialogo,
    mostraConferma,
    gestisciConferma,
    gestisciAnnulla
  };
};
