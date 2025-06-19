import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import styles from './Grafici.module.css';

const Grafici = ({ chartData, errorsAttemptsData }) => {
    return (
        <div className={styles.chartsSection}>
            <h3>Andamento dello Studente</h3>
            
            {/* Grafico Punteggio Crescente */}
            {chartData.length > 0 && (
                <div className={styles.chartContainer}>
                    <h4>Andamento Punteggio (Media Cumulativa)</h4>
                    <ResponsiveContainer width="100%" height={300}>
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

            {/* Grafico Errori e Tentativi con Due Linee */}
            {errorsAttemptsData.length > 0 && (
                <div className={styles.chartContainer}>
                    <h4>Andamento Errori e Tentativi</h4>
                    <ResponsiveContainer width="100%" height={300}>
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
    );
};

export default Grafici;
