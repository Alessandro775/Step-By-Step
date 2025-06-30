import React from 'react';
import styles from './VistaEsercizio.module.css';

const VistaEsercizio = ({
  esercizioCorrente, //oggetto con dati esercizio corrente
  serverStatus, //stato connessione del server
  microphonePermission, //permessi  microfono
  esercizioCompletato, //flego per lo stato del completamento
  statisticheFinali, // Risultati finali dell'esercizio
  numeroTentativi, // Tentativi già effettuati
  tentativiRimanenti, // Tentativi ancora disponibili
  tempoImpiegato, // Tempo trascorso dall'inizio
  immagineParola,  // URL dell'immagine associata
  imageError, // Flag errore caricamento immagine
  parolaRiferimento,
  isRecording, // Flag registrazione attiva
  feedback, // Messaggio di feedback
  results, // Risultati ultimo tentativo
  MAX_TENTATIVI, // Limite massimo tentativi
  // Correzione nomi delle funzioni
  tornaHome,           // era onTornaHome
  setMicrophonePermission,  // era onRequestMicrophone  
  startRecording,      // era onStartRecording
  stopRecording,       // era onStopRecording
  setImageError        // era onImageError
}) => {

  // Funzione per richiedere permesso microfono
  const handleRequestMicrophone = async () => {
    try {
      // Richiesta accesso al microfono
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Imposta permesso come concesso
      setMicrophonePermission('granted');
       // Chiude lo stream per liberare risorse
      stream.getTracks().forEach(track => track.stop());
    } catch (error) {
      console.error('Errore permesso microfono:', error);
      setMicrophonePermission('denied');
    }
  };

  return (
    <>
    {/*indicatori di stato*/}
      <div className={styles[`status-${serverStatus}`]}>
        {serverStatus === "connected" ? "✅ Server connesso" : 
         serverStatus === "disconnected" ? "❌ Server non raggiungibile" : 
         "🔄 Verificando connessione..."}
      </div>
{/* Stato permessi microfono */}
      <div className={styles[`permission-${microphonePermission}`]}>
        {microphonePermission === "granted" ? "🎤 Microfono autorizzato" :
         microphonePermission === "denied" ? "🚫 Microfono negato" :
         "⏳ Verifica permessi microfono..."}
      </div>
{/*richiesta permessi*/}
      {microphonePermission === "denied" && (
        <button className={styles.button} onClick={handleRequestMicrophone}>
          🎤 Richiedi Permesso Microfono
        </button>
      )}

      {esercizioCompletato && statisticheFinali && (
        <div className={`${styles.finalStats} ${styles[statisticheFinali.tipo]}`}>
          <h2>{statisticheFinali.tipo === "successo" ? "🎉 Esercizio Completato!" : "⏰ Limite Raggiunto"}</h2>
          <p>{statisticheFinali.messaggio}</p>
          <div className={styles.statsCard}>
            {/* Parola esercitata */}
            <div className={styles.statItem}>
              <span>Parola:</span>
              <span>{statisticheFinali.parola}</span>
            </div>
            {/* Tempo totale impiegato */}
            <div className={styles.statItem}>
              <span>Tempo:</span>
              <span>{statisticheFinali.tempoimpiegato}s</span>
            </div>
            {/* Numero tentativi utilizzati */}
            <div className={styles.statItem}>
              <span>Tentativi:</span>
              <span>{statisticheFinali.numerotentativi}/{MAX_TENTATIVI}</span>
            </div>
            {/* Punteggio di accuratezza finale */}
            <div className={styles.statItem}>
              <span>Accuratezza:</span>
              <span>{statisticheFinali.punteggio}%</span>
            </div>
          </div>
          {/* Pulsante ritorno alla home */}
          <button className={styles.buttonPrimary} onClick={tornaHome}>
            🏠 Torna alla Home
          </button>
        </div>
      )}
      {/*mostra durante l'esecuzione dell'esercizio*/}
      {!esercizioCompletato && (
        <>
          <div className={styles.exerciseHeader}>
            {/* Pulsante navigazione indietro */}
            <button className={styles.button} onClick={tornaHome}>
              ← Torna indietro
            </button>
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
{/* Mostrata solo se presente e non in errore */}
          {immagineParola && !imageError && (
            <div className={styles.imageContainer}>
              <img 
                src={immagineParola} 
                alt={parolaRiferimento} 
                className={styles.wordImage}
                onError={() => setImageError(true)} //gestione errore caricamento
              />
            </div>
          )}
          {/*parola da pronunciare*/}
          <div className={styles.wordContainer}>
            <div className={styles.wordText}>{parolaRiferimento || "Caricamento..."}</div>
          </div>
            {/*istruzioni*/}
          <div className={styles.instructions}>
            <p><strong>Pronuncia chiaramente la parola italiana mostrata sopra</strong></p>
            <p>Hai {tentativiRimanenti} tentativi rimanenti</p>
          </div>

          <div className={styles.controls}>
            {/* Correzione chiamate funzioni registrazione */}
            <button
              className={`${styles.recordButton} ${isRecording ? styles.recording : ""}`}
              onClick={isRecording ? stopRecording : startRecording}
              disabled={
                microphonePermission !== "granted" || //microfono
                serverStatus !== "connected" || //tentativi eseguiti
                numeroTentativi > MAX_TENTATIVI
              }
            >
              {/*testo dinamico basato sullo stato*/}
              {isRecording ? "⏹️ Ferma" : 
               numeroTentativi > (MAX_TENTATIVI) ? "🚫 Limite Raggiunto" : 
               `🎤 Registra (${numeroTentativi}/${MAX_TENTATIVI})`}
            </button>
          </div>
            {/*messaggio di feedback*/}
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
              {/* Parola di riferimento */}
              <div className={styles.resultItem}>
                <strong>Parola da pronunciare:</strong> {results.referencetext}
              </div>
              {/* Trascrizione di quello che è stato pronunciato */}
              <div className={styles.resultItem}>
                <strong>Parola pronunciata:</strong> {results.transcribedtext}
              </div>
              {/* Punteggio di accuratezza */}
              <div className={styles.resultItem}>
                <strong>Accuratezza:</strong> {results.similarityscore}%
              </div>
              {/* Mostrati solo se presenti */}
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
    </>
  );
};

export default VistaEsercizio;
