import { useState, useCallback } from 'react';

export const useFeedback = () => {
  const [notifiche, setNotifiche] = useState([]);

  const aggiungiNotifica = useCallback((config) => {
    const id = Date.now() + Math.random();
    const nuovaNotifica = {
      id,
      ...config,
      onClose: () => rimuoviNotifica(id)
    };
    
    setNotifiche(prev => [...prev, nuovaNotifica]);
    return id;
  }, []);

  const rimuoviNotifica = useCallback((id) => {
    setNotifiche(prev => prev.filter(notifica => notifica.id !== id));
  }, []);

  const rimuoviTutte = useCallback(() => {
    setNotifiche([]);
  }, []);

  // Metodi di convenienza
  const successo = useCallback((messaggio, opzioni = {}) => {
    return aggiungiNotifica({
      messaggio,
      tipo: 'success',
      ...opzioni
    });
  }, [aggiungiNotifica]);

  const errore = useCallback((messaggio, opzioni = {}) => {
    return aggiungiNotifica({
      messaggio,
      tipo: 'error',
      durata: 6000, // Errori rimangono più a lungo
      ...opzioni
    });
  }, [aggiungiNotifica]);

  const avviso = useCallback((messaggio, opzioni = {}) => {
    return aggiungiNotifica({
      messaggio,
      tipo: 'warning',
      ...opzioni
    });
  }, [aggiungiNotifica]);

  const info = useCallback((messaggio, opzioni = {}) => {
    return aggiungiNotifica({
      messaggio,
      tipo: 'info',
      ...opzioni
    });
  }, [aggiungiNotifica]);

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
