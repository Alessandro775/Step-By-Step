import React, { useState, useEffect, useRef } from 'react';
import styles from './PronunciationApp.module.css';

const PronunciationApp = () => {
  const [currentWord, setCurrentWord] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [transcribedText, setTranscribedText] = useState('');
  const [similarityScore, setSimilarityScore] = useState(0);
  const [corrections, setCorrections] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [connectionError, setConnectionError] = useState(false);
  
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const API_BASE = 'http://localhost:5000';

  useEffect(() => {
    testConnection();
    getRandomWord();
  }, []);

  const testConnection = async () => {
    try {
      console.log('🔍 Testing connection to:', API_BASE);
      const response = await fetch(`${API_BASE}/`);
      const data = await response.json();
      console.log('✅ Server connection OK:', data);
      setConnectionError(false);
    } catch (error) {
      console.error('❌ Server connection failed:', error);
      setConnectionError(true);
    }
  };

  const getRandomWord = async () => {
    try {
      console.log('🔄 Requesting new word...');
      const response = await fetch(`${API_BASE}/get_random_word`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('📝 Server response:', data);
      
      if (data.status === 'success') {
        setCurrentWord(data.word);
        resetFeedback();
        setConnectionError(false);
      }
    } catch (error) {
      console.error('❌ Error loading word:', error);
      setConnectionError(true);
      setCurrentWord('Errore connessione');
    }
  };

  const resetFeedback = () => {
    setFeedback('');
    setTranscribedText('');
    setSimilarityScore(0);
    setCorrections([]);
  };

  const startRecording = async () => {
    if (connectionError) {
      alert('❌ Errore: Server non raggiungibile. Verifica che il backend sia avviato su http://localhost:5000');
      return;
    }

    if (!currentWord || currentWord === 'Errore connessione') {
      alert('❌ Nessuna parola disponibile. Riprova a caricare una parola.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        }
      });
      
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        sendAudioForAnalysis(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      console.log('🎤 Recording started');
    } catch (error) {
      console.error('❌ Microphone access error:', error);
      alert('❌ Errore nell\'accesso al microfono. Verifica i permessi del browser.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      console.log('⏹️ Recording stopped');
    }
  };

  const sendAudioForAnalysis = async (audioBlob) => {
    setIsLoading(true);
    console.log('📤 Sending audio for analysis...');
    
    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.wav');
    formData.append('reference_text', currentWord);

    try {
      const response = await fetch(`${API_BASE}/check_pronunciation`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      console.log('📥 Analysis response:', data);
      
      if (data.status === 'success') {
        setFeedback(data.feedback);
        setTranscribedText(data.transcribed_text);
        setSimilarityScore(data.similarity_score);
        setCorrections(data.corrections || []);
      } else {
        alert(`❌ Errore: ${data.error}`);
        if (data.solution) {
          console.log('💡 Suggested solution:', data.solution);
        }
      }
    } catch (error) {
      console.error('❌ Analysis error:', error);
      alert('❌ Errore nella comunicazione con il server. Verifica che il backend sia attivo.');
    } finally {
      setIsLoading(false);
    }
  };

  const getFeedbackClass = () => {
    switch (feedback) {
      case 'BRAVO': return styles.feedbackSuccess;
      case 'PROVA A FARE DI MEGLIO': return styles.feedbackWarning;
      case 'SBAGLIATO': return styles.feedbackError;
      default: return '';
    }
  };

  return (
    <div className={styles.pronunciationApp}>
      {connectionError && (
        <div className={styles.errorBanner}>
          ⚠️ Errore di connessione al server. Verifica che il backend sia avviato su http://localhost:5000
          <button onClick={testConnection} className={styles.retryBtn}>
            🔄 Riprova Connessione
          </button>
        </div>
      )}
      
      <header className={styles.appHeader}>
        <h1>🎯 Allenatore di Pronuncia Italiana</h1>
        <p>Migliora la tua pronuncia italiana con l'intelligenza artificiale</p>
        {!connectionError && (
          <div className={styles.statusIndicator}>
            ✅ Server connesso
          </div>
        )}
      </header>

      <main className={styles.appMain}>
        <div className={styles.wordSection}>
          <div className={styles.currentWord}>
            <div className={styles.wordDisplay}>
              <span className={styles.wordText}>
                {currentWord || 'Caricamento...'}
              </span>
            </div>
            <button 
              className={styles.newWordBtn}
              onClick={getRandomWord}
              disabled={isLoading || connectionError}
            >
              🔄 Nuova Parola
            </button>
          </div>
        </div>

        <div className={styles.recordingSection}>
          <div className={styles.instructions}>
            <p>
              {isRecording 
                ? '🔴 Pronuncia la parola chiaramente e premi "Ferma"'
                : '🎯 Premi "Registra" e pronuncia la parola mostrata sopra'
              }
            </p>
          </div>
          
          <div className={styles.recordingControls}>
            <button
              className={`${styles.recordBtn} ${isRecording ? styles.recording : ''}`}
              onClick={isRecording ? stopRecording : startRecording}
              disabled={isLoading || !currentWord || connectionError || currentWord === 'Errore connessione'}
            >
              {isRecording ? '⏹️ Ferma' : '🎤 Registra'}
            </button>
            
            {isRecording && (
              <div className={styles.recordingIndicator}>
                🔴 Registrando... Parla ora!
              </div>
            )}
            {isLoading && (
              <div className={styles.loadingIndicator}>
                ⏳ Analizzando la tua pronuncia...
              </div>
            )}
          </div>
        </div>

        {feedback && (
          <div className={`${styles.feedbackSection} ${getFeedbackClass()}`}>
            <div className={styles.feedbackMain}>
              <h3>{feedback}</h3>
              <div className={styles.transcription}>
                <strong>Hai detto:</strong> "{transcribedText}"
              </div>
              <div className={styles.similarity}>
                <strong>Precisione:</strong> {similarityScore}%
              </div>
            </div>
            
            {corrections.length > 0 && (
              <div className={styles.corrections}>
                <h4>💡 Suggerimenti per migliorare:</h4>
                <ul>
                  {corrections.map((tip, index) => (
                    <li key={index}>{tip}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default PronunciationApp;
