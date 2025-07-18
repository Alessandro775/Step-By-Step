import React from "react";
import { useLogicaEsercizio } from "../../hooks/useLogicaEsercizio";
import HomeEserciziPronuncia from "./EsercizioPronuncia/HomeEserciziPronuncia";
import VistaEsercizio from "./EsercizioPronuncia/VistaEsercizio";
import styles from "./corpoEsercizioAudio.module.css";

const CorpoEsercizioAudio = () => {
  //  Destrutturazione completa con nomi corretti
const {
  currentView,
  esercizi,
  loading,
  error,
  hasError, //flag boleano per presenza di errori
  esercizioCorrente,
  isRecording,
  microphonePermission,
  serverStatus,
  parolaRiferimento,
  immagineParola,
  imageError,
  feedback,
  results, //  Ora è unificato come results
  numeroTentativi,
  tentativiRimanenti,
  tempoImpiegato,
  esercizioCompletato,
  statisticheFinali,
  MAX_TENTATIVI,
  // Azioni
  loadEsercizi,
  startEsercizio,
  tornaAllaHome,
  startRegistrazione,
  stopRegistrazione,
  ripetEsercizio,
  // Setters
  setImageError,
  setMicrophonePermission
} = useLogicaEsercizio();

  // Funzione per richiedere permessi microfono
  const handleRequestMicrophone = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: true,
        video: false 
      });
      
      // Se arriva qui, il permesso è stato concesso
      setMicrophonePermission("granted");
      
      // Chiudi lo stream per liberare il microfono
      stream.getTracks().forEach(track => track.stop());
      
    } catch (error) {
      console.error("❌ Errore permesso microfono:", error);
      setMicrophonePermission("denied");
      
      // Messaggio specifico in base al tipo di errore
      if (error.name === 'NotAllowedError') {
        alert("⚠️ Permesso microfono negato. Abilita il microfono nelle impostazioni del browser per continuare.");
      } else if (error.name === 'NotFoundError') {
        alert("⚠️ Nessun microfono trovato sul dispositivo.");
      } else {
        alert("⚠️ Errore nell'accesso al microfono. Verifica le impostazioni del browser.");
      }
    }
  };

  // Gestione errori con fallback UI
  if (hasError && error) {
    return (
      <div className={styles.container}>
        <div className={styles.errorContainer}>
          <h2 className={styles.errorTitle}>❌ Errore dell'Applicazione</h2>
          <p className={styles.errorMessage}>{error}</p>
          <div className={styles.errorActions}>
            <button 
              onClick={() => window.location.reload()}
              className={styles.reloadButton}
            >
              🔄 Ricarica Pagina
            </button>
            <button 
              onClick={loadEsercizi}
              className={styles.retryButton}
            >
              ↻ Riprova Caricamento
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Titolo dinamico basato sulla vista corrente */}
      <h1 className={styles.title}>
        {currentView === "home" && "I Tuoi Esercizi di Pronuncia"}
        {currentView === "esercizio" && "Esercizio di Pronuncia"}
        {currentView === "risultati" && "Risultati Esercizio"}
      </h1>

      {/* Rendering condizionale della vista */}
      {currentView === "home" && (
        <HomeEserciziPronuncia
          esercizi={esercizi}
          loading={loading}
          error={error}
          onStartEsercizio={(esercizio) => {
            startEsercizio(esercizio);
          }}
          onRetry={() => {
            loadEsercizi();
          }}
        />
      )}

      {(currentView === "esercizio" || currentView === "risultati") && (
        <VistaEsercizio
          //  Stati esercizio
          esercizioCorrente={esercizioCorrente}
          esercizioCompletato={esercizioCompletato}
          statisticheFinali={statisticheFinali}
          
          //  Stati contatori
          numeroTentativi={numeroTentativi}
          tentativiRimanenti={tentativiRimanenti}
          tempoImpiegato={tempoImpiegato}
          MAX_TENTATIVI={MAX_TENTATIVI}
          
          //  Stati audio e media
          isRecording={isRecording}
          microphonePermission={microphonePermission}
          serverStatus={serverStatus}
          
          //  Stati contenuto
          parolaRiferimento={parolaRiferimento}
          immagineParola={immagineParola}
          imageError={imageError}
          
          //  Stati risultati
          feedback={feedback}
          results={results} // Passa risultato come results per compatibilità
          
          //  Funzioni di navigazione (senza prefisso "on")
          tornaHome={() => {
            tornaAllaHome();
          }}
          
          //  Funzioni microfono
          setMicrophonePermission={handleRequestMicrophone}
          
          //  Funzioni registrazione (senza prefisso "on")  
          startRecording={() => {
            startRegistrazione();
          }}
          stopRecording={() => {
            stopRegistrazione();
          }}
          
          //  Funzioni utilità
          setImageError={(hasError) => {
            setImageError(hasError);
          }}
          
          //  Funzioni esercizio
          onRipeti={() => {
            ripetEsercizio();
          }}
        />
      )}

      {/* Stato loading globale */}
      {loading && currentView === "home" && (
        <div className={styles.loadingOverlay}>
          <div className={styles.spinner}></div>
          <span>Caricamento esercizi...</span>
        </div>
      )}
    </div>
  );
};

export default CorpoEsercizioAudio;
