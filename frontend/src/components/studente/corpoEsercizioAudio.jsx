import React, { useState, useEffect, useRef } from 'react';
import styles from './corpoEsercizioAudio.module.css';
import logoUniba from '../../assets/logouniba.jpeg';

const CorpoEsercizioAudio = () => {
    // Stati per la navigazione
    const [currentView, setCurrentView] = useState('home'); // 'home' o 'esercizio'
    const [esercizioCorrente, setEsercizioCorrente] = useState(null);
    
    // Stati per la home
    const [esercizi, setEsercizi] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // Stati per l'esercizio
    const [isRecording, setIsRecording] = useState(false);
    const [microphonePermission, setMicrophonePermission] = useState('prompt');
    const [parolaRiferimento, setParolaRiferimento] = useState('');
    const [immagineParola, setImmagineParola] = useState('');
    const [imageError, setImageError] = useState(false);
    const [feedback, setFeedback] = useState('');
    const [results, setResults] = useState(null);
    const [serverStatus, setServerStatus] = useState('checking');
    const [idStudente, setIdStudente] = useState(null);
    const [idEsercizioAssegnato, setIdEsercizioAssegnato] = useState(null);
    
    // Stati per tracciare l'esercizio
    const [numeroTentativi, setNumeroTentativi] = useState(0);
    const [tempoInizio, setTempoInizio] = useState(null);
    const [tempoImpiegato, setTempoImpiegato] = useState(0);
    const [esercizioCompletato, setEsercizioCompletato] = useState(false);
    const [statisticheFinali, setStatisticheFinali] = useState(null);
    const [tentativiRimanenti, setTentativiRimanenti] = useState(10);
    
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const timerRef = useRef(null);

    const SERVER_URL = 'http://127.0.0.1:5001';
    const MAX_TENTATIVI = 10;

    // Inizializzazione
    useEffect(() => {
        // Ottieni l'ID studente dal token
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                if (payload.ruolo === 'S') {
                    setIdStudente(payload.id);
                    console.log('ID Studente estratto dal token:', payload.id);
                }
            } catch (error) {
                console.error('Errore decodifica token:', error);
            }
        }
        
        checkServerHealth();
        requestMicrophonePermissionOnLoad();
    }, []);

    // Carica esercizi quando l'ID studente è disponibile
    useEffect(() => {
        if (idStudente && currentView === 'home') {
            fetchEsercizi();
        }
    }, [idStudente, currentView]);

    // Timer per aggiornare il tempo in tempo reale
    useEffect(() => {
        if (tempoInizio && !esercizioCompletato && currentView === 'esercizio') {
            timerRef.current = setInterval(() => {
                const tempoCorrente = Math.round((Date.now() - tempoInizio) / 1000);
                setTempoImpiegato(tempoCorrente);
            }, 1000);
        } else {
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        }

        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        };
    }, [tempoInizio, esercizioCompletato, currentView]);

    // ===== FUNZIONI PER LA HOME =====
    const fetchEsercizi = async () => {
        try {
            setLoading(true);
            console.log('🔄 Caricando esercizi per studente:', idStudente);
            
            // Verifica prima se il server è raggiungibile
            const healthResponse = await fetch(`${SERVER_URL}/health`);
            if (!healthResponse.ok) {
                throw new Error('Server Flask non raggiungibile');
            }
            
            const response = await fetch(`${SERVER_URL}/get_esercizi_studente?idStudente=${idStudente}`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('✅ Risposta esercizi:', data);
            
            if (data.status === 'success') {
                setEsercizi(data.esercizi);
                setError(null);
                console.log(`📚 Caricati ${data.esercizi.length} esercizi`);
            } else {
                setError(data.error);
            }
        } catch (error) {
            console.error('❌ Errore fetch esercizi:', error);
            
            // Messaggi di errore più specifici
            let errorMessage = 'Errore nel caricamento degli esercizi';
            
            if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
                errorMessage = `🔌 Server Flask non raggiungibile su ${SERVER_URL}. Verifica che sia avviato.`;
            } else if (error.message.includes('HTTP error')) {
                errorMessage = `📡 Errore server: ${error.message}`;
            } else {
                errorMessage = `⚠️ ${error.message}`;
            }
            
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleStartEsercizio = (esercizio) => {
        if (esercizio.completato) {
            alert('Questo esercizio è già stato completato!');
            return;
        }
        
        console.log('Avvio esercizio:', esercizio);
        setEsercizioCorrente(esercizio);
        
        // Inizializza l'esercizio
        setParolaRiferimento(esercizio.testo);
        setImmagineParola(esercizio.immagine || '');
        setIdEsercizioAssegnato(esercizio.idEsercizioAssegnato);
        setImageError(false);
        setFeedback('');
        setResults(null);
        
        // Reset statistiche esercizio
        setNumeroTentativi(0);
        setTentativiRimanenti(MAX_TENTATIVI);
        setTempoInizio(Date.now());
        setTempoImpiegato(0);
        setEsercizioCompletato(false);
        setStatisticheFinali(null);
        
        // Cambia vista
        setCurrentView('esercizio');
    };

    const handleTornaHome = () => {
        // Pulisci i timer
        if (timerRef.current) {
            clearInterval(timerRef.current);
        }
        
        // Ferma eventuale registrazione
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
        
        // Reset stati esercizio
        setEsercizioCorrente(null);
        setParolaRiferimento('');
        setImmagineParola('');
        setIdEsercizioAssegnato(null);
        setFeedback('');
        setResults(null);
        setNumeroTentativi(0);
        setEsercizioCompletato(false);
        setStatisticheFinali(null);
        
        // Torna alla home
        setCurrentView('home');
        
        console.log('🏠 Tornato alla home');
    };

    // ===== FUNZIONI PER L'ESERCIZIO =====
    
    const checkServerHealth = async () => {
        try {
            const response = await fetch(`${SERVER_URL}/health`);
            if (response.ok) {
                const data = await response.json();
                setServerStatus('connected');
                console.log('✅ Server Flask connesso:', data);
            } else {
                setServerStatus('error');
            }
        } catch (error) {
            console.error('❌ Server Flask non raggiungibile:', error);
            setServerStatus('disconnected');
        }
    };

    const requestMicrophonePermissionOnLoad = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            setMicrophonePermission('granted');
            stream.getTracks().forEach(track => track.stop());
            console.log('✅ Permesso microfono già concesso');
        } catch (error) {
            if (error.name === 'NotAllowedError') {
                setMicrophonePermission('denied');
            } else {
                setMicrophonePermission('prompt');
            }
        }
    };

    const requestMicrophonePermission = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            setMicrophonePermission('granted');
            stream.getTracks().forEach(track => track.stop());
            console.log('✅ Permesso microfono concesso');
        } catch (error) {
            console.error('❌ Permesso microfono negato:', error);
            setMicrophonePermission('denied');
            alert('⚠️ Devi concedere il permesso per il microfono per utilizzare questa funzionalità');
        }
    };

    const startRecording = async () => {
        try {
            if (numeroTentativi >= MAX_TENTATIVI) {
                alert(`⚠️ Hai raggiunto il limite di ${MAX_TENTATIVI} tentativi per questa parola!`);
                return;
            }

            if (microphonePermission !== 'granted') {
                await requestMicrophonePermission();
                if (microphonePermission !== 'granted') {
                    alert('⚠️ Devi concedere il permesso per il microfono per registrare');
                    return;
                }
            }

            const nuovoNumeroTentativi = numeroTentativi + 1;
            setNumeroTentativi(nuovoNumeroTentativi);
            setTentativiRimanenti(MAX_TENTATIVI - nuovoNumeroTentativi);

            console.log(`🎯 Tentativo ${nuovoNumeroTentativi}/${MAX_TENTATIVI} per la parola: ${parolaRiferimento}`);

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
                sendAudioForEvaluation(audioBlob, nuovoNumeroTentativi);
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorderRef.current.start();
            setIsRecording(true);
            setFeedback('🎤 Registrazione in corso...');
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
            setFeedback('⏳ Elaborazione audio...');
        }
    };

    const sendAudioForEvaluation = async (audioBlob, tentativoCorrente) => {
        const tempoCorrente = Date.now();
        const tempoTotale = Math.round((tempoCorrente - tempoInizio) / 1000);

        const formData = new FormData();
        formData.append('audio', audioBlob, 'recording.wav');
        formData.append('reference_text', parolaRiferimento);
        formData.append('idStudente', idStudente);
        formData.append('idEsercizioAssegnato', idEsercizioAssegnato);
        formData.append('tempoImpiegato', tempoTotale);
        formData.append('numeroTentativi', tentativoCorrente);

        try {
            setFeedback('🤖 Analizzando la pronuncia...');
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
                setTentativiRimanenti(data.tentativi_rimanenti || 0);

                if (data.esercizio_completato) {
                    setEsercizioCompletato(true);
                    
                    let messaggioFinale = '';
                    let tipoCompletamento = '';
                    
                    if (data.feedback === 'BRAVO') {
                        messaggioFinale = `🎉 Perfetto! Hai pronunciato correttamente "${data.reference_text}"!`;
                        tipoCompletamento = 'successo';
                    } else {
                        messaggioFinale = `⏰ Hai raggiunto il limite di ${MAX_TENTATIVI} tentativi per "${data.reference_text}".`;
                        tipoCompletamento = 'limite';
                    }
                    
                    setStatisticheFinali({
                        parola: data.reference_text,
                        tempo_impiegato: data.tempo_impiegato,
                        numero_tentativi: data.numero_tentativi,
                        punteggio: data.similarity_score,
                        feedback: data.feedback,
                        messaggio: messaggioFinale,
                        tipo: tipoCompletamento,
                        successo: data.feedback === 'BRAVO'
                    });

                    console.log(`✅ Esercizio completato: ${data.feedback} in ${data.numero_tentativi} tentativi`);
                    
                    if (timerRef.current) {
                        clearInterval(timerRef.current);
                    }
                }
            } else {
                setFeedback('❌ Errore nell\'analisi: ' + data.error);
                setServerStatus('error');
            }
        } catch (error) {
            console.error('Errore fetch:', error);
            setFeedback('❌ Errore di connessione nell\'analisi');
            setServerStatus('disconnected');
        }
    };

    // Funzioni di utilità per gli stili
    const getServerStatusClass = () => {
        switch (serverStatus) {
            case 'connected': return styles.statusConnected;
            case 'disconnected': return styles.statusDisconnected;
            case 'error': return styles.statusError;
            default: return styles.statusChecking;
        }
    };

    const getServerStatusText = () => {
        switch (serverStatus) {
            case 'connected': return '✅ Server connesso';
            case 'disconnected': return '❌ Server non raggiungibile';
            case 'error': return '⚠️ Errore server';
            default: return '🔄 Verificando connessione...';
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
            case 'granted': return '🎤 Microfono autorizzato';
            case 'denied': return '🚫 Microfono negato';
            default: return '⏳ Verifica permessi microfono...';
        }
    };

    const getFeedbackClass = () => {
        if (feedback.includes('BRAVO')) return styles.feedbackSuccess;
        if (feedback.includes('PROVA A FARE DI MEGLIO')) return styles.feedbackWarning;
        if (feedback.includes('SBAGLIATO')) return styles.feedbackError;
        return styles.feedbackInfo;
    };

    // ===== RENDER CONDIZIONALE =====
    
    // VISTA HOME
    if (currentView === 'home') {
        if (loading) {
            return (
                <div className={styles.container}>
                    <h1 className={styles.mainTitle}>
                        <img src={logoUniba} alt="Logo Uniba" style={{ height: '60px', marginRight: '15px' }} />
                        I Tuoi Esercizi di Pronuncia
                    </h1>
                    <div className={styles.loading}>
                        <div className={styles.spinner}></div>
                        <span>Caricamento esercizi...</span>
                    </div>
                </div>
            );
        }

        if (error) {
            return (
                <div className={styles.container}>
                    <h1 className={styles.mainTitle}>
                        <img src={logoUniba} alt="Logo Uniba" style={{ height: '60px', marginRight: '15px' }} />
                        I Tuoi Esercizi di Pronuncia
                    </h1>
                    <div className={styles.error}>
                        <h2>❌ Errore</h2>
                        <p>{error}</p>
                        <button onClick={fetchEsercizi} className={styles.retryButton}>
                            🔄 Riprova
                        </button>
                    </div>
                </div>
            );
        }

        const eserciziRimanenti = esercizi.filter(e => !e.completato);
        const eserciziCompletati = esercizi.filter(e => e.completato);

        return (
            <div className={styles.container}>
                <h1 className={styles.mainTitle}>
                    <img src={logoUniba} alt="Logo Uniba" style={{ height: '60px', marginRight: '15px' }} />
                    I Tuoi Esercizi di Pronuncia
                </h1>
                
                <div className={styles.stats}>
                    <div className={styles.statCard}>
                        <h3>📋 Totali</h3>
                        <span className={styles.statNumber}>{esercizi.length}</span>
                    </div>
                    <div className={styles.statCard}>
                        <h3>⏳ Da Fare</h3>
                        <span className={styles.statNumber}>{eserciziRimanenti.length}</span>
                    </div>
                    <div className={styles.statCard}>
                        <h3>✅ Completati</h3>
                        <span className={styles.statNumber}>{eserciziCompletati.length}</span>
                    </div>
                </div>

                {/* Esercizi da fare */}
                {eserciziRimanenti.length > 0 && (
                    <div className={styles.section}>
                        <h2>🎯 Esercizi da Completare</h2>
                        <div className={styles.eserciziGrid}>
                            {eserciziRimanenti.map((esercizio) => (
                                <div key={esercizio.idEsercizioAssegnato} className={styles.esercizioCard}>
                                    <div className={styles.cardHeader}>
                                        <h3>📝 {esercizio.testo}</h3>
                                        <span className={styles.badge}>Da fare</span>
                                    </div>
                                    
                                    {esercizio.immagine && (
                                        <div className={styles.cardImage}>
                                            <img 
                                                src={esercizio.immagine} 
                                                alt={esercizio.testo}
                                                onError={(e) => {
                                                    e.target.style.display = 'none';
                                                }}
                                            />
                                        </div>
                                    )}
                                    
                                    <div className={styles.cardInfo}>
                                        <p><strong>Tipo:</strong> {esercizio.tipologia}</p>
                                        <p><strong>Descrizione:</strong> {esercizio.descrizione}</p>
                                        <p><strong>Assegnato il:</strong> {esercizio.data_assegnazione}</p>
                                    </div>
                                    
                                    <button 
                                        className={styles.startButton}
                                        onClick={() => handleStartEsercizio(esercizio)}
                                    >
                                        🎤 Inizia Esercizio
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Esercizi completati */}
                {eserciziCompletati.length > 0 && (
                    <div className={styles.section}>
                        <h2>✅ Esercizi Completati</h2>
                        <div className={styles.eserciziGrid}>
                            {eserciziCompletati.map((esercizio) => (
                                <div key={esercizio.idEsercizioAssegnato} className={`${styles.esercizioCard} ${styles.completato}`}>
                                    <div className={styles.cardHeader}>
                                        <h3>📝 {esercizio.testo}</h3>
                                        <span className={styles.badgeCompletato}>Completato</span>
                                    </div>
                                    
                                    <div className={styles.cardInfo}>
                                        <p><strong>Tipo:</strong> {esercizio.tipologia}</p>
                                        <p><strong>Completato</strong></p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {esercizi.length === 0 && (
                    <div className={styles.noEsercizi}>
                        <h2>📚 Nessun Esercizio Assegnato</h2>
                        <p>Non hai ancora esercizi di pronuncia assegnati.</p>
                        <p>Contatta il tuo educatore per ricevere nuovi esercizi.</p>
                        <button onClick={fetchEsercizi} className={styles.refreshButton}>
                            🔄 Aggiorna
                        </button>
                    </div>
                )}
            </div>
        );
    }

    // VISTA ESERCIZIO
    if (currentView === 'esercizio') {
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

                {/* Statistiche finali quando l'esercizio è completato */}
                {esercizioCompletato && statisticheFinali && (
                    <div className={`${styles.statisticheFinali} ${statisticheFinali.tipo === 'successo' ? styles.successo : styles.limite}`}>
                        <h2>{statisticheFinali.tipo === 'successo' ? '🎉 Esercizio Completato!' : '⏰ Limite Raggiunto'}</h2>
                        <p className={styles.messaggioFinale}>{statisticheFinali.messaggio}</p>
                        
                        <div className={styles.statisticheCard}>
                            <h3>📊 Risultati Finali</h3>
                            <div className={styles.statItem}>
                                <span className={styles.statLabel}>Parola:</span>
                                <span className={styles.statValue}>{statisticheFinali.parola}</span>
                            </div>
                            <div className={styles.statItem}>
                                <span className={styles.statLabel}>Tempo impiegato:</span>
                                <span className={styles.statValue}>{statisticheFinali.tempo_impiegato} secondi</span>
                            </div>
                            <div className={styles.statItem}>
                                <span className={styles.statLabel}>Numero di tentativi:</span>
                                <span className={styles.statValue}>{statisticheFinali.numero_tentativi}/{MAX_TENTATIVI}</span>
                            </div>
                            <div className={styles.statItem}>
                                <span className={styles.statLabel}>Accuratezza finale:</span>
                                <span className={styles.statValue}>{statisticheFinali.punteggio}%</span>
                            </div>
                            <div className={styles.statItem}>
                                <span className={styles.statLabel}>Valutazione:</span>
                                <span className={`${styles.statValue} ${styles.feedbackFinal}`}>{statisticheFinali.feedback}</span>
                            </div>
                        </div>
                        
                        <button 
                            className={styles.tornaHomeBtn}
                            onClick={handleTornaHome}
                        >
                            🏠 Torna alla Home
                        </button>
                    </div>
                )}

                {/* Area esercizio */}
                {!esercizioCompletato && (
                    <div className={styles.pronunciationArea}>
                        {/* Header esercizio */}
                        <div className={styles.exerciseHeader}>
                            <button 
                                className={styles.backButton}
                                onClick={handleTornaHome}
                            >
                                ← Torna alla Home
                            </button>
                            <h2>Esercizio: {esercizioCorrente?.testo}</h2>
                        </div>

                        {/* Informazioni tentativo corrente */}
                        <div className={styles.infoTentativo}>
                            <span>Tentativo: {numeroTentativi}/{MAX_TENTATIVI}</span>
                            <span className={styles.rimanenti}>Rimanenti: {tentativiRimanenti}</span>
                            <span>Tempo: {tempoImpiegato}s</span>
                        </div>

                        {/* Barra di progresso tentativi */}
                        <div className={styles.progressBar}>
                            <div 
                                className={styles.progressFill} 
                                style={{
                                    width: `${(numeroTentativi / MAX_TENTATIVI) * 100}%`,
                                    backgroundColor: numeroTentativi >= 8 ? '#ff4444' : numeroTentativi >= 5 ? '#ffaa00' : '#4CAF50'
                                }}
                            ></div>
                        </div>

                        {/* Immagine della parola */}
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

                        {/* Parola da pronunciare */}
                        <div className={styles.wordContainer}>
                            <div className={styles.referenceText}>
                                {parolaRiferimento || 'Caricamento parola...'}
                            </div>
                        </div>

                        {/* Istruzioni */}
                        <div className={styles.textControls}>
                            <p><strong>Pronuncia chiaramente la parola italiana mostrata sopra</strong></p>
                            <p><small>Hai {tentativiRimanenti} tentativi rimanenti per completare questo esercizio</small></p>
                        </div>

                        {/* Controlli registrazione */}
                        <div className={styles.controls}>
                            <button
                                className={`${styles.recordBtn} ${isRecording ? styles.recording : ''}`}
                                onClick={isRecording ? stopRecording : startRecording}
                                disabled={
                                    microphonePermission !== 'granted' || 
                                    serverStatus !== 'connected' || 
                                    !idStudente || 
                                    numeroTentativi >= MAX_TENTATIVI
                                }
                            >
                                {isRecording ? '⏹️ Ferma Registrazione' : 
                                 numeroTentativi >= MAX_TENTATIVI ? '🚫 Limite Raggiunto' :
                                 `🎤 Registra (${numeroTentativi + 1}/${MAX_TENTATIVI})`}
                            </button>
                        </div>

                        {/* Feedback */}
                        {feedback && (
                            <div className={getFeedbackClass()}>
                                {feedback}
                            </div>
                        )}

                        {/* Risultati del tentativo */}
                        {results && !esercizioCompletato && (
                            <div className={styles.results}>
                                <h4>📊 Risultati del Tentativo {numeroTentativi}/{MAX_TENTATIVI}</h4>
                                <div className={styles.resultGrid}>
                                    <div className={styles.resultItem}>
                                        <strong>Parola da pronunciare:</strong>
                                        <span>{results.reference_text}</span>
                                    </div>
                                    <div className={styles.resultItem}>
                                        <strong>Parola pronunciata:</strong>
                                        <span>{results.transcribed_text}</span>
                                    </div>
                                    <div className={styles.resultItem}>
                                        <strong>Accuratezza pronuncia:</strong>
                                        <span>{results.similarity_score}%</span>
                                    </div>
                                </div>

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

                                {tentativiRimanenti > 0 && (
                                    <div className={styles.encouragement}>
                                        <p>🔄 Puoi riprovare! Hai ancora {tentativiRimanenti} tentativi.</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    }

    return null;
};

export default CorpoEsercizioAudio;
