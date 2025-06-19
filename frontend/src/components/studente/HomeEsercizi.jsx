// HomeEsercizi.jsx - VERSIONE CORRETTA
import React, { useState, useEffect } from 'react';
import styles from './HomeEsercizi.module.css';
import esercizio from './corpoEsercizioAudio';

const HomeEsercizi = ({ onStartEsercizio }) => {
    const [esercizi, setEsercizi] = useState([]);
    const [loading, setLoading] = useState(true); // ✅ CORRETTO
    const [error, setError] = useState(null); // ✅ CORRETTO
    const [idStudente, setIdStudente] = useState(null);

    const SERVER_URL = 'http://127.0.0.1:5001';

    useEffect(() => {
        // Ottieni l'ID studente dal token
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                if (payload.ruolo === 'S') {
                    setIdStudente(payload.id);
                    console.log('ID Studente dal token:', payload.id);
                }
            } catch (error) {
                console.error('Errore decodifica token:', error);
            }
        }
    }, []);

    useEffect(() => {
        if (idStudente) {
            fetchEsercizi();
        }
    }, [idStudente]);

    const fetchEsercizi = async () => {
        try {
            setLoading(true); // ✅ CORRETTO
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
                setError(null); // ✅ CORRETTO
                console.log(`📚 Caricati ${data.esercizi.length} esercizi`);
            } else {
                setError(data.error); // ✅ CORRETTO
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
            
            setError(errorMessage); // ✅ CORRETTO
        } finally {
            setLoading(false); // ✅ CORRETTO
        }
    };

    const handleStartEsercizio = (esercizio) => {
        if (esercizio.completato) {
            alert('Questo esercizio è già stato completato!');
            return;
        }
        
        console.log('Avvio esercizio:', esercizio);
        onStartEsercizio(esercizio);
    };

    if (loading) {
        return (
            <div className={styles.container}>
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
            <h1 className={styles.title}>🎯 I Tuoi Esercizi di Pronuncia</h1>
            
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
};

export default HomeEsercizi;
