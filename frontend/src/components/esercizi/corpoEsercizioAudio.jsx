import React, { useState, useEffect, useRef } from 'react';
import styles from './corpoEsercizioAudio.module.css';

const CorpoEsercizioAudio = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [microphonePermission, setMicrophonePermission] = useState('prompt');
  const [parolaRiferimento, setParolaRiferimento] = useState('');
  const [feedback, setFeedback] = useState('');
  const [results, setResults] = useState(null);
  const [currentWordId, setCurrentWordId] = useState(null);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  useEffect(() => {
    checkMicrophonePermission();
    getNuovaParola();
  }, []);

  const checkMicrophonePermission = async () => {
    try {
      if (navigator.permissions) {
        const permission = await navigator.permissions.query({ name: 'microphone' });
        setMicrophonePermission(permission.state);
        
        permission.onchange = function() {
          setMicrophonePermission(this.state);
        };
      } else {
        setMicrophonePermission('prompt');
      }
    } catch (error) {
      console.log('Permissions API non supportata:', error);
      setMicrophonePermission('prompt');
    }
  };

  const requestMicrophonePermission = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Il browser non supporta l\'accesso al microfono');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      setMicrophonePermission('granted');
      stream.getTracks().forEach(track => track.stop());
      alert('✅ Permesso microfono concesso con successo!');

    } catch (error) {
      console.error('Errore richiesta permesso:', error);
      if (error.name === 'NotAllowedError') {
        setMicrophonePermission('denied');
        alert('❌ Permesso microfono negato');
      }
    }
  };

  const getNuovaParola = async () => {
    try {
      const response = await fetch('/get_random_text');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.status === 'success') {
        setParolaRiferimento(data.text);
        setCurrentWordId(data.id);
        setFeedback('');
        setResults(null);
      } else {
        alert('Errore nel caricamento della parola: ' + data.error);
      }
    } catch (error) {
      console.error('Errore:', error);
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        alert('Errore di connessione: Assicurati che il server Flask sia in esecuzione su localhost:5000');
      } else {
        alert('Errore di connessione nel caricamento della parola');
      }
    }
  };

  const startRecording = async () => {
    try {
      if (microphonePermission !== 'granted') {
        alert('⚠️ Devi prima concedere il permesso per il microfono');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        sendAudioForEvaluation(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setFeedback('');
      setResults(null);

    } catch (error) {
      console.error('Errore durante la registrazione:', error);
      alert('Errore durante la registrazione: ' + error.message);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const sendAudioForEvaluation = async (audioBlob) => {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.wav');
    formData.append('reference_text', parolaRiferimento);

    try {
      setFeedback('Analizzando la pronuncia italiana...');

      const response = await fetch('/check_pronunciation', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.status === 'success') {
        setFeedback(data.feedback);
        setResults({
          reference_text: data.reference_text,
          transcribed_text: data.transcribed_text,
          similarity_score: data.similarity_score,
          corrections: data.corrections
        });
      } else {
        setFeedback('Errore nell\'analisi: ' + data.error);
      }

    } catch (error) {
      console.error('Errore fetch:', error);
      setFeedback('Errore di connessione');
    }
  };

  const getPermissionStatusClass = () => {
    switch (microphonePermission) {
      case 'granted': return styles.permissionGranted;
      case 'denied': return styles.permissionDenied;
      default: return styles.permissionPrompt;
    }
  };

  const getPermissionStatusText = () => {
    switch (microphonePermission) {
      case 'granted': return '✅ Permesso microfono concesso';
      case 'denied': return '❌ Permesso microfono negato';
      default: return '⚠️ Permesso microfono richiesto';
    }
  };

  const getFeedbackClass = () => {
    if (feedback === 'BRAVO') return `${styles.feedback} ${styles.bravo}`;
    if (feedback === 'PROVA A FARE DI MEGLIO') return `${styles.feedback} ${styles.migliorare}`;
    if (feedback === 'SBAGLIATO') return `${styles.feedback} ${styles.sbagliato}`;
    return styles.feedback;
  };

  return (
    <div className={styles.container}>
      <h1>🇮🇹 Pronuncia Italiana AI</h1>

      <div className={styles.pronunciationArea}>
        <div id="permissionSection">
          <h3>Stato Permessi Microfono:</h3>
          <div className={`${styles.permissionStatus} ${getPermissionStatusClass()}`}>
            {getPermissionStatusText()}
          </div>
          {microphonePermission !== 'granted' && (
            <button 
              className={styles.permissionBtn}
              onClick={requestMicrophonePermission}
            >
              🎤 Richiedi Permesso Microfono
            </button>
          )}
        </div>

        <div className={styles.textControls}>
          <button 
            className={styles.permissionBtn}
            onClick={getNuovaParola}
          >
            🎲 Nuova parola italiana
          </button>
        </div>

        <div className={styles.wordContainer}>
          <div className={styles.referenceText}>
            {parolaRiferimento || 'Caricamento parola italiana...'}
          </div>
          <div className={styles.italianFlag}>🇮🇹</div>
        </div>

        <div className={styles.controls}>
          {!isRecording ? (
            <button 
              className={styles.recordBtn}
              onClick={startRecording}
              disabled={microphonePermission !== 'granted'}
            >
              🎤 Pronuncia in italiano
            </button>
          ) : (
            <button 
              className={`${styles.recordBtn} ${styles.recording}`}
              onClick={stopRecording}
            >
              ⏹️ Ferma Registrazione
            </button>
          )}
        </div>

        {feedback && (
          <div className={getFeedbackClass()}>
            {feedback}
          </div>
        )}

        {results && (
          <div className={styles.results}>
            <h4>Risultati Pronuncia Italiana:</h4>
            <p><strong>Parola italiana da pronunciare:</strong> {results.reference_text}</p>
            <p><strong>Parola pronunciata:</strong> {results.transcribed_text}</p>
            {results.similarity_score && (
              <p><strong>Accuratezza pronuncia:</strong> {results.similarity_score}%</p>
            )}
            {results.corrections && results.corrections.length > 0 && (
              <div className={styles.corrections}>
                <h5>Suggerimenti per migliorare la pronuncia italiana:</h5>
                <ul>
                  {results.corrections.map((correction, index) => (
                    <li key={index}>{correction}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CorpoEsercizioAudio;
