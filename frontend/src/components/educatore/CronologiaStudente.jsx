import React, { useState, useEffect } from 'react';
import styles from './CronologiaStudente.module.css';

const CronologiaStudente = () => {
    const [cronologia, setCronologia] = useState([]);
    const [studenteInfo, setStudenteInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        // Get student info from sessionStorage
        const studenteData = sessionStorage.getItem('studenteSelezionato');
        if (studenteData) {
            const parsedData = JSON.parse(studenteData);
            setStudenteInfo(parsedData);
            fetchCronologia(parsedData.id);
        } else {
            setError('Informazioni studente non trovate');
            setLoading(false);
        }
    }, []);

    const fetchCronologia = async (idStudente) => {
        try {
            setLoading(true);
            setError(null);
            
            const token = localStorage.getItem('token');
            
            console.log("=== FETCH CRONOLOGIA FRONTEND ===");
            console.log("ID Studente:", idStudente);
            console.log("Token presente:", !!token);
            
            if (!token) {
                throw new Error('Token non presente');
            }
            
            const response = await fetch(`http://localhost:3000/api/studenti/${idStudente}/cronologia`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
            });
    
            console.log("Response status:", response.status);
            console.log("Response ok:", response.ok);
    
            if (!response.ok) {
                const errorData = await response.json();
                console.error("Errore response:", errorData);
                throw new Error(errorData.error || 'Errore nel caricamento della cronologia');
            }
    
            const data = await response.json();
            console.log("Dati ricevuti:", data);
            console.log("Tipo dati:", typeof data);
            console.log("È array:", Array.isArray(data));
            console.log("Lunghezza array:", data.length);
            
            if (data.length > 0) {
                console.log("Primo elemento:", data[0]);
                console.log("Chiavi primo elemento:", Object.keys(data[0]));
            }
            
            setCronologia(data);
            
        } catch (err) {
            console.error("Errore catch:", err);
            setError('Errore nel caricamento della cronologia: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleTornaIndietro = () => {
        // Dispatch evento personalizzato per comunicare con StudentiEducatore
        const event = new CustomEvent('backToStudenti');
        window.dispatchEvent(event);
    };

    if (loading) {
        return (
            <div className={styles.container}>
                <div className={styles.loading}>
                    <div className={styles.spinner}></div>
                    <span>Caricamento cronologia...</span>
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
                <h2>Cronologia Attività</h2>
                {studenteInfo && (
                    <p>Studente: <strong>{studenteInfo.nome}</strong></p>
                )}
            </div>

            {error && (
                <div className={styles.error}>
                    {error}
                </div>
            )}

            <div className={styles.contentSection}>
                {cronologia.length === 0 ? (
                    <div className={styles.emptyState}>
                        <p>Nessuna attività registrata per questo studente</p>
                        <p>Gli esercizi completati appariranno qui una volta che lo studente avrà iniziato a lavorare.</p>
                    </div>
                ) : (
                    <div className={styles.tableContainer}>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>Esercizio</th>
                                    <th>Tipo</th>
                                    <th>Punteggio</th>
                                    <th>Tempo Impiegato</th>
                                    <th>Data Completamento</th>
                                    <th>Tentativi</th>
                                    <th>Errori</th>
                                </tr>
                            </thead>
                            <tbody>
                                {cronologia.map((record, index) => (
                                    <tr key={record.idRisultato || index}>
                                        <td>{record.titolo || 'N/D'}</td>
                                        <td>{record.tipo_esercizio || record.descrizione || 'N/D'}</td>
                                        <td>{record.punteggio !== null ? record.punteggio : 'N/D'}</td>
                                        <td>{record.tempo_impiegato || record.tempo || 'N/D'}</td>
                                        <td>
                                            {record.data_completamento 
                                                ? new Date(record.data_completamento).toLocaleString('it-IT')
                                                : 'N/D'
                                            }
                                        </td>
                                        <td>{record.tentativi || record.numerotentativi || 'N/D'}</td>
                                        <td>{record.numero_errori || record.numeroerrorieri || 'N/D'}</td>
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

export default CronologiaStudente;