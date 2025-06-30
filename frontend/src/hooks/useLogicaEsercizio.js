// hooks/useLogicaEsercizio.js
import { useState, useEffect, useRef, useCallback } from 'react';
import { useFeedback } from './useFeedback';
import { serviziEsercizi } from '../servizi/api/serviziEsercizi';

export const useLogicaEsercizio = () => {
  //  STATI PRINCIPALI 
  const [currentView, setCurrentView] = useState('home');
  const [esercizioCorrente, setEsercizioCorrente] = useState(null);
  const [esercizi, setEsercizi] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasError, setHasError] = useState(false);

  // STATI REGISTRAZIONE 
  const [isRecording, setIsRecording] = useState(false);
  const [microphonePermission, setMicrophonePermission] = useState('prompt');
  const [serverStatus, setServerStatus] = useState('checking');

  // STATI ESERCIZIO
  const [parolaRiferimento, setParolaRiferimento] = useState('');
  const [immagineParola, setImmagineParola] = useState('');
  const [imageError, setImageError] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [results, setResults] = useState(null);
  
  // STATI CONTATORI
  const [numeroTentativi, setNumeroTentativi] = useState(0);
  const [tentativiRimanenti, setTentativiRimanenti] = useState(10);
  const [tempoInizio, setTempoInizio] = useState(null);
  const [tempoImpiegato, setTempoImpiegato] = useState(0);
  const [esercizioCompletato, setEsercizioCompletato] = useState(false);
  const [statisticheFinali, setStatisticheFinali] = useState(null);

  //sTATI UTENTE 
  const [idStudente, setIdStudente] = useState(null);
  const [idEsercizioAssegnato, setIdEsercizioAssegnato] = useState(null);

  // REFS
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);

  // COSTANTI 
  const MAX_TENTATIVI = 10;

  //  HOOKS 
  const { successo, errore, avviso } = useFeedback();

  //INIZIALIZZAZIONE 
  useEffect(() => {
    const initializeUser = () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          console.log('🔐 Token decodificato:', payload);
          
          if (payload.ruolo === 'S') {
            setIdStudente(payload.id);
            console.log('✅ ID Studente impostato:', payload.id);
          } else {
            setError('Accesso negato: solo gli studenti possono fare esercizi');
            setHasError(true);
          }
        } catch (error) {
          console.error('❌ Errore decodifica token:', error);
          setError('Token non valido');
          setHasError(true);
        }
      } else {
        setError('Token mancante. Effettua il login.');
        setHasError(true);
      }
    };

    initializeUser();
    
    // Verifica server e permessi
    checkServerHealth();
    requestMicrophonePermission();
  }, []);

  // ===== FUNZIONI SERVER =====
  const checkServerHealth = useCallback(async () => {
    try {
      console.log('🔍 Verifica stato server...');
      const response = await fetch('http://127.0.0.1:5001/health', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const status = response.ok ? 'connected' : 'error';
      console.log('🔍 Stato server:', status);
      setServerStatus(status);
    } catch (error) {
      console.error('❌ Errore verifica server:', error);
      setServerStatus('disconnected');
    }
  }, []);

  const requestMicrophonePermission = useCallback(async () => {
    try {
      console.log('🎤 Richiesta permesso microfono...');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setMicrophonePermission('granted');
      stream.getTracks().forEach(track => track.stop());
      console.log('✅ Permesso microfono concesso');
    } catch (error) {
      console.error('❌ Errore permesso microfono:', error);
      const permission = error.name === 'NotAllowedError' ? 'denied' : 'prompt';
      setMicrophonePermission(permission);
    }
  }, []);

  // ===== CARICAMENTO ESERCIZI CORRETTO =====
  const loadEsercizi = useCallback(async () => {
    if (!idStudente) {
      console.error('❌ ID Studente mancante per il caricamento');
      setError('ID studente non disponibile');
      setHasError(true);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setHasError(false);
      
      console.log('📚 Caricamento esercizi per studente:', idStudente);
      
      // ✅ ENDPOINT CORRETTO SECONDO IL BACKEND
      const response = await fetch(`http://127.0.0.1:5001/get_esercizi_studente?idStudente=${idStudente}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Errore HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('📚 Dati esercizi ricevuti:', data);

      if (data.status === 'success') {
        setEsercizi(data.esercizi || []);
        
        if (!data.esercizi || data.esercizi.length === 0) {
          avviso('Nessun esercizio assegnato al momento', { durata: 4000 });
        } else {
          console.log('✅ Caricati', data.esercizi.length, 'esercizi');
          successo(`Caricati ${data.esercizi.length} esercizi`, { durata: 2000 });
        }
      } else {
        throw new Error(data.error || 'Errore nel caricamento degli esercizi');
      }
    } catch (error) {
      console.error('❌ Errore caricamento esercizi:', error);
      setError('Errore nel caricamento degli esercizi: ' + error.message);
      setHasError(true);
      errore('Errore nel caricamento degli esercizi', { durata: 5000 });
    } finally {
      setLoading(false);
    }
  }, [idStudente, avviso, errore, successo]);

  // ===== AVVIO ESERCIZIO =====
  const startEsercizio = useCallback((esercizio) => {
    console.log('🎯 Avvio esercizio completo:', esercizio);
    
    try {
      if (esercizio.completato) {
        avviso('Questo esercizio è già stato completato!', { durata: 3000 });
        return;
      }

      // ✅ VALIDAZIONE DATI ESSENZIALI
      if (!esercizio.testo) {
        console.error('❌ Testo esercizio mancante:', esercizio);
        errore('Dati esercizio incompleti: testo mancante');
        return;
      }

      if (!esercizio.idEsercizioAssegnato) {
        console.error('❌ ID Esercizio Assegnato mancante:', esercizio);
        errore('Dati esercizio incompleti: ID assegnazione mancante');
        return;
      }

      if (!idStudente) {
        console.error('❌ ID Studente mancante');
        errore('ID studente non disponibile');
        return;
      }

      console.log('📝 Impostazione dati esercizio:');
      console.log('   - Testo:', esercizio.testo);
      console.log('   - ID Assegnato:', esercizio.idEsercizioAssegnato);
      console.log('   - ID Studente:', idStudente);
      console.log('   - Immagine:', esercizio.immagine);

      setEsercizioCorrente(esercizio);
      setParolaRiferimento(esercizio.testo);
      setImmagineParola(esercizio.immagine || '');
      setIdEsercizioAssegnato(esercizio.idEsercizioAssegnato);
      
      // Reset stati esercizio
      setImageError(false);
      setFeedback('');
      setResults(null);
      setNumeroTentativi(0);
      setTentativiRimanenti(MAX_TENTATIVI);
      setTempoInizio(Date.now());
      setTempoImpiegato(0);
      setEsercizioCompletato(false);
      setStatisticheFinali(null);

      setCurrentView('esercizio');
      successo(`Iniziando esercizio: ${esercizio.testo}`, { durata: 2000 });
      
      console.log('✅ Esercizio avviato con successo');
    } catch (error) {
      console.error('❌ Errore avvio esercizio:', error);
      errore('Errore nell\'avvio dell\'esercizio: ' + error.message);
    }
  }, [idStudente, avviso, successo, errore, MAX_TENTATIVI]);

  // ===== REGISTRAZIONE =====
  const startRegistrazione = useCallback(async () => {
    console.log('🎤 Tentativo avvio registrazione...');
    
    try {
      // ✅ VALIDAZIONI PRE-REGISTRAZIONE
      if (numeroTentativi >= MAX_TENTATIVI) {
        avviso(`Hai raggiunto il limite di ${MAX_TENTATIVI} tentativi!`);
        return;
      }

      if (microphonePermission !== 'granted') {
        errore('Devi concedere il permesso per il microfono');
        return;
      }

      if (serverStatus !== 'connected') {
        errore('Server non disponibile');
        return;
      }

      if (!parolaRiferimento || !idStudente || !idEsercizioAssegnato) {
        errore('Dati esercizio mancanti');
        return;
      }

      const nuovoNumeroTentativi = numeroTentativi + 1;
      setNumeroTentativi(nuovoNumeroTentativi);
      setTentativiRimanenti(MAX_TENTATIVI - nuovoNumeroTentativi);

      console.log('🎤 Avvio registrazione audio...');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        console.log('🎤 Registrazione completata, creazione blob...');
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        console.log('🎤 Blob creato, dimensione:', audioBlob.size);
        
        stream.getTracks().forEach(track => track.stop());
        inviaAudioPerValutazione(audioBlob, nuovoNumeroTentativi);
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setFeedback('Registrazione in corso...');
      setResults(null);
      
      console.log('✅ Registrazione avviata');
    } catch (error) {
      console.error('❌ Errore durante la registrazione:', error);
      errore(`Errore durante la registrazione: ${error.message}`);
    }
  }, [numeroTentativi, MAX_TENTATIVI, microphonePermission, serverStatus, parolaRiferimento, idStudente, idEsercizioAssegnato, avviso, errore]);

  const stopRegistrazione = useCallback(() => {
    try {
      if (mediaRecorderRef.current && isRecording) {
        console.log('⏹️ Stop registrazione...');
        mediaRecorderRef.current.stop();
        setIsRecording(false);
        setFeedback('Elaborazione audio...');
      }
    } catch (error) {
      console.error('❌ Errore stop registrazione:', error);
      errore('Errore nella registrazione');
    }
  }, [isRecording, errore]);

  // ===== VALUTAZIONE AUDIO CORRETTA =====
  const inviaAudioPerValutazione = useCallback(async (audioBlob, tentativoCorrente) => {
  console.log('🔍 Inizio valutazione audio...');
  
  try {
    setFeedback('Analizzando la pronuncia...');

    if (!parolaRiferimento || !idStudente || !idEsercizioAssegnato) {
      throw new Error('Dati mancanti per la valutazione');
    }

    if (!audioBlob || audioBlob.size === 0) {
      throw new Error('Audio non valido');
    }

    const tempoTotale = tempoInizio ? Math.round((Date.now() - tempoInizio) / 1000) : 0;
    
    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.wav');
    formData.append('reference_text', parolaRiferimento);
    formData.append('idStudente', idStudente.toString());
    formData.append('idEsercizioAssegnato', idEsercizioAssegnato.toString());
    formData.append('tempoImpiegato', tempoTotale.toString());
    formData.append('numeroTentativi', tentativoCorrente.toString());

    console.log('📤 Invio dati per valutazione:', {
      parolaRiferimento,
      idStudente,
      idEsercizioAssegnato,
      tempoTotale,
      tentativoCorrente,
      audioBlobSize: audioBlob.size
    });

    const response = await fetch('http://127.0.0.1:5001/check_pronunciation', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Errore HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('📥 Risultati valutazione ricevuti:', data);

    if (data.status !== 'success') {
      throw new Error(data.error || 'Errore nell\'analisi');
    }

    // ✅ AGGIORNA STATI CON FEEDBACK AI DINAMICO
    setFeedback(data.feedback || 'Analisi completata');
    
    setResults({
      referencetext: data.reference_text,
      transcribedtext: data.transcribed_text,
      similarityscore: data.similarity_score,
      corrections: data.corrections,
    });

    setTentativiRimanenti(data.tentativi_rimanenti || 0);

    if (data.esercizio_completato) {
      console.log('🎉 Esercizio completato!');
      setEsercizioCompletato(true);
      
      // ✅ MESSAGGIO FINALE BASATO SU SIMILARITÀ INVECE CHE SU FEEDBACK PREIMPOSTATO
      const messaggioFinale = data.similarity_score > 80
        ? `Perfetto! Hai pronunciato correttamente "${data.reference_text}"!`
        : `Hai raggiunto il limite di ${MAX_TENTATIVI} tentativi per "${data.reference_text}".`;

      setStatisticheFinali({
        parola: data.reference_text,
        tempoimpiegato: data.tempo_impiegato || tempoTotale,
        numerotentativi: data.numero_tentativi || tentativoCorrente,
        punteggio: data.similarity_score,
        feedback: data.feedback, // ✅ FEEDBACK AI ORIGINALE
        messaggio: messaggioFinale,
        tipo: data.similarity_score > 80 ? 'successo' : 'limite'
      });

      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
        
      // ✅ NOTIFICHE BASATE SU SIMILARITÀ
      if (data.similarity_score > 80) {
        successo(messaggioFinale, { durata: 5000 });
      } else {
        avviso(messaggioFinale, { durata: 5000 });
      }
    }

  } catch (error) {
    console.error('❌ Errore valutazione audio:', error);
    setFeedback('Errore di connessione nell\'analisi');
    errore('Errore nell\'analisi della pronuncia: ' + error.message);
  }
}, [parolaRiferimento, idStudente, idEsercizioAssegnato, tempoInizio, MAX_TENTATIVI, successo, avviso, errore]);


  // ===== TIMER =====
  useEffect(() => {
    let intervalId = null;
    
    if (tempoInizio && !esercizioCompletato && currentView === 'esercizio') {
      intervalId = setInterval(() => {
        const tempoTrascorso = Math.round((Date.now() - tempoInizio) / 1000);
        setTempoImpiegato(tempoTrascorso);
      }, 1000);
    }
    
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [tempoInizio, esercizioCompletato, currentView]);

  // ===== CARICAMENTO AUTOMATICO =====
  useEffect(() => {
    if (idStudente && currentView === 'home') {
      loadEsercizi();
    }
  }, [idStudente, currentView, loadEsercizi]);

  // ===== ALTRE FUNZIONI =====
  const tornaAllaHome = useCallback(() => {
    try {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }

      if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.stop();
        setIsRecording(false);
      }

      // Reset stati
      setEsercizioCorrente(null);
      setParolaRiferimento('');
      setImmagineParola('');
      setIdEsercizioAssegnato(null);
      setImageError(false);
      setFeedback('');
      setResults(null);
      setNumeroTentativi(0);
      setTentativiRimanenti(MAX_TENTATIVI);
      setTempoInizio(null);
      setTempoImpiegato(0);
      setEsercizioCompletato(false);
      setStatisticheFinali(null);

      setCurrentView('home');
    } catch (error) {
      console.error('❌ Errore nel tornare alla home:', error);
      errore('Errore nella navigazione');
    }
  }, [isRecording, errore, MAX_TENTATIVI]);

  const ripetEsercizio = useCallback(() => {
    try {
      setNumeroTentativi(0);
      setTentativiRimanenti(MAX_TENTATIVI);
      setTempoInizio(Date.now());
      setTempoImpiegato(0);
      setEsercizioCompletato(false);
      setStatisticheFinali(null);
      setFeedback('');
      setResults(null);

      setCurrentView('esercizio');
      successo('Ripartendo esercizio...', { durata: 2000 });
    } catch (error) {
      console.error('❌ Errore ripetizione esercizio:', error);
      errore('Errore nella ripetizione');
    }
  }, [MAX_TENTATIVI, successo, errore]);

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

  // ===== RETURN =====
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
    results,
    
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

    // Azioni registrazione
    startRegistrazione,
    stopRegistrazione,

    // Setters utili
    setImageError,
    setMicrophonePermission
  };
};
