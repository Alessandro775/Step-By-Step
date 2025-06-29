// URL del server Python per l'elaborazione degli esercizi di pronuncia
const SERVER_URL = 'http://127.0.0.1:5001';

/**
 * Oggetto serviziEsercizi - Contiene tutti i servizi per la gestione degli esercizi di pronuncia
 * Fornisce metodi per comunicare con il server Python che gestisce l'analisi audio,
 * il controllo dello stato del server e la gestione dei permessi del microfono
 */
export const serviziEsercizi = {
   /**
   * Verifica lo stato di salute del server Python
   * Controlla se il server di elaborazione audio è attivo e raggiungibile
   * Utilizzato per mostrare indicatori di stato nell'interfaccia utente*/
  async checkServerHealth(setServerStatus) {
    try {
      console.log('🔍 Verifica stato server...');
      // Effettua una chiamata GET all'endpoint di health check del server Python
      const response = await fetch(`${SERVER_URL}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
       // Determina lo stato del server basato sulla risposta HTTP
      const status = response.ok ? 'connected' : 'error';
       // Aggiorna lo stato nell'interfaccia utente tramite callback
      console.log('🔍 Stato server:', status);
      setServerStatus(status);
    } catch (error) {
       // Gestisce errori di rete o di connessione
      console.error('❌ Errore verifica server:', error);
      setServerStatus('disconnected');
    }
  },
 /**
   * Recupera tutti gli esercizi assegnati a uno specifico studente
   * Comunica con il server Python per ottenere la lista degli esercizi
   * di pronuncia personalizzati per lo studente*/
  async fetchEsercizi(idStudente) {
    console.log('📚 Fetch esercizi per studente:', idStudente);
    
    try {
       // Effettua la chiamata GET per recuperare gli esercizi dello studente specifico
      const response = await fetch(`${SERVER_URL}/getesercizistudente?idStudente=${idStudente}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      // Verifica se la risposta indica un errore HTTP
      if (!response.ok) {
        throw new Error(`Errore HTTP ${response.status}: ${response.statusText}`);
      }
        // Converte la risposta in JSON
      const data = await response.json();
      console.log('📚 Dati esercizi ricevuti:', data);
        // Verifica se il server ha restituito un successo
      if (data.status === 'success') {
        return data;
      } else {
        throw new Error(data.error || 'Errore nel caricamento degli esercizi');
      }
    } catch (error) {
       // Gestisce tutti gli errori durante il recupero degli esercizi
      console.error('❌ Errore fetch esercizi:', error);
      throw error;
    }
  },
   /**
   * Valuta la pronuncia di un audio registrato dallo studente
   * Invia l'audio al server Python per l'analisi della pronuncia e riceve
   * un punteggio di accuratezza confrontando con la parola di riferimento*/
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
      /**
       * Crea FormData per inviare il file audio e i metadati
       * FormData è necessario per gestire l'upload di file binari (audio)
       * insieme ai dati testuali dell'esercizio
       */
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.wav');
      formData.append('referencetext', parolaRiferimento);
      formData.append('idStudente', idStudente.toString());
      formData.append('idEsercizioAssegnato', idEsercizioAssegnato.toString());
      formData.append('tempoImpiegato', tempoTotale.toString());
      formData.append('numeroTentativi', tentativoCorrente.toString());

      console.log('📤 Invio richiesta valutazione...');
      // Effettua la chiamata POST per inviare l'audio al server per l'analisi
      const response = await fetch(`${SERVER_URL}/checkpronunciation`, {
        method: 'POST',
        body: formData,
      });
        // Verifica se la richiesta è andata a buon fine
      if (!response.ok) {
        throw new Error(`Errore HTTP ${response.status}: ${response.statusText}`);
      }
      // Converte la risposta del server in JSON
      const data = await response.json();
      console.log('📥 Risposta valutazione:', data);
      // Verifica se l'analisi è stata completata con successo
      if (data.status === 'success') {
        return data;
      } else {
        throw new Error(data.error || 'Errore nell\'analisi');
      }
    } catch (error) {
      // Gestisce tutti gli errori durante la valutazione audio
      console.error('❌ Errore valutazione audio:', error);
      throw error;
    }
  },
  /**
   * Richiede il permesso per utilizzare il microfono del dispositivo
   * Gestisce la richiesta di autorizzazione per registrare audio
   * e aggiorna lo stato dei permessi nell'interfaccia utente*/
    async requestMicrophonePermission(setMicrophonePermission) {
    try {
       //Richiede l'accesso al microfono tramite l'API MediaDevices
      console.log('🎤 Richiesta permesso microfono...');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Se la richiesta ha successo, aggiorna lo stato a 'granted'
      setMicrophonePermission('granted');
      //Ferma immediatamente tutti i track audio per rilasciare il microfono
      stream.getTracks().forEach(track => track.stop());
      console.log('✅ Permesso microfono concesso');
    } catch (error) {
       // Gestisce i diversi tipi di errore dei permessi del microfono
      console.error('❌ Errore permesso microfono:', error);
      // Determina il tipo di errore per fornire feedback appropriato:
      const permission = error.name === 'NotAllowedError' ? 'denied' : 'prompt';
      setMicrophonePermission(permission);
    }
  }
};
