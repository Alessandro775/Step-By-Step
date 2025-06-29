import { useState, useEffect } from 'react';
//Custom hook per la gestione del caricamento degli esercizi disponibili
const useEsercizi = () => {
  const [esercizi, setEsercizi] = useState([]);  // Array degli esercizi disponibili
  const [loading, setLoading] = useState(false); // Flag per stato di caricamento

  useEffect(() => {
    //Stati per gestire i dati degli esercizi e lo stato di caricamento
    const caricaEsercizi = async () => {
      setLoading(true);
      try {
        // Simula il caricamento dalla database come mostrato nei search results
        const datiEsercizi = [
          {
            id: 1,
            nome: 'Prova a tempo',
            immagine: 'src/assets/stopwatch-graphic-icon-design-template-png_302689-removebg-preview.png',
            tipo: 'tempo'
          },
          {
            id: 2,
            nome: 'Divisione in sillabe',
            immagine: 'src/assets/sillabe-removebg-preview.png',
            tipo: 'sillabe'
          },
          {
            id: 3,
            nome: 'Pronuncia corretta',
            immagine: 'src/assets/pronuncia-removebg-preview.png',
            tipo: 'pronuncia'  // Questo tipo deve corrispondere al mapping
          }
        ];
        //aggiorna lo stato con i dati caricati
        setEsercizi(datiEsercizi);
      } catch (error) {
        console.error('Errore nel caricamento esercizi:', error);
      } finally {
        setLoading(false);
      }
    };

    caricaEsercizi();
  }, []);
// Restituisce l'interfaccia pubblica del hook e fornisce dati e stati necessari ai componenti chiamanti
  return { esercizi, loading };
};

export default useEsercizi;
