import { useState, useEffect, useRef } from 'react';
import { exerciseService } from '../servizi/api/serviziEsercizi';

export const useLogicaEsercizio = () => {
  const [currentView, setCurrentView] = useState("home");
  const [esercizioCorrente, setEsercizioCorrente] = useState(null);
  const [esercizi, setEsercizi] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [microphonePermission, setMicrophonePermission] = useState("prompt");
  const [parolaRiferimento, setParolaRiferimento] = useState("");
  const [immagineParola, setImmagineParola] = useState("");
  const [imageError, setImageError] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [results, setResults] = useState(null);
  const [serverStatus, setServerStatus] = useState("checking");
  const [idStudente, setIdStudente] = useState(null);
  const [idEsercizioAssegnato, setIdEsercizioAssegnato] = useState(null);
  const [numeroTentativi, setNumeroTentativi] = useState(0);
  const [tempoInizio, setTempoInizio] = useState(null);
  const [tempoImpiegato, setTempoImpiegato] = useState(0);
  const [esercizioCompletato, setEsercizioCompletato] = useState(false);
  const [statisticheFinali, setStatisticheFinali] = useState(null);
  const [tentativiRimanenti, setTentativiRimanenti] = useState(10);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);

  const MAX_TENTATIVI = 10;

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        if (payload.ruolo === "S") {
          setIdStudente(payload.id);
        }
      } catch (error) {
        console.error("Errore decodifica token:", error);
      }
    }
    exerciseService.checkServerHealth(setServerStatus);
    exerciseService.requestMicrophonePermission(setMicrophonePermission);
  }, []);

  useEffect(() => {
    if (idStudente && currentView === "home") {
      loadEsercizi();
    }
  }, [idStudente, currentView]);

  useEffect(() => {
    if (tempoInizio && !esercizioCompletato && currentView === "esercizio") {
      timerRef.current = setInterval(() => {
        setTempoImpiegato(Math.round((Date.now() - tempoInizio) / 1000));
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [tempoInizio, esercizioCompletato, currentView]);

  const loadEsercizi = async () => {
    try {
      setLoading(true);
      const data = await exerciseService.fetchEsercizi(idStudente);
      setEsercizi(data.esercizi);
      setError(null);
    } catch (error) {
      setError("Server non raggiungibile");
    } finally {
      setLoading(false);
    }
  };

  const startEsercizio = (esercizio) => {
    if (esercizio.completato) {
      alert("Questo esercizio è già stato completato!");
      return;
    }
    setEsercizioCorrente(esercizio);
    setParolaRiferimento(esercizio.testo);
    setImmagineParola(esercizio.immagine || "");
    setIdEsercizioAssegnato(esercizio.idEsercizioAssegnato);
    setImageError(false);
    setFeedback("");
    setResults(null);
    setNumeroTentativi(0);
    setTentativiRimanenti(MAX_TENTATIVI);
    setTempoInizio(Date.now());
    setTempoImpiegato(0);
    setEsercizioCompletato(false);
    setStatisticheFinali(null);
    setCurrentView("esercizio");
  };

  const tornaHome = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
    setCurrentView("home");
  };

  const startRecording = () => {
    exerciseService.startRecording({
      numeroTentativi,
      MAX_TENTATIVI,
      microphonePermission,
      mediaRecorderRef,
      audioChunksRef,
      setNumeroTentativi,
      setTentativiRimanenti,
      setIsRecording,
      setFeedback,
      setResults,
      onStop: (audioBlob, tentativo) => sendAudioForEvaluation(audioBlob, tentativo)
    });
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setFeedback("⏳ Elaborazione audio...");
    }
  };

  const sendAudioForEvaluation = async (audioBlob, tentativoCorrente) => {
    try {
      setFeedback("🤖 Analizzando la pronuncia...");
      const data = await exerciseService.evaluateAudio({
        audioBlob,
        parolaRiferimento,
        idStudente,
        idEsercizioAssegnato,
        tempoTotale: Math.round((Date.now() - tempoInizio) / 1000),
        tentativoCorrente
      });

      setFeedback(data.feedback);
      setResults({
        reference_text: data.reference_text,
        transcribed_text: data.transcribed_text,
        similarity_score: data.similarity_score,
        corrections: data.corrections,
      });
      setTentativiRimanenti(data.tentativi_rimanenti || 0);

      if (data.esercizio_completato) {
        setEsercizioCompletato(true);
        const messaggioFinale = data.feedback === "BRAVO" 
          ? `🎉 Perfetto! Hai pronunciato correttamente "${data.reference_text}"!`
          : `⏰ Hai raggiunto il limite di ${MAX_TENTATIVI} tentativi per "${data.reference_text}".`;
        
        setStatisticheFinali({
          parola: data.reference_text,
          tempo_impiegato: data.tempo_impiegato,
          numero_tentativi: data.numero_tentativi,
          punteggio: data.similarity_score,
          feedback: data.feedback,
          messaggio: messaggioFinale,
          tipo: data.feedback === "BRAVO" ? "successo" : "limite",
          successo: data.feedback === "BRAVO",
        });

        if (timerRef.current) clearInterval(timerRef.current);
      }
    } catch (error) {
      setFeedback("❌ Errore di connessione nell'analisi");
    }
  };

  return {
    // Stati
    currentView,
    esercizi,
    loading,
    error,
    esercizioCorrente,
    isRecording,
    microphonePermission,
    parolaRiferimento,
    immagineParola,
    imageError,
    feedback,
    results,
    serverStatus,
    numeroTentativi,
    tempoImpiegato,
    esercizioCompletato,
    statisticheFinali,
    tentativiRimanenti,
    MAX_TENTATIVI,
    // Azioni
    loadEsercizi,
    startEsercizio,
    tornaHome,
    startRecording,
    stopRecording,
    setImageError,
    setMicrophonePermission: (value) => setMicrophonePermission(value)
  };
};
