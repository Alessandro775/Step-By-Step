import React, { useState, useEffect, useRef } from 'react';
import styles from './corpoEsercizioAudio.module.css';
import logoUniba from '../../assets/logouniba.jpeg';


const CorpoEsercizioAudio = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [microphonePermission, setMicrophonePermission] = useState('prompt');
  const [parolaRiferimento, setParolaRiferimento] = useState('');
  const [feedback, setFeedback] = useState('');
  const [results, setResults] = useState(null);
  const [currentWordId, setCurrentWordId] = useState(null);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  // Richiedi automaticamente i permessi del microfono al caricamento della pagina
  useEffect(() => {
    requestMicrophonePermissionOnLoad();
    getNuovaParola();
  }, []);

  const requestMicrophonePermissionOnLoad = async () => {
    try {
      console.log('Richiedendo permessi microfono automaticamente...');
      
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      setMicrophonePermission('granted');
      console.log('✅ Permessi microfono concessi automaticamente');
      
      stream.getTracks().forEach(track => track.stop());
      
    } catch (error) {
      console.error('Errore richiesta permessi automatica:', error);
      
      if (error.name === 'NotAllowedError') {
        setMicrophonePermission('denied');
        console.log('❌ Permessi microfono negati dall\'utente');
      } else if (error.name === 'NotFoundError') {
        console.log('❌ Nessun microfono trovato');
        setMicrophonePermission('denied');
      } else {
        console.log('❌ Errore generico:', error.message);
        setMicrophonePermission('prompt');
      }
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
      alert('✅ Permesso microfono concesso!');

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
        await requestMicrophonePermission();
        if (microphonePermission !== 'granted') {
          alert('⚠️ Devi concedere il permesso per il microfono per registrare');
          return;
        }
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
      setFeedback('Analizzando la pronuncia...');

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
      case 'granted': return '✅ Microfono pronto';
      case 'denied': return '❌ Microfono bloccato';
      default: return '⏳ Richiedendo permessi...';
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
      <h1 className={styles.mainTitle}>Pronuncia la parola correttamente</h1>

      <div className={styles.pronunciationArea}>
        {/* Immagine locale sempre visibile per test */}
        <div className={styles.imageContainer}>
          <img 
            src={logoUniba} 
            alt="Logo Università di Bari"
            className={styles.wordImage}
          />
        </div>

        <div className={styles.textControls}>
          PAROLA
        </div>

      {/* Stato microfono sempre visibile */}
        <div className={styles.microphoneStatus}>
          <div className={`${styles.permissionStatus} ${getPermissionStatusClass()}`}>
            {getPermissionStatusText()}
          </div>
          {microphonePermission === 'denied' && (
            <button 
              className={styles.permissionBtn}
              onClick={requestMicrophonePermission}
            >
              🎤 Riprova Permesso Microfono
            </button>
          )}
        </div>

        <div className={styles.controls}>
          {!isRecording ? (
            <button 
              className={styles.recordBtn}
              onClick={startRecording}
              disabled={!parolaRiferimento || microphonePermission === 'denied'}
            >
              🎤 premi per eseguire la registrazione
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
            <h4>Risultati:</h4>
            <p><strong>Parola da pronunciare:</strong> {results.reference_text}</p>
            <p><strong>Parola pronunciata:</strong> {results.transcribed_text}</p>
            {results.similarity_score && (
              <p><strong>Accuratezza pronuncia:</strong> {results.similarity_score}%</p>
            )}
            {results.corrections && results.corrections.length > 0 && (
              <div className={styles.corrections}>
                <h5>Suggerimenti per migliorare:</h5>
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
