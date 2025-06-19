import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import styles from './CronologiaStudente.module.css';

const CronologiaStudente = () => {
    const [cronologia, setCronologia] = useState([]);
    const [studenteInfo, setStudenteInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [chartData, setChartData] = useState([]);
    const [errorsAttemptsData, setErrorsAttemptsData] = useState([]);
    const [showCharts, setShowCharts] = useState(false); // Stato per mostrare i grafici

    useEffect(() => {
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


    // Funzione per preparare i dati per il grafico del punteggio crescente
    const prepareChartData = (cronologia) => {
        const sortedData = cronologia
            .filter(record => record.data_completamento && record.punteggio !== null)
            .sort((a, b) => new Date(a.data_completamento) - new Date(b.data_completamento));

        let cumulativeSum = 0;
        let cumulativeCount = 0;

        return sortedData.map((record, index) => {
            cumulativeSum += parseFloat(record.punteggio) || 0;
            cumulativeCount++;
            
            return {
                esercizio: `Es. ${index + 1}`,
                data: new Date(record.data_completamento).toLocaleDateString('it-IT'),
                punteggioSingolo: record.punteggio || 0,
                punteggioMedioCumulativo: Math.round((cumulativeSum / cumulativeCount) * 100) / 100,
                dataCompleta: record.data_completamento
            };
        });
    };

    // Funzione per preparare i dati per il grafico errori e tentativi
    const prepareErrorsAttemptsData = (cronologia) => {
        return cronologia
            .filter(record => record.data_completamento)
            .sort((a, b) => new Date(a.data_completamento) - new Date(b.data_completamento))
            .map((record, index) => ({
                esercizio: `Es. ${index + 1}`,
                data: new Date(record.data_completamento).toLocaleDateString('it-IT'),
                errori: parseInt(record.numero_errori) || 0,
                tentativi: parseInt(record.tentativi || record.numero_tentativi) || 0,
                dataCompleta: record.data_completamento
            }));
    };

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
            
            setCronologia(data);
            
            // Prepara i dati per i grafici
            const chartDataPreparata = prepareChartData(data);
            const errorsAttemptsDataPreparata = prepareErrorsAttemptsData(data);
            
            setChartData(chartDataPreparata);
            setErrorsAttemptsData(errorsAttemptsDataPreparata);
            
        } catch (err) {
            console.error("Errore catch:", err);
            setError('Errore nel caricamento della cronologia: ' + err.message);
        } finally {
            setLoading(false);
        }
    };
    const handleTornaIndietro = () => {
        if (showCharts) {
            // Se siamo nella vista grafici, torna alla cronologia
            setShowCharts(false);
        } else {
            // Se siamo nella cronologia, torna ai studenti
            const event = new CustomEvent('backToStudenti');
            window.dispatchEvent(event);
        }
    };

    const handleToggleCharts = () => {
        setShowCharts(!showCharts);
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
            {/* VISTA GRAFICI - Full Screen */}
            {showCharts && (
                <div className={styles.chartsFullScreen}>
                    <div className={styles.chartsHeader}>
                        <div className={styles.headerLeft}>
                            <button onClick={handleTornaIndietro} className={styles.backButton}>
                                ← Torna alla Cronologia
                            </button>
                        </div>
                        
                        <div className={styles.headerCenter}>
                            <h1>Grafici Andamento</h1>
                            {studenteInfo && (
                                <p>Studente: <strong>{studenteInfo.nome}</strong></p>
                            )}
                        </div>
                        
                        <div className={styles.headerRight}>
                            {/* Spazio per simmetria */}
                        </div>
                    </div>

                    <div className={styles.chartsContent}>
                        {/* Grafico Punteggio Crescente */}
                        {chartData.length > 0 && (
                            <div className={styles.chartContainer}>
                                <h3>Andamento Punteggio (Media Cumulativa)</h3>
                                <ResponsiveContainer width="100%" height={400}>
                                    <LineChart data={chartData}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="esercizio" />
                                        <YAxis />
                                        <Tooltip 
                                            labelFormatter={(value) => `Esercizio: ${value}`}
                                            formatter={(value, name) => {
                                                if (name === 'punteggioSingolo') return [value, 'Punteggio Singolo'];
                                                if (name === 'punteggioMedioCumulativo') return [value, 'Media Cumulativa'];
                                                return [value, name];
                                            }}
                                        />
                                        <Legend />
                                        <Line 
                                            type="monotone" 
                                            dataKey="punteggioSingolo" 
                                            stroke="#94a3b8" 
                                            strokeWidth={2}
                                            dot={{ fill: '#94a3b8', strokeWidth: 2, r: 4 }}
                                            name="Punteggio Singolo"
                                        />
                                        <Line 
                                            type="monotone" 
                                            dataKey="punteggioMedioCumulativo" 
                                            stroke="#2563eb" 
                                            strokeWidth={4}
                                            dot={{ fill: '#2563eb', strokeWidth: 2, r: 6 }}
                                            name="Media Cumulativa"
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        )}

                        {/* Grafico Errori e Tentativi */}
                        {errorsAttemptsData.length > 0 && (
                            <div className={styles.chartContainer}>
                                <h3>Andamento Errori e Tentativi</h3>
                                <ResponsiveContainer width="100%" height={400}>
                                    <LineChart data={errorsAttemptsData}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="esercizio" />
                                        <YAxis />
                                        <Tooltip 
                                            labelFormatter={(value) => `Esercizio: ${value}`}
                                            formatter={(value, name) => {
                                                if (name === 'errori') return [value, 'Errori'];
                                                if (name === 'tentativi') return [value, 'Tentativi'];
                                                return [value, name];
                                            }}
                                        />
                                        <Legend />
                                        <Line 
                                            type="monotone" 
                                            dataKey="errori" 
                                            stroke="#ef4444" 
                                            strokeWidth={3}
                                            dot={{ fill: '#ef4444', strokeWidth: 2, r: 6 }}
                                            name="Errori"
                                        />
                                        <Line 
                                            type="monotone" 
                                            dataKey="tentativi" 
                                            stroke="#f59e0b" 
                                            strokeWidth={3}
                                            dot={{ fill: '#f59e0b', strokeWidth: 2, r: 6 }}
                                            name="Tentativi"
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* VISTA CRONOLOGIA - Solo quando i grafici non sono mostrati */}
            {!showCharts && (
                <>
                    <div className={styles.header}>
                        <div className={styles.headerLeft}>
                            <button onClick={handleTornaIndietro} className={styles.backButton}>
                                ← Torna ai Studenti
                            </button>
                        </div>
                        
                        <div className={styles.headerCenter}>
                            <h2>Cronologia Attività</h2>
                            {studenteInfo && (
                                <p>Studente: <strong>{studenteInfo.nome}</strong></p>
                            )}
                        </div>

                        <div className={styles.headerRight}>
                            {(chartData.length > 0 || errorsAttemptsData.length > 0) && (
                                <button 
                                    onClick={handleToggleCharts}
                                    className={styles.chartsButton}
                                >
                                    📊 Visualizza Grafici
                                </button>
                            )}
                        </div>
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
                                                <td>{record.tentativi || record.numero_tentativi || 'N/D'}</td>
                                                <td>{record.numero_errori || 'N/D'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

export default CronologiaStudente;