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

  //inizializzazione utente
  useEffect(() => {
    // Funzione per estrarre e validare i dati utente dal token JWT
    const initializeUser = () => {
      // Recupera il token dal localStorage
      const token = localStorage.getItem('token');
      if (token) {
        try {
          // Decodifica il payload del JWT (parte centrale del token)
          const payload = JSON.parse(atob(token.split('.')[1]));
          console.log('🔐 Token decodificato:', payload);
          // Verifica che l'utente sia uno studente (ruolo 'S')
          if (payload.ruolo === 'S') {
            setIdStudente(payload.id);
            console.log('✅ ID Studente impostato:', payload.id);
          } else {
            // Se non è uno studente, nega l'accesso
            setError('Accesso negato: solo gli studenti possono fare esercizi');
            setHasError(true);
          }
        } catch (error) {
          // Gestisce errori nella decodifica del token
          console.error('❌ Errore decodifica token:', error);
          setError('Token non valido');
          setHasError(true);
        }
      } else {
         // Se non c'è token, richiede il login
        setError('Token mancante. Effettua il login.');
        setHasError(true);
      }
    };
// Esegue l'inizializzazione
    initializeUser();
    
    // Verifica server e permessi
    checkServerHealth();
    requestMicrophonePermission();
  }, []);

  // funzioni server
  const checkServerHealth = useCallback(async () => {
    try {
      console.log('🔍 Verifica stato server...');
      const response = await fetch('http://127.0.0.1:5001/health', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      // Determina lo stato in base alla risposta
      const status = response.ok ? 'connected' : 'error';
      console.log('🔍 Stato server:', status);
      setServerStatus(status);
    } catch (error) {
      // Se la richiesta fallisce, il server è disconnesso
      console.error('❌ Errore verifica server:', error);
      setServerStatus('disconnected');
    }
  }, []);
  // Richiede i permessi per accedere al microfono
  const requestMicrophonePermission = useCallback(async () => {
    try {
      console.log('🎤 Richiesta permesso microfono...');
      // Tenta di accedere al microfono
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setMicrophonePermission('granted');
       // Chiude immediatamente lo stream (era solo per testare i permessi)
      stream.getTracks().forEach(track => track.stop());
      console.log('✅ Permesso microfono concesso');
    } catch (error) {
      console.error('❌ Errore permesso microfono:', error);
      // Determina il tipo di errore per impostare lo stato corretto
      const permission = error.name === 'NotAllowedError' ? 'denied' : 'prompt';
      setMicrophonePermission(permission);
    }
  }, []);

  // caricamenti esercizi
  const loadEsercizi = useCallback(async () => {
    // Verifica che l'ID studente sia disponibile
    if (!idStudente) {
      console.error('❌ ID Studente mancante per il caricamento');
      setError('ID studente non disponibile');
      setHasError(true);
      return;
    }
      // Imposta gli stati di caricamento
    try {
      setLoading(true);
      setError(null);
      setHasError(false);
      
      console.log('📚 Caricamento esercizi per studente:', idStudente);
      
      // Chiama l'API per ottenere gli esercizi dello studente
      const response = await fetch(`http://127.0.0.1:5001/get_esercizi_studente?idStudente=${idStudente}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
// Verifica che la risposta sia valida
      if (!response.ok) {
        throw new Error(`Errore HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('📚 Dati esercizi ricevuti:', data);
      // Processa la risposta del server
      if (data.status === 'success') {
        setEsercizi(data.esercizi || []);
     // Mostra feedback appropriato in base al numero di esercizi
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
       // Gestisce errori nel caricamento
      console.error('❌ Errore caricamento esercizi:', error);
      setError('Errore nel caricamento degli esercizi: ' + error.message);
      setHasError(true);
      errore('Errore nel caricamento degli esercizi', { durata: 5000 });
    } finally {
      // Termina sempre lo stato di caricamento
      setLoading(false);
    }
  }, [idStudente, avviso, errore, successo]);

  // avvio esercizio
  const startEsercizio = useCallback((esercizio) => {
    console.log('🎯 Avvio esercizio completo:', esercizio);
    
    try {
       // Verifica che l'esercizio non sia già completato
      if (esercizio.completato) {
        avviso('Questo esercizio è già stato completato!', { durata: 3000 });
        return;
      }

      // Validazione dei dati essenziali dell'esercizio
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
 // Log dei dati dell'esercizio per debugging
      console.log('📝 Impostazione dati esercizio:');
      console.log('   - Testo:', esercizio.testo);
      console.log('   - ID Assegnato:', esercizio.idEsercizioAssegnato);
      console.log('   - ID Studente:', idStudente);
      console.log('   - Immagine:', esercizio.immagine);
// Imposta i dati dell'esercizio corrente
      setEsercizioCorrente(esercizio);
      setParolaRiferimento(esercizio.testo);
      setImmagineParola(esercizio.immagine || '');
      setIdEsercizioAssegnato(esercizio.idEsercizioAssegnato);
      
  // Reset di tutti gli stati dell'esercizio per un nuovo inizio
      setImageError(false);
      setFeedback('');
      setResults(null);
      setNumeroTentativi(0);
      setTentativiRimanenti(MAX_TENTATIVI);
      setTempoInizio(Date.now());
      setTempoImpiegato(0);
      setEsercizioCompletato(false);
      setStatisticheFinali(null);
      // Cambia la vista all'esercizio
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
      // Verifica che non si sia raggiunto il limite di tentativi
      if (numeroTentativi >= MAX_TENTATIVI) {
        avviso(`Hai raggiunto il limite di ${MAX_TENTATIVI} tentativi!`);
        return;
      }
// Verifica che i permessi del microfono siano stati concessi
      if (microphonePermission !== 'granted') {
        errore('Devi concedere il permesso per il microfono');
        return;
      }
 // Verifica che il server sia connesso
      if (serverStatus !== 'connected') {
        errore('Server non disponibile');
        return;
      }
  // Verifica che tutti i dati necessari siano presenti
      if (!parolaRiferimento || !idStudente || !idEsercizioAssegnato) {
        errore('Dati esercizio mancanti');
        return;
      }
  // Verifica che tutti i dati necessari siano presenti
      const nuovoNumeroTentativi = numeroTentativi + 1;
      setNumeroTentativi(nuovoNumeroTentativi);
      setTentativiRimanenti(MAX_TENTATIVI - nuovoNumeroTentativi);

      console.log('🎤 Avvio registrazione audio...');
      // Ottiene l'accesso al microfono
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
       // Crea un nuovo MediaRecorder per registrare l'audio
      mediaRecorderRef.current = new MediaRecorder(stream);
       // Reset dell'array per i nuovi chunk audio
      audioChunksRef.current = [];
// Gestisce i dati audio man mano che vengono registrati
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
 // Gestisce la fine della registrazione
      mediaRecorderRef.current.onstop = () => {
        console.log('🎤 Registrazione completata, creazione blob...');
           // Crea un blob audio dai chunk registrati
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        console.log('🎤 Blob creato, dimensione:', audioBlob.size);
          // Chiude lo stream del microfono
        stream.getTracks().forEach(track => track.stop());
        // Invia l'audio per la valutazione
        inviaAudioPerValutazione(audioBlob, nuovoNumeroTentativi);
      };
   // Avvia effettivamente la registrazione
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
 // Ferma la registrazione audio in corso
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

  // valutazione audio corretta
  const inviaAudioPerValutazione = useCallback(async (audioBlob, tentativoCorrente) => {
    console.log('🔍 Inizio valutazione audio...');
    
    try {
      setFeedback('Analizzando la pronuncia...');
 // Validazione dei dati necessari per la valutazione
      if (!parolaRiferimento || !idStudente || !idEsercizioAssegnato) {
        throw new Error('Dati mancanti per la valutazione');
      }

      if (!audioBlob || audioBlob.size === 0) {
        throw new Error('Audio non valido');
      }
// Calcola il tempo totale impiegato dall'inizio dell'esercizio
      const tempoTotale = tempoInizio ? Math.round((Date.now() - tempoInizio) / 1000) : 0;
      
      // form data seconmdo spercifiche del backend
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.wav'); // File audio
      formData.append('reference_text', parolaRiferimento); //  parola di riferimento
      formData.append('idStudente', idStudente.toString()); // ID dello studente
      formData.append('idEsercizioAssegnato', idEsercizioAssegnato.toString()); // ID assegnazione
      formData.append('tempoImpiegato', tempoTotale.toString()); // Tempo impiegato
      formData.append('numeroTentativi', tentativoCorrente.toString()); // Numero tentativo

      console.log('📤 Invio dati per valutazione:', {
        parolaRiferimento,
        idStudente,
        idEsercizioAssegnato,
        tempoTotale,
        tentativoCorrente,
        audioBlobSize: audioBlob.size
      });

      // Invia la richiesta al server di analisi vocale
      const response = await fetch('http://127.0.0.1:5001/check_pronunciation', {
        method: 'POST',
        body: formData,
      });
 // Verifica che la risposta sia valida
      if (!response.ok) {
        throw new Error(`Errore HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('📥 Risultati valutazione ricevuti:', data);
// Verifica che l'analisi sia andata a buon fine
      if (data.status !== 'success') {
        throw new Error(data.error || 'Errore nell\'analisi');
      }

      // aggiorna stati con nome corretti dal backend
      setFeedback(data.feedback || 'Analisi completata');
        // Salva i risultati dettagliati dell'analisi
      setResults({
        referencetext: data.reference_text,// Testo di riferimento
        transcribedtext: data.transcribed_text,// Testo trascritto dall'audio
        similarityscore: data.similarity_score,// Punteggio di similarità
        corrections: data.corrections,// Correzioni suggerite
      });
 // Aggiorna i tentativi rimanenti
      setTentativiRimanenti(data.tentativi_rimanenti || 0);
  // Verifica se l'esercizio è stato completato
      if (data.esercizio_completato) {
        console.log('🎉 Esercizio completato!');
        setEsercizioCompletato(true);
        // Determina il messaggio finale in base al risultato
        const messaggioFinale = data.feedback?.includes('BRAVO') 
          ? `Perfetto! Hai pronunciato correttamente "${data.reference_text}"!`
          : `Hai raggiunto il limite di ${MAX_TENTATIVI} tentativi per "${data.reference_text}".`;
// Salva le statistiche finali dell'esercizio
        setStatisticheFinali({
          parola: data.reference_text,
          tempoimpiegato: data.tempo_impiegato || tempoTotale,
          numerotentativi: data.numero_tentativi || tentativoCorrente,
          punteggio: data.similarity_score,
          feedback: data.feedback,
          messaggio: messaggioFinale,
          tipo: data.feedback?.includes('BRAVO') ? 'successo' : 'limite'
        });
  // Ferma il timer se attivo
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
           // Mostra il feedback appropriato
        if (data.feedback?.includes('BRAVO')) {
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

  // Effect per aggiornare il timer del tempo impiegato
  useEffect(() => {
    let intervalId = null;
    
    if (tempoInizio && !esercizioCompletato && currentView === 'esercizio') {
      intervalId = setInterval(() => {
         // Calcola il tempo trascorso dall'inizio
        const tempoTrascorso = Math.round((Date.now() - tempoInizio) / 1000);
        setTempoImpiegato(tempoTrascorso);
      }, 1000);// Aggiorna ogni secondo
    }
    // Cleanup: ferma il timer quando il componente si smonta o le dipendenze cambiano
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [tempoInizio, esercizioCompletato, currentView]);

  //caricamento automatico
  useEffect(() => {
    if (idStudente && currentView === 'home') {
      loadEsercizi();
    }
  }, [idStudente, currentView, loadEsercizi]);

  // altre funzioni
  const tornaAllaHome = useCallback(() => {
    try {
      // Ferma il timer se attivo
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
 // Ferma la registrazione se in corso
      if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.stop();
        setIsRecording(false);
      }

      // Reset completo di tutti gli stati dell'esercizio
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
 // Torna alla vista home
      setCurrentView('home');
    } catch (error) {
      console.error('❌ Errore nel tornare alla home:', error);
      errore('Errore nella navigazione');
    }
  }, [isRecording, errore, MAX_TENTATIVI]);
 // Ripete l'esercizio corrente resettando i contatori
  const ripetEsercizio = useCallback(() => {
    try {
      // Reset dei contatori per ripartire da zero
      setNumeroTentativi(0);
      setTentativiRimanenti(MAX_TENTATIVI);
      setTempoInizio(Date.now());
      setTempoImpiegato(0);
      setEsercizioCompletato(false);
      setStatisticheFinali(null);
      setFeedback('');
      setResults(null);
// Torna alla vista esercizio
      setCurrentView('esercizio');
      successo('Ripartendo esercizio...', { durata: 2000 });
    } catch (error) {
      console.error('❌ Errore ripetizione esercizio:', error);
      errore('Errore nella ripetizione');
    }
  }, [MAX_TENTATIVI, successo, errore]);

// Effect per il cleanup quando il componente si smonta  
  useEffect(() => {
    return () => {
      // Ferma il timer se attivo
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      // Ferma la registrazione se in corso
      if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.stop();
      }
    };
  }, [isRecording]);


  return {
    // Stati principali
    currentView,// Vista corrente dell'app
    esercizi,
    esercizioCorrente,
    loading,
    error,
    hasError,// Flag di errore critico

    // Stati per la gestione della registrazione audio
    isRecording, // Se è in corso una registrazione
    microphonePermission, // Stato permessi microfono
    serverStatus, // Stato connessione server

    // Stati esercizio
    parolaRiferimento, // Parola da pronunciare
    immagineParola,
    imageError,// Errore caricamento immagine
    feedback,
    results,// Risultati dettagliati analisi
    
    // Contatori
    numeroTentativi,// Tentativi effettuati
    tentativiRimanenti,// Tentativi rimanenti
    tempoImpiegato,
    esercizioCompletato,
    statisticheFinali,
    MAX_TENTATIVI, // Limite massimo tentativi

    // Azioni principali
    loadEsercizi,// Carica esercizi dal server
    startEsercizio,// Avvia un nuovo esercizio
    tornaAllaHome,// Torna alla schermata principale
    ripetEsercizio,

     // Funzioni per la gestione della registrazione
    startRegistrazione,
    stopRegistrazione,

    // Setter utili per componenti esterni
    setImageError,// Per gestire errori immagine
    setMicrophonePermission // Per aggiornare permessi microfono
  };
};
