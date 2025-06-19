import React, { useState, useEffect } from 'react';
import styles from './ContenutoStudente.module.css';

const ContenutoStudente = () => {
    const [contenuti, setContenuti] = useState([]);
    const [studenteInfo, setStudenteInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [esercizi, setEsercizi] = useState([]);
    const [formData, setFormData] = useState({
        testo: '',
        immagine: '',
        idEsercizio: ''
    });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        // Get student info from sessionStorage
        const studenteData = sessionStorage.getItem('studenteSelezionato');
        if (studenteData) {
            const parsedData = JSON.parse(studenteData);
            setStudenteInfo(parsedData);
            fetchContenuti(parsedData.id);
        } else {
            setError('Informazioni studente non trovate');
            setLoading(false);
        }
        fetchEsercizi();
    }, []);

    const fetchContenuti = async (idStudente) => {
        try {
            setLoading(true);
            setError(null);
            
            const token = localStorage.getItem('token');
            
            console.log("=== FETCH CONTENUTI ===");
            console.log("ID Studente:", idStudente);
            
            const response = await fetch(`http://localhost:3000/api/studenti/${idStudente}/contenuti`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Errore nel caricamento dei contenuti');
            }

            const data = await response.json();
            console.log("Contenuti ricevuti:", data);
            setContenuti(data);
            
        } catch (err) {
            console.error("Errore fetch contenuti:", err);
            setError('Errore nel caricamento dei contenuti: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const fetchEsercizi = async () => {
        try {
            const token = localStorage.getItem('token');
            
            const response = await fetch('http://localhost:3000/api/esercizi', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
            });

            if (response.ok) {
                const data = await response.json();
                setEsercizi(data);
            }
        } catch (err) {
            console.error('Errore caricamento esercizi:', err);
        }
    };

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmitContenuto = async (e) => {
        e.preventDefault();
        
        if (!formData.testo || !formData.idEsercizio) {
            setError('Compila tutti i campi obbligatori');
            return;
        }

        setSubmitting(true);
        try {
            const token = localStorage.getItem('token');
            
            const response = await fetch(`http://localhost:3000/api/studenti/${studenteInfo.id}/contenuti`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Errore nell\'aggiunta del contenuto');
            }

            // Reset form e ricarica contenuti
            setFormData({
                testo: '',
                immagine: '',
                idEsercizio: ''
            });
            setShowForm(false);
            setError(null);
            await fetchContenuti(studenteInfo.id);
            
        } catch (err) {
            setError('Errore nell\'aggiunta del contenuto: ' + err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleEliminaContenuto = async (idEsercizioAssegnato, titolo) => {
        const conferma = window.confirm(`Sei sicuro di voler eliminare il contenuto "${titolo}"?`);
        
        if (!conferma) return;

        try {
            const token = localStorage.getItem('token');
            
            const response = await fetch(`http://localhost:3000/api/studenti/${studenteInfo.id}/contenuti/${idEsercizioAssegnato}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Errore nell\'eliminazione del contenuto');
            }

            await fetchContenuti(studenteInfo.id);
            
        } catch (err) {
            setError('Errore nell\'eliminazione del contenuto: ' + err.message);
        }
    };

    const handleTornaIndietro = () => {
        const event = new CustomEvent('backToStudenti');
        window.dispatchEvent(event);
    };

    if (loading) {
        return (
            <div className={styles.container}>
                <div className={styles.loading}>
                    <div className={styles.spinner}></div>
                    <span>Caricamento contenuti...</span>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <button onClick={handleTornaIndietro} className={styles.backButton}>
                    ← Torna ai Studenti
                </button>
                
                <div className={styles.headerContent}>
                    <h2>Contenuti/Esercizi Assegnati</h2>
                    <button 
                        onClick={() => setShowForm(!showForm)}
                        className={styles.addButton}
                    >
                        {showForm ? 'Annulla' : '+ Aggiungi Contenuto'}
                    </button>
                </div>
                
                {studenteInfo && (
                    <p>Studente: <strong>{studenteInfo.nome}</strong></p>
                )}
            </div>

            {error && (
                <div className={styles.error}>
                    {error}
                </div>
            )}

            {/* Form per aggiungere contenuto */}
            {showForm && (
                <div className={styles.formContainer}>
                    <h3>Aggiungi Nuovo Contenuto/Esercizio</h3>
                    <form onSubmit={handleSubmitContenuto} className={styles.form}>
                        <div className={styles.formGroup}>
                            <label htmlFor="testo">Testo/Contenuto *</label>
                            <input
                                type="text"
                                id="testo"
                                name="testo"
                                value={formData.testo}
                                onChange={handleFormChange}
                                required
                                placeholder="Inserisci il testo o il contenuto"
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label htmlFor="idEsercizio">Tipo di Esercizio *</label>
                            <select
                                id="idEsercizio"
                                name="idEsercizio"
                                value={formData.idEsercizio}
                                onChange={handleFormChange}
                                required
                            >
                                <option value="">Seleziona esercizio</option>
                                {esercizi.map(esercizio => (
                                    <option key={esercizio.idEsercizio} value={esercizio.idEsercizio}>
                                        {esercizio.tipologia} - {esercizio.descrizione}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className={styles.formGroup}>
                            <label htmlFor="immagine">URL Immagine (opzionale)</label>
                            <input
                                type="url"
                                id="immagine"
                                name="immagine"
                                value={formData.immagine}
                                onChange={handleFormChange}
                                placeholder="https://esempio.com/immagine.jpg"
                            />
                        </div>

                        <div className={styles.formActions}>
                            <button 
                                type="button" 
                                onClick={() => setShowForm(false)}
                                className={styles.cancelButton}
                            >
                                Annulla
                            </button>
                            <button 
                                type="submit" 
                                disabled={submitting}
                                className={styles.submitButton}
                            >
                                {submitting ? 'Aggiungendo...' : 'Aggiungi Contenuto'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className={styles.contentSection}>
                {contenuti.length === 0 ? (
                    <div className={styles.emptyState}>
                        <p>Nessun contenuto assegnato a questo studente</p>
                        <p>Usa il pulsante "Aggiungi Contenuto" per iniziare!</p>
                    </div>
                ) : (
                    <div className={styles.tableContainer}>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>Testo/Contenuto</th>
                                    <th>Tipo Esercizio</th>
                                    <th>Immagine</th>
                                    <th>Data Assegnazione</th>
                                    <th>Completato</th>
                                    <th>Azioni</th>
                                </tr>
                            </thead>
                            <tbody>
                                {contenuti.map((contenuto) => (
                                    <tr key={contenuto.idEsercizioAssegnato}>
                                        <td>
                                            <strong>{contenuto.titolo}</strong>
                                        </td>
                                        <td>
                                            {contenuto.tipologia} - {contenuto.descrizione}
                                        </td>
                                        <td>
                                            {contenuto.immagine ? (
                                                <a href={contenuto.immagine} target="_blank" rel="noopener noreferrer">
                                                    🖼️ Visualizza
                                                </a>
                                            ) : (
                                                'Nessuna immagine'
                                            )}
                                        </td>
                                        <td>
                                            {contenuto.data_inizio 
                                                ? new Date(contenuto.data_inizio).toLocaleDateString('it-IT')
                                                : 'N/D'
                                            }
                                        </td>
                                        <td>
                                            <span className={contenuto.completato ? styles.completed : styles.pending}>
                                                {contenuto.completato ? '✅ Sì' : '❌ No'}
                                            </span>
                                        </td>
                                        <td>
                                            <button
                                                onClick={() => handleEliminaContenuto(contenuto.idEsercizioAssegnato, contenuto.titolo)}
                                                className={styles.deleteButton}
                                                title="Elimina contenuto"
                                            >
                                                🗑️ Elimina
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ContenutoStudente;
