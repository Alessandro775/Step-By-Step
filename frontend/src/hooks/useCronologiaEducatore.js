// hooks/useCronologiaEducatore.js
import { useMemo } from 'react';

export const useCronologiaEducatore = (studenteSelezionato) => {
  const validazione = useMemo(() => {
    if (!studenteSelezionato) {
      return {
        errore: {
          titolo: "Studente non selezionato",
          messaggio: "Seleziona uno studente per visualizzare la sua cronologia."
        },
        dettagliDebug: null
      };
    }

    const idStudente = studenteSelezionato.idStudente || studenteSelezionato.id;
    
    if (!idStudente) {
      return {
        errore: {
          titolo: "Errore ID Studente",
          messaggio: "ID studente non trovato."
        },
        dettagliDebug: `Debug: ${JSON.stringify(studenteSelezionato)}`
      };
    }

    const nomeCompleto = `${studenteSelezionato.nome || ''} ${studenteSelezionato.cognome || ''}`.trim() || 'Studente';
    
    return {
      errore: null,
      idStudente,
      nomeCompleto,
      dettagliDebug: null
    };
  }, [studenteSelezionato]);

  return {
    idStudente: validazione.idStudente,
    nomeCompleto: validazione.nomeCompleto,
    erroreValidazione: validazione.errore,
    dettagliDebug: validazione.dettagliDebug
  };
};
