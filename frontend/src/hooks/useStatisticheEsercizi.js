import { useMemo } from 'react';

const useStatisticheEsercizi = (esercizi) => {
  const statistiche = useMemo(() => {
    if (!Array.isArray(esercizi)) {
      return {
        totali: 0,
        daFare: 0,
        completati: 0,
        eserciziRimanenti: [],
        eserciziCompletati: []
      };
    }

    const eserciziRimanenti = esercizi.filter(e => !e.completato);
    const eserciziCompletati = esercizi.filter(e => e.completato);

    return {
      totali: esercizi.length,
      daFare: eserciziRimanenti.length,
      completati: eserciziCompletati.length,
      eserciziRimanenti,
      eserciziCompletati
    };
  }, [esercizi]);

  return statistiche;
};

export default useStatisticheEsercizi;
