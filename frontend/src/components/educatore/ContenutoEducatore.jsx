import React, { useState, useEffect } from 'react';
import styles from './ContenutoEducatore.module.css';

const ContenutoEducatore = () => {
    const [parole, setParole] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const aggiungiParola = async () => {
        if (!nuovaParola.trim()) return;
        
        try {
            const response = await fetch('http://localhost:3000/api/parole', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ testo: nuovaParola })
            });

            if (!response.ok) {
                throw new Error('Errore nell\'aggiunta della parola');
            }

            const nuovaParolaInserita = await response.json();
            setParole([...parole, nuovaParolaInserita]);
            setNuovaParola('');
        } catch (err) {
            console.error('Errore:', err);
            setError('Errore nell\'aggiunta della parola');
        }
    };

    const eliminaParola = async (id) => {
        try {
            const response = await fetch(`http://localhost:3000/api/parole/${id}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                throw new Error('Errore nella eliminazione della parola');
            }

            setParole(parole.filter(parola => parola.idContenuto !== id));
        } catch (err) {
            console.error('Errore:', err);
            setError('Errore nella eliminazione della parola');
        }
    };

    useEffect(() => {
        const fetchParole = async () => {
            try {
                setLoading(true);
                const response = await fetch('http://localhost:3000/api/parole');
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();
                console.log('Dati ricevuti:', data); // Debug
                setParole(data);
                setError(null);
            } catch (err) {
                console.error('Errore dettagliato:', err);
                setError('Errore nel caricamento delle parole');
            } finally {
                setLoading(false);
            }
        };

        fetchParole();
    }, []);

    return (
        <div className={styles.container}>
            <h2>Contenuto Esercizi</h2>
            {loading && <div>Caricamento...</div>}
            {error && <div className={styles.error}>{error}</div>}
            {!loading && !error && (
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>Parola</th>
                        </tr>
                    </thead>
                    <tbody>
                        {parole.map((testo) => (
                            <tr key={testo.idContenuto}>
                                <td>{testo.testo}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
};

export default ContenutoEducatore;