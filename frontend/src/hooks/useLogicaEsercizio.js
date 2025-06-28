// hooks/useLogicaEsercizio.js
import { useState, useEffect, useRef } from 'react';
import { useFeedback } from './useFeedback';
import { serviziEsercizi } from '../servizi/api/serviziEsercizi';

export const useLogicaEsercizio = () => {
  // ===== STATI PRINCIPALI =====
  const [currentView, setCurrentView] = useState('home');
  const [esercizioCorrente, setEsercizioCorrente] = useState(null);
  const [esercizi, setEsercizi] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasError, setHasError] = useState(false);

  // ===== STATI REGISTRAZIONE =====
  const [isRecording, setIsRecording] = useState(false);
  const [microphonePermission, setMicrophonePermission] = useState('prompt');
  const [serverStatus, setServerStatus] = useState('checking');

  // ===== STATI ESERCIZIO =====
  const [parolaRiferimento, setParolaRiferimento] = useState('');
  const [immagineParola, setImmagineParola] = useState('');
  const [imageError, setImageError] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [risultato, setRisultato] = useState(null); // ✅ Rinominato per coerenza
  
  // ===== STATI CONTATORI =====
  const [numeroTentativi, setNumeroTentativi] = useState(0);
  const [tentativiRimanenti, setTentativiRimanenti] = useState(10);
  const [tempoInizio, setTempoInizio] = useState(null);
  const [tempoImpiegato, setTempoImpiegato] = useState(0);
  const [esercizioCompletato, setEsercizioCompletato] = useState(false);
  const [statisticheFinali, setStatisticheFinali] = useState(null);

  // ===== STATI UTENTE =====
  const [idStudente, setIdStudente] = useState(null);
  const [idEsercizioAssegnato, setIdEsercizioAssegnato] = useState(null);

  // ===== REFS =====
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);

  // ===== COSTANTI =====
  const MAX_TENTATIVI = 10;

  // ===== HOOKS =====
  const { successo, errore, avviso } = useFeedback();

  // ===== INIZIALIZZAZIONE =====
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.ruolo === 'S') {
          setIdStudente(payload.id);
        }
      } catch (error) {
        console.error('Errore decodifica token:', error);
        setError('Token non valido');
        setHasError(true);
      }
    }

    // Verifica server e permessi
    serviziEsercizi.checkServerHealth(setServerStatus);
    serviziEsercizi.requestMicrophonePermission(setMicrophonePermission);
  }, []);

  useEffect(() => {
    if (idStudente && currentView === 'home') {
      loadEsercizi();
    }
  }, [idStudente, currentView]);

  useEffect(() => {
    if (tempoInizio && !esercizioCompletato && currentView === 'esercizio') {
      timerRef.current = setInterval(() => {
        setTempoImpiegato(Math.round((Date.now() - tempoInizio) / 1000));
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [tempoInizio, esercizioCompletato, currentView]);

  // ===== FUNZIONI PRINCIPALI =====
  const loadEsercizi = async () => {
    try {
      setLoading(true);
      setError(null);
      setHasError(false);
      
      const data = await serviziEsercizi.fetchEsercizi(idStudente);
      setEsercizi(data.esercizi || []);
      
      if (data.esercizi?.length === 0) {
        avviso('Nessun esercizio assegnato al momento', { durata: 4000 });
      }
    } catch (error) {
      console.error('Errore caricamento esercizi:', error);
      setError('Errore nel caricamento degli esercizi');
      setHasError(true);
      errore('Errore nel caricamento degli esercizi', { durata: 5000 });
    } finally {
      setLoading(false);
    }
  };

  const startEsercizio = (esercizio) => {
    try {
      if (esercizio.completato) {
        avviso('Questo esercizio è già stato completato!', { durata: 3000 });
        return;
      }

      // Reset stati
      setEsercizioCorrente(esercizio);
      setParolaRiferimento(esercizio.testo);
      setImmagineParola(esercizio.immagine);
      setIdEsercizioAssegnato(esercizio.idEsercizioAssegnato);
      setImageError(false);
      setFeedback('');
      setRisultato(null); // ✅ Corretto
      setNumeroTentativi(0);
      setTentativiRimanenti(MAX_TENTATIVI);
      setTempoInizio(Date.now());
      setTempoImpiegato(0);
      setEsercizioCompletato(false);
      setStatisticheFinali(null);

      setCurrentView('esercizio');
      successo(`Iniziando esercizio: ${esercizio.testo}`, { durata: 2000 });
    } catch (error) {
      console.error('Errore avvio esercizio:', error);
      errore('Errore nell\'avvio dell\'esercizio', { durata: 3000 });
    }
  };

  const tornaAllaHome = () => {
    try {
      // Pulisci timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }

      // Ferma registrazione se attiva
      if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.stop();
        setIsRecording(false);
      }

      // Reset stati
      resetStatiEsercizio();
      setCurrentView('home');
    } catch (error) {
      console.error('Errore nel tornare alla home:', error);
      errore('Errore nella navigazione', { durata: 3000 });
    }
  };

  // ✅ Funzione per la registrazione corretta
  const startRegistrazione = async () => {
    try {
      const params = {
        numeroTentativi,
        MAX_TENTATIVI,
        microphonePermission,
        mediaRecorderRef,
        audioChunksRef,
        setNumeroTentativi,
        setTentativiRimanenti,
        setIsRecording,
        setFeedback,
        setResults: setRisultato, // ✅ Mapping corretto
        onStop: (audioBlob, tentativo) => {
          inviaAudioPerValutazione(audioBlob, tentativo);
        }
      };

      await serviziEsercizi.startRecording(params);
    } catch (error) {
      console.error('Errore avvio registrazione:', error);
      errore('Errore nell\'avvio della registrazione', { durata: 3000 });
    }
  };

  const stopRegistrazione = () => {
    try {
      if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.stop();
        setIsRecording(false);
        setFeedback('Elaborazione audio...');
      }
    } catch (error) {
      console.error('Errore stop registrazione:', error);
      errore('Errore nella registrazione', { durata: 3000 });
    }
  };

  const inviaAudioPerValutazione = async (audioBlob, tentativoCorrente) => {
    try {
      setFeedback('Analizzando la pronuncia...');

      const params = {
        audioBlob,
        parolaRiferimento,
        idStudente,
        idEsercizioAssegnato,
        tempoTotale: Math.round((Date.now() - tempoInizio) / 1000),
        tentativoCorrente
      };

      const data = await serviziEsercizi.evaluateAudio(params);

      // Aggiorna stati
      setFeedback(data.feedback);
      setRisultato({ // ✅ Usa setRisultato invece di setResults
        referencetext: data.referencetext,
        transcribedtext: data.transcribedtext,
        similarityscore: data.similarityscore,
        corrections: data.corrections
      });
      setTentativiRimanenti(data.tentativirimanenti || 0);

      // Controlla completamento
      if (data.eserciziocompletato) {
        setEsercizioCompletato(true);
        
        const messaggioFinale = data.feedback.includes('BRAVO') 
          ? `Perfetto! Hai pronunciato correttamente ${data.referencetext}!`
          : `Hai raggiunto il limite di ${MAX_TENTATIVI} tentativi per ${data.referencetext}.`;

        setStatisticheFinali({
          parola: data.referencetext,
          tempoimpiegato: data.tempoimpiegato,
          numerotentativi: data.numerotentativi,
          punteggio: data.similarityscore,
          feedback: data.feedback,
          messaggio: messaggioFinale,
          tipo: data.feedback.includes('BRAVO') ? 'successo' : 'limite'
        });

        if (timerRef.current) {
          clearInterval(timerRef.current);
        }

        setCurrentView('risultati');
        
        if (data.feedback.includes('BRAVO')) {
          successo(messaggioFinale, { durata: 5000 });
        } else {
          avviso(messaggioFinale, { durata: 5000 });
        }
      }

    } catch (error) {
      console.error('Errore valutazione audio:', error);
      setFeedback('Errore di connessione nell\'analisi');
      errore('Errore nell\'analisi della pronuncia', { durata: 3000 });
    }
  };

  const resetStatiEsercizio = () => {
    setEsercizioCorrente(null);
    setParolaRiferimento('');
    setImmagineParola('');
    setIdEsercizioAssegnato(null);
    setImageError(false);
    setFeedback('');
    setRisultato(null); // ✅ Corretto
    setNumeroTentativi(0);
    setTentativiRimanenti(MAX_TENTATIVI);
    setTempoInizio(null);
    setTempoImpiegato(0);
    setEsercizioCompletato(false);
    setStatisticheFinali(null);
  };

  const ripetEsercizio = () => {
    try {
      setNumeroTentativi(0);
      setTentativiRimanenti(MAX_TENTATIVI);
      setTempoInizio(Date.now());
      setTempoImpiegato(0);
      setEsercizioCompletato(false);
      setStatisticheFinali(null);
      setFeedback('');
      setRisultato(null); // ✅ Corretto

      setCurrentView('esercizio');
      successo('Ripartendo esercizio...', { durata: 2000 });
    } catch (error) {
      console.error('Errore ripetizione esercizio:', error);
      errore('Errore nella ripetizione', { durata: 3000 });
    }
  };

  // ===== CLEANUP =====
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.stop();
      }
    };
  }, [isRecording]);

  // ✅ RETURN CORRETTO CON TUTTI GLI STATI E SETTERS
  return {
    // Stati principali
    currentView,
    esercizi,
    esercizioCorrente,
    loading,
    error,
    hasError,

    // Stati registrazione
    isRecording,
    microphonePermission,
    serverStatus,

    // Stati esercizio
    parolaRiferimento,
    immagineParola,
    imageError,
    feedback,
    risultato, // ✅ Esposto come risultato per coerenza
    
    // Contatori
    numeroTentativi,
    tentativiRimanenti,
    tempoImpiegato,
    esercizioCompletato,
    statisticheFinali,
    MAX_TENTATIVI,

    // Azioni principali
    loadEsercizi,
    startEsercizio,
    tornaAllaHome,
    ripetEsercizio,
    resetEsercizio: resetStatiEsercizio,

    // Azioni registrazione
    startRegistrazione,
    stopRegistrazione,

    // Setters utili
    setImageError,
    setRisultato, // ✅ Esposto per uso esterno se necessario
    setMicrophonePermission: (value) => setMicrophonePermission(value)
  };
};
