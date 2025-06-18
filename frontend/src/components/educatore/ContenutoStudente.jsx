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

    useEffect(() => {
        fetchContenuti();
    }, [idStudente]);

    const fetchContenuti = async () => {
        try {
            setLoading(true);
            setError(null);
            
            const token = localStorage.getItem('token');
            
            console.log("=== FETCH CONTENUTI FRONTEND ===");
            console.log("ID Studente:", idStudente);
            console.log("Token presente:", !!token);
            
            const response = await fetch(`http://localhost:3000/api/studenti/${idStudente}/contenuti`, {
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
                throw new Error(errorData.error || 'Errore nel caricamento dei contenuti');
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
            
            setContenuti(data);
            
            // Ottieni info studente dal sessionStorage se disponibile
            const studenteData = sessionStorage.getItem('studenteSelezionato');
            if (studenteData) {
                console.log("Info studente da session:", JSON.parse(studenteData));
                setStudenteInfo(JSON.parse(studenteData));
            }
            
        } catch (err) {
            console.error("Errore catch:", err);
            setError('Errore nel caricamento dei contenuti: ' + err.message);
        } finally {
            setLoading(false);
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
                <h2>Contenuti Assegnati</h2>
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
                {contenuti.length === 0 ? (
                    <div className={styles.emptyState}>
                        <p>Nessun contenuto assegnato a questo studente</p>
                    </div>
                ) : (
                    <div className={styles.tableContainer}>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>Titolo</th>
                                    <th>Descrizione</th>
                                    <th>Data Inizio</th>
                                    <th>Scadenza</th>
                                    <th>Completato</th>
                                </tr>
                            </thead>
                            // Nel render della tabella
<tbody>
  {contenuti.map((contenuto) => (
    <tr key={contenuto.idContenuto}>
      <td>{contenuto.titolo}</td>
      <td>{contenuto.descrizione}</td>
      <td>
        {contenuto.data_inizio 
          ? new Date(contenuto.data_inizio).toLocaleDateString('it-IT')
          : 'N/D'
        }
      </td>
      <td>
        {contenuto.data_scadenza 
          ? new Date(contenuto.data_scadenza).toLocaleDateString('it-IT')
          : 'N/D'
        }
      </td>
      <td>
        <span className={contenuto.completato ? styles.completed : styles.pending}>
          {contenuto.completato ? 'Sì' : 'No'}
        </span>
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