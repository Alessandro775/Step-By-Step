import { useMemo } from 'react';
//Custom hook per il calcolo delle statistiche degli esercizi
const useStatisticheEsercizi = (esercizi) => {
  //Calcola le statistiche degli esercizi in modo ottimizzato
  const statistiche = useMemo(() => {
    //Gestisce il caso di input non valido o non array
    if (!Array.isArray(esercizi)) {
      return {
        totali: 0,
        daFare: 0,
        completati: 0,
        eserciziRimanenti: [],
        eserciziCompletati: []
      };
    }
//Separa gli esercizi in base al loro stato di completamento
    const eserciziRimanenti = esercizi.filter(e => !e.completato); // Esercizi non completati
    const eserciziCompletati = esercizi.filter(e => e.completato); // Esercizi completati

    return {
      totali: esercizi.length,
      daFare: eserciziRimanenti.length,
      completati: eserciziCompletati.length,
      eserciziRimanenti,
      eserciziCompletati
    };
  }, [esercizi]);
//Restituisce le statistiche calcolate
  return statistiche;
};

export default useStatisticheEsercizi;
