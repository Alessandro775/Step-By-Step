const SERVER_URL = "http://127.0.0.1:5001";

export const serviziEsercizi = {
  async checkServerHealth(setServerStatus) {
    try {
      const response = await fetch(`${SERVER_URL}/health`);
      setServerStatus(response.ok ? "connected" : "error");
    } catch (error) {
      setServerStatus("disconnected");
    }
  },

  async requestMicrophonePermission(setMicrophonePermission) {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setMicrophonePermission("granted");
      stream.getTracks().forEach(track => track.stop());
    } catch (error) {
      setMicrophonePermission(error.name === "NotAllowedError" ? "denied" : "prompt");
    }
  },

  async fetchEsercizi(idStudente) {
    const response = await fetch(`${SERVER_URL}/get_esercizi_studente?idStudente=${idStudente}`);
    const data = await response.json();
    if (data.status === "success") {
      return data;
    } else {
      throw new Error("Errore nel caricamento degli esercizi");
    }
  },

  async startRecording(params) {
    const {
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
      onStop
    } = params;

    try {
      if (numeroTentativi >= MAX_TENTATIVI) {
        alert(`⚠️ Hai raggiunto il limite di ${MAX_TENTATIVI} tentativi!`);
        return;
      }

      if (microphonePermission !== "granted") {
        alert("⚠️ Devi concedere il permesso per il microfono");
        return;
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
        onStop(audioBlob, nuovoNumeroTentativi);
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
  },

  async evaluateAudio(params) {
    const { audioBlob, parolaRiferimento, idStudente, idEsercizioAssegnato, tempoTotale, tentativoCorrente } = params;
    
    const formData = new FormData();
    formData.append("audio", audioBlob, "recording.wav");
    formData.append("reference_text", parolaRiferimento);
    formData.append("idStudente", idStudente);
    formData.append("idEsercizioAssegnato", idEsercizioAssegnato);
    formData.append("tempoImpiegato", tempoTotale);
    formData.append("numeroTentativi", tentativoCorrente);

    const response = await fetch(`${SERVER_URL}/check_pronunciation`, {
      method: "POST",
      body: formData,
    });

    const data = await response.json();
    if (data.status === "success") {
      return data;
    } else {
      throw new Error(data.error || "Errore nell'analisi");
    }
  }
};
