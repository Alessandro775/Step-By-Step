// hooks/useNavigazioneEsercizi.js (versione integrata)
import { useNavigate } from 'react-router-dom';
import { useCallback } from 'react';

const useNavigazioneEsercizi = () => {
  const navigate = useNavigate();

  const navigaAEsercizio = useCallback((tipoEsercizio) => {
    console.log('Navigando a esercizio tipo:', tipoEsercizio);
    
    switch(tipoEsercizio) {
      case 'pronuncia':
        navigate('/esercizio-pronuncia');
        break;
      default:
        console.error('Tipo esercizio non riconosciuto:', tipoEsercizio);
    }
  }, [navigate]);

  return { navigaAEsercizio };
};

export default useNavigazioneEsercizi;
