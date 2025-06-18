import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styles from './ContenutoStudente.module.css';

const ContenutoStudente = () => {
    const { idStudente } = useParams();
    const navigate = useNavigate();
    const [contenuti, setContenuti] = useState([]);
    const [studenteInfo, setStudenteInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [esercizi, setEsercizi] = useState([]);
    const [formData, setFormData] = useState({
        testo: '',
        immagine: '',
        tipologia: '',
        idEsercizio: ''
    });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchContenuti();
        fetchEsercizi();
    }, [idStudente]);

    const fetchContenuti = async () => {
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

            console.log("Response status:", response.status);

            if (!response.ok) {
                const errorData = await response.json();
                console.error("Errore response:", errorData);
                throw new Error(errorData.error || 'Errore nel caricamento dei contenuti');
            }

            const data = await response.json();
            console.log("Contenuti ricevuti:", data);
            setContenuti(data);
            
            // Ottieni info studente dal sessionStorage se disponibile
            const studenteData = sessionStorage.getItem('studenteSelezionato');
            if (studenteData) {
                setStudenteInfo(JSON.parse(studenteData));
            }
            
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
        
        if (!formData.testo || !formData.tipologia || !formData.idEsercizio) {
            setError('Compila tutti i campi obbligatori');
            return;
        }

        setSubmitting(true);
        try {
            const token = localStorage.getItem('token');
            
            const response = await fetch(`http://localhost:3000/api/studenti/${idStudente}/contenuti`, {
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
                tipologia: '',
                idEsercizio: ''
            });
            setShowForm(false);
            setError(null);
            await fetchContenuti();
            
        } catch (err) {
            setError('Errore nell\'aggiunta del contenuto: ' + err.message);
        } finally {
            setSubmitting(false);
        }
    };

    // NUOVA FUNZIONE: Eliminazione contenuto
    const handleEliminaContenuto = async (idContenuto, titolo) => {
        const conferma = window.confirm(`Sei sicuro di voler eliminare il contenuto "${titolo}"?`);
        
        if (!conferma) return;

        try {
            const token = localStorage.getItem('token');
            
            console.log("=== ELIMINAZIONE CONTENUTO ===");
            console.log("ID Contenuto:", idContenuto);
            
            const response = await fetch(`http://localhost:3000/api/studenti/${idStudente}/contenuti/${idContenuto}`, {
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

            // Ricarica la lista contenuti
            await fetchContenuti();
            
        } catch (err) {
            setError('Errore nell\'eliminazione del contenuto: ' + err.message);
        }
    };

    const handleTornaIndietro = () => {
        navigate('/studenti');
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
                    <h2>Parole/Contenuti Assegnati</h2>
                    <button 
                        onClick={() => setShowForm(!showForm)}
                        className={styles.addButton}
                    >
                        {showForm ? 'Annulla' : '+ Aggiungi Parola/Contenuto'}
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
                    <h3>Aggiungi Nuova Parola/Contenuto</h3>
                    <form onSubmit={handleSubmitContenuto} className={styles.form}>
                        <div className={styles.formGroup}>
                            <label htmlFor="testo">Parola/Testo *</label>
                            <input
                                type="text"
                                id="testo"
                                name="testo"
                                value={formData.testo}
                                onChange={handleFormChange}
                                required
                                placeholder="Inserisci la parola o il testo"
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label htmlFor="tipologia">Tipologia *</label>
                            <select
                                id="tipologia"
                                name="tipologia"
                                value={formData.tipologia}
                                onChange={handleFormChange}
                                required
                            >
                                <option value="">Seleziona tipologia</option>
                                <option value="lettura">Lettura</option>
                                <option value="scrittura">Scrittura</option>
                                <option value="sillabe">Sillabe</option>
                                <option value="pronuncia">Pronuncia</option>
                                <option value="comprensione">Comprensione</option>
                            </select>
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
                        <p>Nessuna parola/contenuto assegnato a questo studente</p>
                        <p>Usa il pulsante "Aggiungi Parola/Contenuto" per iniziare!</p>
                    </div>
                ) : (
                    <div className={styles.tableContainer}>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>Parola/Titolo</th>
                                    <th>Tipologia</th>
                                    <th>Data Assegnazione</th>
                                    <th>Completato</th>
                                    <th>Azioni</th>
                                </tr>
                            </thead>
                            <tbody>
                                {contenuti.map((contenuto) => (
                                    <tr key={contenuto.idContenuto}>
                                        <td>
                                            <div className={styles.contenutoInfo}>
                                                <strong>{contenuto.titolo}</strong>
                                                {contenuto.immagine && (
                                                    <small>🖼️ Con immagine</small>
                                                )}
                                            </div>
                                        </td>
                                        <td>{contenuto.descrizione}</td>
                                        <td>
                                            {contenuto.data_inizio 
                                                ? new Date(contenuto.data_inizio).toLocaleDateString('it-IT')
                                                : 'N/D'
                                            }
                                        </td>
                                        <td>
                                            <span className={contenuto.completato ? styles.completed : styles.pending}>
                                                {contenuto.completato ? 'Sì' : 'No'}
                                            </span>
                                        </td>
                                        <td>
                                            <button
                                                onClick={() => handleEliminaContenuto(contenuto.idContenuto, contenuto.titolo)}
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
