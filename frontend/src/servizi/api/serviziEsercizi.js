// servizi/api/serviziEsercizi.js
const SERVER_URL = 'http://127.0.0.1:5001';

export const serviziEsercizi = {
  async checkServerHealth(setServerStatus) {
    try {
      console.log('🔍 Verifica stato server...');
      const response = await fetch(`${SERVER_URL}/health`, {
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
  },

  async fetchEsercizi(idStudente) {
    console.log('📚 Fetch esercizi per studente:', idStudente);
    
    try {
      const response = await fetch(`${SERVER_URL}/getesercizistudente?idStudente=${idStudente}`, {
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
        return data;
      } else {
        throw new Error(data.error || 'Errore nel caricamento degli esercizi');
      }
    } catch (error) {
      console.error('❌ Errore fetch esercizi:', error);
      throw error;
    }
  },

  async evaluateAudio({ audioBlob, parolaRiferimento, idStudente, idEsercizioAssegnato, tempoTotale, tentativoCorrente }) {
    console.log('🔍 Valutazione audio - parametri:', {
      parolaRiferimento,
      idStudente,
      idEsercizioAssegnato,
      tempoTotale,
      tentativoCorrente,
      audioBlobSize: audioBlob.size
    });

    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.wav');
      formData.append('referencetext', parolaRiferimento);
      formData.append('idStudente', idStudente.toString());
      formData.append('idEsercizioAssegnato', idEsercizioAssegnato.toString());
      formData.append('tempoImpiegato', tempoTotale.toString());
      formData.append('numeroTentativi', tentativoCorrente.toString());

      console.log('📤 Invio richiesta valutazione...');
      const response = await fetch(`${SERVER_URL}/checkpronunciation`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Errore HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('📥 Risposta valutazione:', data);

      if (data.status === 'success') {
        return data;
      } else {
        throw new Error(data.error || 'Errore nell\'analisi');
      }
    } catch (error) {
      console.error('❌ Errore valutazione audio:', error);
      throw error;
    }
  },

  async requestMicrophonePermission(setMicrophonePermission) {
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
  }
};
