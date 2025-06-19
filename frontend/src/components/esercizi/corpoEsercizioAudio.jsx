import React, { useState, useEffect, useRef } from 'react';
import styles from './corpoEsercizioAudio.module.css';
import logoUniba from '../../assets/logouniba.jpeg';

const CorpoEsercizioAudio = () => {
    const [isRecording, setIsRecording] = useState(false);
    const [microphonePermission, setMicrophonePermission] = useState('prompt');
    const [parolaRiferimento, setParolaRiferimento] = useState('');
    const [immagineParola, setImmagineParola] = useState('');
    const [imageError, setImageError] = useState(false);
    const [feedback, setFeedback] = useState('');
    const [results, setResults] = useState(null);
    const [currentWordId, setCurrentWordId] = useState(null);
    const [serverStatus, setServerStatus] = useState('checking');
    const [availableWords, setAvailableWords] = useState(0);
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);

    const SERVER_URL = 'http://127.0.0.1:5001';

    useEffect(() => {
        checkServerHealth();
        requestMicrophonePermissionOnLoad();
        getNuovaParola();
    }, []);

    const checkServerHealth = async () => {
        try {
            console.log('Verificando stato del server Flask...');
            const response = await fetch(`${SERVER_URL}/health`);
            if (response.ok) {
                const data = await response.json();
                setServerStatus('connected');
                setAvailableWords(data.available_words || 0);
                console.log('✅ Server Flask connesso:', data);
            } else {
                setServerStatus('error');
                console.error('❌ Server Flask risponde ma con errore');
            }
        } catch (error) {
            setServerStatus('disconnected');
            console.error('❌ Server Flask non raggiungibile:', error);
        }
    };

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
            console.log('Tentativo di connessione a:', `${SERVER_URL}/get_random_text`);
            const response = await fetch(`${SERVER_URL}/get_random_text`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('Risposta ricevuta:', data);
            
            if (data.status === 'success') {
                setParolaRiferimento(data.text);
                setImmagineParola(data.image || '');
                setImageError(false);
                setCurrentWordId(data.id);
                setFeedback('');
                setResults(null);
                setServerStatus('connected');
                
                if (data.image) {
                    console.log('Link immagine ricevuto:', data.image);
                } else {
                    console.log('Nessuna immagine per questa parola');
                }
            } else {
                console.error('Errore dal server:', data.error);
                alert('Errore nel caricamento della parola: ' + data.error);
                setServerStatus('error');
            }
        } catch (error) {
            console.error('Errore completo:', error);
            setServerStatus('disconnected');
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                alert(`Errore di connessione: Assicurati che il server Flask sia in esecuzione su ${SERVER_URL}`);
            } else {
                alert('Errore di connessione nel caricamento della parola: ' + error.message);
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
            const response = await fetch(`${SERVER_URL}/check_pronunciation`, {
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
                setServerStatus('connected');
            } else {
                setFeedback('Errore nell\'analisi: ' + data.error);
                setServerStatus('error');
            }
        } catch (error) {
            console.error('Errore fetch:', error);
            setFeedback('Errore di connessione nell\'analisi');
            setServerStatus('disconnected');
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

    const getServerStatusClass = () => {
        switch (serverStatus) {
            case 'connected': return styles.serverConnected;
            case 'disconnected': return styles.serverDisconnected;
            case 'error': return styles.serverError;
            default: return styles.serverChecking;
        }
    };

    const getServerStatusText = () => {
        switch (serverStatus) {
            case 'connected': return `🟢 Server connesso (${availableWords} parole disponibili)`;
            case 'disconnected': return '🔴 Server disconnesso';
            case 'error': return '🟡 Errore server';
            default: return '🔄 Verificando server...';
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
            <h1 className={styles.mainTitle}>
                <img src={logoUniba} alt="Logo Uniba" style={{ height: '60px', marginRight: '15px' }} />
                Esercizio di Pronuncia Italiana
            </h1>

            <div className={getServerStatusClass()}>
                {getServerStatusText()}
            </div>

            <div className={getPermissionStatusClass()}>
                {getPermissionStatusText()}
            </div>

            {microphonePermission === 'denied' && (
                <div className={styles.textControls}>
                    <button 
                        className={styles.permissionBtn}
                        onClick={requestMicrophonePermission}
                    >
                        🎤 Richiedi Permesso Microfono
                    </button>
                </div>
            )}

            <div className={styles.pronunciationArea}>
                {immagineParola && !imageError && (
                    <div className={styles.imageContainer}>
                        <img 
                            src={immagineParola} 
                            alt={parolaRiferimento}
                            className={styles.wordImage}
                            onLoad={() => {
                                console.log('✅ Immagine caricata con successo:', immagineParola);
                            }}
                            onError={(e) => {
                                console.error('❌ Errore caricamento immagine:', immagineParola);
                                setImageError(true);
                                e.target.style.display = 'none';
                            }}
                            crossOrigin="anonymous"
                        />
                    </div>
                )}

                {immagineParola && imageError && (
                    <div className={styles.imageError}>
                        <p>⚠️ Immagine non disponibile</p>
                        <small>{immagineParola}</small>
                    </div>
                )}

                <div className={styles.wordContainer}>
                    <div className={styles.referenceText}>
                        {parolaRiferimento || 'Caricamento parola...'}
                    </div>
                </div>

                <div className={styles.textControls}>
                    <p><strong>Pronuncia la parola italiana mostrata sopra</strong></p>
                    <button 
                        className={styles.permissionBtn}
                        onClick={getNuovaParola}
                        disabled={serverStatus !== 'connected'}
                    >
                        🔄 Nuova Parola
                    </button>
                </div>

                <div className={styles.controls}>
                    <button
                        className={`${styles.recordBtn} ${isRecording ? styles.recording : ''}`}
                        onClick={isRecording ? stopRecording : startRecording}
                        disabled={microphonePermission !== 'granted' || serverStatus !== 'connected'}
                    >
                        {isRecording ? '⏹️ Ferma Registrazione' : '🎤 Inizia Registrazione'}
                    </button>
                </div>

                {feedback && (
                    <div className={getFeedbackClass()}>
                        {feedback}
                    </div>
                )}

                {results && (
                    <div className={styles.results}>
                        <h4> Risultati della Pronuncia</h4>
                        <p><strong>Parola da pronunciare:</strong> {results.reference_text}</p>
                        <p><strong>Parola pronunciata:</strong> {results.transcribed_text}</p>
                        <p><strong>Accuratezza pronuncia:</strong> {results.similarity_score}%</p>

                        {results.corrections && results.corrections.length > 0 && (
                            <div className={styles.corrections}>
                                <h5>💡 Suggerimenti per migliorare:</h5>
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