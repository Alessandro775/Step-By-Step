import React, { useState, useEffect } from 'react';
import styles from './StudentiEducatore.module.css';

const StudentiEducatore = () => {
    const [studenti, setStudenti] = useState([]);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStudenti = async () => {
            try {
                setLoading(true);
                const response = await fetch('http://localhost:3000/api/studenti', {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    },
                });
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const data = await response.json();
                if (!Array.isArray(data)) {
                    throw new Error('Formato dati non valido');
                }
                setStudenti(data);
                setError(null);
            } catch (err) {
                console.error('Errore fetch:', err);
                setError('Errore nel caricamento degli studenti');
            } finally {
                setLoading(false);
            }
        };

        fetchStudenti();
    }, []);

    if (loading) return <div className={styles.loading}>Caricamento studenti...</div>;
    if (error) return <div className={styles.error}>{error}</div>;
    if (studenti.length === 0) return <div>Nessuno studente trovato</div>;

    return (
        <div className={styles.container}>
            <h2>Lista Studenti</h2>
            <table className={styles.table}>
                <thead>
                    <tr>
                        <th>Nome</th>
                        <th>Cognome</th>
                        <th>Email</th>
    
                    </tr>
                </thead>
                <tbody>
                    {studenti.map((studente) => (
                        <tr key={studente.id}>
                            <td>{studente.nome}</td>
                            <td>{studente.cognome}</td>
                            <td>{studente.email}</td>
    
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default StudentiEducatore;