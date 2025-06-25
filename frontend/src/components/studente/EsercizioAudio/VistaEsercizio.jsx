import React from 'react';
import styles from './VistaEsercizio.module.css';

const VistaEsercizio = ({
  esercizioCorrente,
  serverStatus,
  microphonePermission,
  esercizioCompletato,
  statisticheFinali,
  numeroTentativi,
  tentativiRimanenti,
  tempoImpiegato,
  immagineParola,
  imageError,
  parolaRiferimento,
  isRecording,
  feedback,
  results,
  MAX_TENTATIVI,
  onTornaHome,
  onRequestMicrophone,
  onStartRecording,
  onStopRecording,
  onImageError
}) => {
  return (
    <>
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
        <button className={styles.button} onClick={onRequestMicrophone}>
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
          <button className={styles.buttonPrimary} onClick={onTornaHome}>🏠 Torna alla Home</button>
        </div>
      )}

      {!esercizioCompletato && (
        <>
          <div className={styles.exerciseHeader}>
            <button className={styles.button} onClick={onTornaHome}>← Torna alla Home</button>
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
                   onError={onImageError} />
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
              onClick={isRecording ? onStopRecording : onStartRecording}
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
    </>
  );
};

export default VistaEsercizio;
