import React, { useState, useEffect } from 'react';
import styles from './StudentiEducatore.module.css';

const StudentiEducatore = () => {
    const [studenti, setStudenti] = useState([]);
    const [emailNuovoStudente, setEmailNuovoStudente] = useState('');
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [loading, setLoading] = useState(true);
    const [adding, setAdding] = useState(false);

    useEffect(() => {
        // Debug iniziale del token
        const token = localStorage.getItem('token');
        console.log('=== DEBUG TOKEN ===');
        console.log('Token presente:', !!token);
        
        if (token) {
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                console.log('Payload token:', payload);
                console.log('ID utente:', payload.id);
                console.log('Ruolo utente:', payload.ruolo);
                
                if (payload.ruolo !== 'E') {
                    setError('Accesso negato: solo gli educatori possono gestire gli studenti');
                    setLoading(false);
                    return;
                }
            } catch (e) {
                console.error('Errore decodifica token:', e);
                setError('Token non valido. Effettua nuovamente il login.');
                setLoading(false);
                return;
            }
        } else {
            setError('Token non presente. Effettua il login.');
            setLoading(false);
            return;
        }
        
        fetchStudenti();
    }, []);

    const fetchStudenti = async () => {
        try {
            setLoading(true);
            setError(null);
            
            const token = localStorage.getItem('token');
            
            if (!token) {
                setError('Token non presente. Effettua il login.');
                return;
            }

            console.log('=== FETCH STUDENTI ===');
            console.log('Chiamata API in corso...');
            
            const response = await fetch('http://localhost:3000/api/studenti', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
            });

            console.log('Status response:', response.status);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Errore response:', response.status, errorText);
                
                if (response.status === 401) {
                    setError('Sessione scaduta. Effettua nuovamente il login.');
                } else if (response.status === 403) {
                    setError('Accesso negato. Solo gli educatori possono vedere gli studenti.');
                } else {
                    setError(`Errore del server: ${response.status}`);
                }
                return;
            }

            const data = await response.json();
            console.log('Dati ricevuti dal server:', data);
            console.log('Tipo di dati:', typeof data);
            console.log('È un array?', Array.isArray(data));
            console.log('Numero di studenti:', data.length);
            
            if (!Array.isArray(data)) {
                throw new Error('Formato dati non valido: atteso array');
            }

            // Verifica struttura dati
            if (data.length > 0) {
                console.log('Struttura primo studente:', Object.keys(data[0]));
                console.log('Primo studente completo:', data[0]);
            }

            setStudenti(data);
            setError(null);
            console.log('Studenti caricati correttamente');

        } catch (err) {
            console.error('Errore fetch studenti:', err);
            setError('Errore nel caricamento degli studenti: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleAggiungiStudente = async (e) => {
        e.preventDefault();
        
        if (!emailNuovoStudente.trim()) {
            setError('Inserisci un\'email valida');
            return;
        }

        try {
            setAdding(true);
            setError(null);
            setSuccess(null);
            
            const token = localStorage.getItem('token');
            console.log('=== AGGIUNTA STUDENTE ===');
            console.log('Email da aggiungere:', emailNuovoStudente);
            
            const response = await fetch('http://localhost:3000/api/studenti', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ email: emailNuovoStudente.trim() })
            });

            console.log('Status aggiunta:', response.status);

            if (!response.ok) {
                const errorData = await response.json();
                console.error('Errore aggiunta:', errorData);
                throw new Error(errorData.error || 'Errore nell\'aggiunta dello studente');
            }

            const result = await response.json();
            console.log('Risultato aggiunta:', result);

            setEmailNuovoStudente('');
            setSuccess('Studente aggiunto con successo!');
            
            // Ricarica la lista
            await fetchStudenti();
            
            // Rimuovi messaggio di successo dopo 3 secondi
            setTimeout(() => setSuccess(null), 3000);
            
        } catch (err) {
            console.error('Errore aggiunta studente:', err);
            setError('Errore nell\'aggiunta dello studente: ' + err.message);
        } finally {
            setAdding(false);
        }
    };

    const handleEliminaStudente = async (idStudente, nomeStudente) => {
        const conferma = window.confirm(
            `Sei sicuro di voler rimuovere ${nomeStudente} dalla tua lista studenti?`
        );
        
        if (!conferma) return;

        try {
            setError(null);
            setSuccess(null);
            
            const token = localStorage.getItem('token');
            console.log('=== ELIMINAZIONE STUDENTE ===');
            console.log('ID studente da eliminare:', idStudente);
            
            const response = await fetch(`http://localhost:3000/api/studenti/${idStudente}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
            });

            console.log('Status eliminazione:', response.status);

            if (!response.ok) {
                const errorData = await response.json();
                console.error('Errore eliminazione:', errorData);
                throw new Error(errorData.error || 'Errore nella rimozione dello studente');
            }

            const result = await response.json();
            console.log('Risultato eliminazione:', result);

            setSuccess('Studente rimosso con successo!');
            
            // Ricarica la lista
            await fetchStudenti();
            
            // Rimuovi messaggio di successo dopo 3 secondi
            setTimeout(() => setSuccess(null), 3000);
            
        } catch (err) {
            console.error('Errore eliminazione studente:', err);
            setError('Errore nella rimozione dello studente: ' + err.message);
        }
    };

    const clearMessages = () => {
        setError(null);
        setSuccess(null);
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h2>Gestione Studenti</h2>
                <p>Qui puoi gestire gli studenti assegnati al tuo account educatore</p>
            </div>

            {/* Form aggiunta studente */}
            <div className={styles.formSection}>
                <h3>Aggiungi Nuovo Studente</h3>
                <form onSubmit={handleAggiungiStudente} className={styles.form}>
                    <div className={styles.inputGroup}>
                        <input
                            type="email"
                            placeholder="Email dello studente"
                            value={emailNuovoStudente}
                            onChange={(e) => setEmailNuovoStudente(e.target.value)}
                            required
                            disabled={adding}
                            className={styles.emailInput}
                        />
                        <button 
                            type="submit" 
                            disabled={adding}
                            className={styles.addButton}
                        >
                            {adding ? 'Aggiungendo...' : 'Aggiungi Studente'}
                        </button>
                    </div>
                </form>
            </div>

            {/* Messaggi di stato */}
            {(error || success) && (
                <div className={styles.messagesSection}>
                    {error && (
                        <div className={styles.error}>
                            <span>{error}</span>
                            <button onClick={clearMessages} className={styles.closeButton}>×</button>
                        </div>
                    )}
                    {success && (
                        <div className={styles.success}>
                            <span>{success}</span>
                            <button onClick={clearMessages} className={styles.closeButton}>×</button>
                        </div>
                    )}
                </div>
            )}

            {/* Loading */}
            {loading && (
                <div className={styles.loading}>
                    <div className={styles.spinner}></div>
                    <span>Caricamento studenti...</span>
                </div>
            )}

            {/* Lista studenti */}
            {!loading && (
                <div className={styles.studentsSection}>
                    <h3>I Tuoi Studenti ({studenti.length})</h3>
                    
                    {studenti.length === 0 ? (
                        <div className={styles.emptyState}>
                            <p>Nessuno studente associato al momento</p>
                            <p>Aggiungi studenti utilizzando il form sopra</p>
                        </div>
                    ) : (
                        <div className={styles.tableContainer}>
                            <table className={styles.table}>
                                <thead>
                                    <tr>
                                        <th>Nome</th>
                                        <th>Cognome</th>
                                        <th>Email</th>
                                        <th>Data Assegnazione</th>
                                        <th>Azioni</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {studenti.map((studente) => (
                                        <tr key={studente.idStudente}>
                                            <td>{studente.nome || 'N/D'}</td>
                                            <td>{studente.cognome || 'N/D'}</td>
                                            <td>{studente.email}</td>
                                            <td>
                                                {studente.data_assegnazione 
                                                    ? new Date(studente.data_assegnazione).toLocaleDateString('it-IT')
                                                    : 'N/D'
                                                }
                                            </td>
                                            <td>
                                                <button
                                                    className={styles.deleteButton}
                                                    onClick={() => handleEliminaStudente(
                                                        studente.idStudente, 
                                                        `${studente.nome} ${studente.cognome}`
                                                    )}
                                                    title="Rimuovi studente"
                                                >
                                                    Rimuovi
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* Debug info (rimuovi in produzione) */}
            {process.env.NODE_ENV === 'development' && (
                <div className={styles.debugInfo}>
                    <details>
                        <summary>Debug Info</summary>
                        <pre>{JSON.stringify({ 
                            studentiCount: studenti.length, 
                            loading, 
                            adding, 
                            hasError: !!error,
                            hasSuccess: !!success
                        }, null, 2)}</pre>
                    </details>
                </div>
            )}
        </div>
    );
};

export default StudentiEducatore;
