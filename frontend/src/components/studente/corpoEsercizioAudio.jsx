import React from "react";
import { useLogicaEsercizio } from "../../hooks/useLogicaEsercizio";
import { serviziEsercizi } from "../../servizi/api/serviziEsercizi";
import ExerciseHome from "./EsercizioAudio/HomeEsercizi";
import ExerciseView from "./EsercizioAudio/VistaEsercizio";
import styles from "./corpoEsercizioAudio.module.css";

const CorpoEsercizioAudio = () => {
  const {
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
    loadEsercizi,
    startEsercizio,
    tornaHome,
    startRecording,
    stopRecording,
    setImageError,
    setMicrophonePermission
  } = useLogicaEsercizio();

  const handleRequestMicrophone = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setMicrophonePermission("granted");
      stream.getTracks().forEach(track => track.stop());
    } catch (error) {
      setMicrophonePermission("denied");
      alert("⚠️ Devi concedere il permesso per il microfono");
    }
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>
        {currentView === "home" ? "I Tuoi Esercizi di Pronuncia" : "Esercizio di Pronuncia"}
      </h1>

      {currentView === "home" ? (
        <ExerciseHome
          esercizi={esercizi}
          loading={loading}
          error={error}
          onStartEsercizio={startEsercizio}
          onRetry={loadEsercizi}
        />
      ) : (
        <ExerciseView
          esercizioCorrente={esercizioCorrente}
          serverStatus={serverStatus}
          microphonePermission={microphonePermission}
          esercizioCompletato={esercizioCompletato}
          statisticheFinali={statisticheFinali}
          numeroTentativi={numeroTentativi}
          tentativiRimanenti={tentativiRimanenti}
          tempoImpiegato={tempoImpiegato}
          immagineParola={immagineParola}
          imageError={imageError}
          parolaRiferimento={parolaRiferimento}
          isRecording={isRecording}
          feedback={feedback}
          results={results}
          MAX_TENTATIVI={MAX_TENTATIVI}
          onTornaHome={tornaHome}
          onRequestMicrophone={handleRequestMicrophone}
          onStartRecording={startRecording}
          onStopRecording={stopRecording}
          onImageError={() => setImageError(true)}
        />
      )}
    </div>
  );
};

export default CorpoEsercizioAudio;
