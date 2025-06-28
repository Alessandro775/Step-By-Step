// hooks/useEsercizi.js
import { useState, useEffect } from 'react';

const useEsercizi = () => {
  const [esercizi, setEsercizi] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
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
            tipo: 'pronuncia'  // ✅ Questo tipo deve corrispondere al mapping
          }
        ];
        
        setEsercizi(datiEsercizi);
      } catch (error) {
        console.error('Errore nel caricamento esercizi:', error);
      } finally {
        setLoading(false);
      }
    };

    caricaEsercizi();
  }, []);

  return { esercizi, loading };
};

export default useEsercizi;
