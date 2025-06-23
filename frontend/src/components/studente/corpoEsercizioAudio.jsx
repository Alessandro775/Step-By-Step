import React, { useState, useEffect, useRef } from "react";
import styles from "./corpoEsercizioAudio.module.css";

const CorpoEsercizioAudio = () => {
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

  const SERVER_URL = "http://127.0.0.1:5001";
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
    checkServerHealth();
    requestMicrophonePermissionOnLoad();
  }, []);

  useEffect(() => {
    if (idStudente && currentView === "home") {
      fetchEsercizi();
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

  const fetchEsercizi = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${SERVER_URL}/get_esercizi_studente?idStudente=${idStudente}`);
      const data = await response.json();
      if (data.status === "success") {
        setEsercizi(data.esercizi);
        setError(null);
      } else {
        setError("Errore nel caricamento degli esercizi");
      }
    } catch (error) {
      setError("Server non raggiungibile");
    } finally {
      setLoading(false);
    }
  };

  const handleStartEsercizio = (esercizio) => {
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

  const handleTornaHome = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
    setCurrentView("home");
  };

  const checkServerHealth = async () => {
    try {
      const response = await fetch(`${SERVER_URL}/health`);
      setServerStatus(response.ok ? "connected" : "error");
    } catch (error) {
      setServerStatus("disconnected");
    }
  };

  const requestMicrophonePermissionOnLoad = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setMicrophonePermission("granted");
      stream.getTracks().forEach(track => track.stop());
    } catch (error) {
      setMicrophonePermission(error.name === "NotAllowedError" ? "denied" : "prompt");
    }
  };

  const requestMicrophonePermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setMicrophonePermission("granted");
      stream.getTracks().forEach(track => track.stop());
    } catch (error) {
      setMicrophonePermission("denied");
      alert("⚠️ Devi concedere il permesso per il microfono");
    }
  };

  const startRecording = async () => {
    try {
      if (numeroTentativi >= MAX_TENTATIVI) {
        alert(`⚠️ Hai raggiunto il limite di ${MAX_TENTATIVI} tentativi!`);
        return;
      }

      if (microphonePermission !== "granted") {
        await requestMicrophonePermission();
        if (microphonePermission !== "granted") return;
      }

      const nuovoNumeroTentativi = numeroTentativi + 1;
      setNumeroTentativi(nuovoNumeroTentativi);
      setTentativiRimanenti(MAX_TENTATIVI - nuovoNumeroTentativi);

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/wav" });
        sendAudioForEvaluation(audioBlob, nuovoNumeroTentativi);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setFeedback("🎤 Registrazione in corso...");
      setResults(null);
    } catch (error) {
      console.error("Errore durante la registrazione:", error);
      alert("Errore durante la registrazione: " + error.message);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setFeedback("⏳ Elaborazione audio...");
    }
  };

  const sendAudioForEvaluation = async (audioBlob, tentativoCorrente) => {
    const tempoTotale = Math.round((Date.now() - tempoInizio) / 1000);
    const formData = new FormData();
    formData.append("audio", audioBlob, "recording.wav");
    formData.append("reference_text", parolaRiferimento);
    formData.append("idStudente", idStudente);
    formData.append("idEsercizioAssegnato", idEsercizioAssegnato);
    formData.append("tempoImpiegato", tempoTotale);
    formData.append("numeroTentativi", tentativoCorrente);

    try {
      setFeedback("🤖 Analizzando la pronuncia...");
      const response = await fetch(`${SERVER_URL}/check_pronunciation`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      if (data.status === "success") {
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
      } else {
        setFeedback("❌ Errore nell'analisi: " + data.error);
      }
    } catch (error) {
      setFeedback("❌ Errore di connessione nell'analisi");
    }
  };

  // VISTA HOME
  if (currentView === "home") {
    if (loading) {
      return (
        <div className={styles.container}>
          <h1 className={styles.title}>I Tuoi Esercizi di Pronuncia</h1>
          <div className={styles.loading}>
            <div className={styles.spinner}></div>
            <span>Caricamento esercizi...</span>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className={styles.container}>
          <h1 className={styles.title}>I Tuoi Esercizi di Pronuncia</h1>
          <div className={styles.error}>
            <h2>❌ Errore</h2>
            <p>{error}</p>
            <button onClick={fetchEsercizi} className={styles.button}>🔄 Riprova</button>
          </div>
        </div>
      );
    }

    const eserciziRimanenti = esercizi.filter(e => !e.completato);
    const eserciziCompletati = esercizi.filter(e => e.completato);

    return (
      <div className={styles.container}>
        <h1 className={styles.title}>I Tuoi Esercizi di Pronuncia</h1>
      
        <div className={styles.stats}>
          <div className={styles.statCard}>
            <h3>📋 Totali</h3>
            <span className={styles.statNumber}>{esercizi.length}</span>
          </div>
          <div className={styles.statCard}>
            <h3>⏳ Da Fare</h3>
            <span className={styles.statNumber}>{eserciziRimanenti.length}</span>
          </div>
          <div className={styles.statCard}>
            <h3>✅ Completati</h3>
            <span className={styles.statNumber}>{eserciziCompletati.length}</span>
          </div>
        </div>

        {eserciziRimanenti.length > 0 && (
          <div className={styles.section}>
            <h2>🎯 Esercizi da Completare - Leggi la parola mostrata ad alta voce, scandendo bene le lettere</h2>
            <div className={styles.grid}>
              {eserciziRimanenti.map((esercizio, index) => (
                <div key={`${esercizio.idEsercizioAssegnato}-${index}`} className={styles.card}>
                  <div className={styles.cardHeader}>
                    <h3>{esercizio.testo}</h3>
                    <span className={styles.badge}>Da fare</span>
                  </div>
                  {esercizio.immagine && (
                    <div className={styles.cardImage}>
                      <img src={esercizio.immagine} alt={esercizio.testo} />
                    </div>
                  )}
                  <button className={styles.buttonPrimary} onClick={() => handleStartEsercizio(esercizio)}>
                    🎤 Inizia Esercizio
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {eserciziCompletati.length > 0 && (
          <div className={styles.section}>
            <h2>✅ Esercizi Completati</h2>
            <div className={styles.grid}>
              {eserciziCompletati.map((esercizio) => (
                <div key={esercizio.idEsercizioAssegnato} className={`${styles.card} ${styles.completed}`}>
                  <div className={styles.cardHeader}>
                    <h3>{esercizio.testo}</h3>
                    <span className={styles.badgeSuccess}>Completato</span>
                  </div>
                  <div className={styles.cardInfo}>
                    <p><strong>Completato</strong></p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {esercizi.length === 0 && (
          <div className={styles.empty}>
            <h2>📚 Nessun Esercizio Assegnato</h2>
            <p>Non hai ancora esercizi di pronuncia assegnati.</p>
            <button onClick={fetchEsercizi} className={styles.button}>🔄 Aggiorna</button>
          </div>
        )}
      </div>
    );
  }

  // VISTA ESERCIZIO
  if (currentView === "esercizio") {
    return (
      <div className={styles.container}>
        <h1 className={styles.title}>Esercizio di Pronuncia</h1>

        <div className={styles[`status-${serverStatus}`]}>
          {serverStatus === "connected" ? "✅ Server connesso" : 
           serverStatus === "disconnected" ? "❌ Server non raggiungibile" : 
           "🔄 Verificando connessione..."}
        </div>

        <div className={styles[`permission-${microphonePermission}`]}>
          {microphonePermission === "granted" ? "🎤 Microfono autorizzato" :
           microphonePermission === "denied" ? "🚫 Microfono negato" :
           "⏳ Verifica permessi microfono..."}
        </div>

        {microphonePermission === "denied" && (
          <button className={styles.button} onClick={requestMicrophonePermission}>
            🎤 Richiedi Permesso Microfono
          </button>
        )}

        {esercizioCompletato && statisticheFinali && (
          <div className={`${styles.finalStats} ${styles[statisticheFinali.tipo]}`}>
            <h2>{statisticheFinali.tipo === "successo" ? "🎉 Esercizio Completato!" : "⏰ Limite Raggiunto"}</h2>
            <p>{statisticheFinali.messaggio}</p>
            <div className={styles.statsCard}>
              <div className={styles.statItem}>
                <span>Parola:</span>
                <span>{statisticheFinali.parola}</span>
              </div>
              <div className={styles.statItem}>
                <span>Tempo:</span>
                <span>{statisticheFinali.tempo_impiegato}s</span>
              </div>
              <div className={styles.statItem}>
                <span>Tentativi:</span>
                <span>{statisticheFinali.numero_tentativi}/{MAX_TENTATIVI}</span>
              </div>
              <div className={styles.statItem}>
                <span>Accuratezza:</span>
                <span>{statisticheFinali.punteggio}%</span>
              </div>
            </div>
            <button className={styles.buttonPrimary} onClick={handleTornaHome}>🏠 Torna alla Home</button>
          </div>
        )}

        {!esercizioCompletato && (
          <>
            <div className={styles.exerciseHeader}>
              <button className={styles.button} onClick={handleTornaHome}>← Torna alla Home</button>
              <h2>Esercizio: {esercizioCorrente?.testo}</h2>
            </div>

            <div className={styles.attemptInfo}>
              <span>Tentativo: {numeroTentativi}/{MAX_TENTATIVI}</span>
              <span>Rimanenti: {tentativiRimanenti}</span>
              <span>Tempo: {tempoImpiegato}s</span>
            </div>

            <div className={styles.progressBar}>
              <div className={styles.progressFill} style={{
                width: `${(numeroTentativi / MAX_TENTATIVI) * 100}%`,
                backgroundColor: numeroTentativi >= 8 ? "#ff4444" : numeroTentativi >= 5 ? "#ffa500" : "#2e8b57"
              }}></div>
            </div>

            {immagineParola && !imageError && (
              <div className={styles.imageContainer}>
                <img src={immagineParola} alt={parolaRiferimento} className={styles.wordImage}
                     onError={() => setImageError(true)} />
              </div>
            )}

            <div className={styles.wordContainer}>
              <div className={styles.wordText}>{parolaRiferimento || "Caricamento..."}</div>
            </div>

            <div className={styles.instructions}>
              <p><strong>Pronuncia chiaramente la parola italiana mostrata sopra</strong></p>
              <p>Hai {tentativiRimanenti} tentativi rimanenti</p>
            </div>

            <div className={styles.controls}>
              <button
                className={`${styles.recordButton} ${isRecording ? styles.recording : ""}`}
                onClick={isRecording ? stopRecording : startRecording}
                disabled={microphonePermission !== "granted" || serverStatus !== "connected" || numeroTentativi >= MAX_TENTATIVI}
              >
                {isRecording ? "⏹️ Ferma" : numeroTentativi >= MAX_TENTATIVI ? "🚫 Limite Raggiunto" : `🎤 Registra (${numeroTentativi}/${MAX_TENTATIVI})`}
              </button>
            </div>

            {feedback && (
              <div className={`${styles.feedback} ${styles[
                feedback.includes("BRAVO") ? "success" : 
                feedback.includes("PROVA A FARE DI MEGLIO") ? "warning" : 
                feedback.includes("SBAGLIATO") ? "error" : "info"
              ]}`}>
                {feedback}
              </div>
            )}

            {results && !esercizioCompletato && (
              <div className={styles.results}>
                <h4>📊 Risultati Tentativo {numeroTentativi}/{MAX_TENTATIVI}</h4>
                <div className={styles.resultItem}>
                  <strong>Parola da pronunciare:</strong> {results.reference_text}
                </div>
                <div className={styles.resultItem}>
                  <strong>Parola pronunciata:</strong> {results.transcribed_text}
                </div>
                <div className={styles.resultItem}>
                  <strong>Accuratezza:</strong> {results.similarity_score}%
                </div>
                {results.corrections && results.corrections.length > 0 && (
                  <div className={styles.corrections}>
                    <h5>💡 Suggerimenti:</h5>
                    <ul>
                      {results.corrections.map((correction, index) => (
                        <li key={index}>{correction}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    );
  }

  return null;
};

export default CorpoEsercizioAudio;
