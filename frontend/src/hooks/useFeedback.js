import { useState, useCallback } from 'react';
//Custom hook per la gestione di un sistema di notifiche/feedback utente
export const useFeedback = () => {
  //Array che contiene tutte le notifiche attualmente attive
  const [notifiche, setNotifiche] = useState([]);

  const aggiungiNotifica = useCallback((config) => {
    // Genera ID univoco combinando timestamp e numero casuale
    const id = Date.now() + Math.random();
    // Crea oggetto notifica completo
    const nuovaNotifica = {
      id, // ID univoco per identificazione
      ...config, // Spread delle configurazioni passate
      onClose: () => rimuoviNotifica(id)
    };
    // Aggiunge la notifica all'array esistente
    setNotifiche(prev => [...prev, nuovaNotifica]);
    // Restituisce l'ID per eventuali manipolazioni esterne
    return id;
  }, []);

  const rimuoviNotifica = useCallback((id) => {
    setNotifiche(prev => prev.filter(notifica => notifica.id !== id));
  }, []);

  const rimuoviTutte = useCallback(() => {
    setNotifiche([]);
  }, []);

  // Crea una notifica di successo
  const successo = useCallback((messaggio, opzioni = {}) => {
    return aggiungiNotifica({
      messaggio,
      tipo: 'success',
      ...opzioni
    });
  }, [aggiungiNotifica]);
//Crea una notifica di errore
  const errore = useCallback((messaggio, opzioni = {}) => {
    return aggiungiNotifica({
      messaggio,
      tipo: 'error', // Tipo specifico per styling rosso/negativo
      durata: 6000, // Errori rimangono più a lungo
      ...opzioni
    });
  }, [aggiungiNotifica]);

  const avviso = useCallback((messaggio, opzioni = {}) => {
    return aggiungiNotifica({
      messaggio,
      tipo: 'warning', // Tipo specifico per styling arancione/attenzione
      ...opzioni
    });
  }, [aggiungiNotifica]); // Dipende da aggiungiNotifica

  const info = useCallback((messaggio, opzioni = {}) => {
    return aggiungiNotifica({
      messaggio,
      tipo: 'info', // Tipo specifico per styling blu/neutro
      ...opzioni
    });
  }, [aggiungiNotifica]);// Dipende da aggiungiNotifica
// Restituisce l'interfaccia pubblica del hook
  return {
    notifiche,
    aggiungiNotifica,
    rimuoviNotifica,
    rimuoviTutte,
    successo,
    errore,
    avviso,
    info
  };
};
