// hooks/useNavigazioneEsercizi.js (versione integrata)
import { useNavigate } from 'react-router-dom';
import { useCallback } from 'react';
//Custom hook per la gestione della navigazione tra diversi tipi di esercizi
const useNavigazioneEsercizi = () => {
  //Hook di React Router per navigazione programmatica
  const navigate = useNavigate();
//Naviga verso l'esercizio appropriato basato sul tipo specificato
  const navigaAEsercizio = useCallback((tipoEsercizio) => {
    console.log('Navigando a esercizio tipo:', tipoEsercizio);
    //Switch statement per mappare tipi di esercizi a route specifiche
    switch(tipoEsercizio) {
      case 'pronuncia':
         // Naviga all'esercizio di pronuncia con riconoscimento vocale
        navigate('/esercizio-pronuncia');
        break;
          // gestione dei tiupi non implementati
      default:
        // Log di errore per tipi di esercizio non riconosciuti
        console.error('Tipo esercizio non riconosciuto:', tipoEsercizio);
    }
  }, [navigate]);

  return { navigaAEsercizio };
};

export default useNavigazioneEsercizi;
