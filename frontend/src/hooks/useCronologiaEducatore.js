import { useMemo } from 'react';
//hook per la gestione per la gestione e validazione dei dati studenti nella cronologia educatore
export const useCronologiaEducatore = (studenteSelezionato) => {
  //validazione memorizza dati dello studente
  const validazione = useMemo(() => {
    //controlla se è stato selezionato uno studente
    if (!studenteSelezionato) {
      return {
        errore: {
          titolo: "Studente non selezionato",
          messaggio: "Seleziona uno studente per visualizzare la sua cronologia."
        },
        dettagliDebug: null
      };
    }
//estrae ID dello studente gestendo diversi formati di dati API
    const idStudente = studenteSelezionato.idStudente || studenteSelezionato.id;
    //verifica che ID sia presente e valido 
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
    //restituisce i dati validati e processati
    return {
      errore: null,
      idStudente,
      nomeCompleto,
      dettagliDebug: null
    };
  }, [studenteSelezionato]);

  return {
    idStudente: validazione.idStudente, // ID dello studente (null se errore)
    nomeCompleto: validazione.nomeCompleto, // Nome completo formattato (null se errore)
    erroreValidazione: validazione.errore, // Oggetto errore con titolo e messaggio
    dettagliDebug: validazione.dettagliDebug //Informazioni di debug per sviluppatori
  };
};
