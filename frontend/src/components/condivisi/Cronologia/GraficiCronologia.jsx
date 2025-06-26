import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import styles from './GraficiCronologia.module.css';

const GraficiCronologia = ({ datiGraficoPunteggio = [], datiGraficoErroriTentativi = [], titolo = "Andamento Generale" }) => {
  console.log("🎨 GraficiCronologia - Render completo:", {
    titolo,
    punteggioLength: datiGraficoPunteggio.length,
    erroriLength: datiGraficoErroriTentativi.length,
    punteggioData: datiGraficoPunteggio,
    erroriData: datiGraficoErroriTentativi
  });

  // ✅ VALIDAZIONE CRITICA DEI DATI
  const validateData = (data, dataType) => {
    console.log(`🔍 Validazione ${dataType}:`, data);
    if (!Array.isArray(data) || data.length === 0) {
      console.log(`❌ ${dataType}: array vuoto o non valido`);
      return false;
    }
    
    // Controlla che ogni elemento abbia i campi necessari e che siano numeri
    const isValid = data.every((item, index) => {
      const hasRequiredFields = item.esercizio;
      let hasValidNumbers = true;
      
      if (dataType === 'punteggio') {
        hasValidNumbers = typeof item.punteggioSingolo === 'number' && typeof item.punteggioMedioCumulativo === 'number';
        console.log(`📊 Item ${index}:`, item.esercizio, 'Singolo:', item.punteggioSingolo, 'Media:', item.punteggioMedioCumulativo);
      } else {
        hasValidNumbers = typeof item.errori === 'number' && typeof item.tentativi === 'number';
        console.log(`📊 Item ${index}:`, item.esercizio, 'Errori:', item.errori, 'Tentativi:', item.tentativi);
      }
      
      return hasRequiredFields && hasValidNumbers;
    });
    
    console.log(`✅ ${dataType} valido:`, isValid);
    return isValid;
  };

  const punteggioValid = validateData(datiGraficoPunteggio, 'punteggio');
  const erroriValid = validateData(datiGraficoErroriTentativi, 'errori');

  return (
    <div className={styles.sezioneGrafici}>
      <h3>{titolo}</h3>
      
      {datiGraficoPunteggio.length > 0 && punteggioValid && (
        <div className={styles.contenitoreGrafico}>
          <h4>Punteggio (Media Cumulativa)</h4>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart 
              data={datiGraficoPunteggio}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="esercizio" />
              <YAxis domain={[0, 100]} />
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
                connectNulls={false}
              />
              <Line 
                type="monotone" 
                dataKey="punteggioMedioCumulativo" 
                stroke="#2563eb" 
                strokeWidth={4}
                dot={{ fill: '#2563eb', strokeWidth: 2, r: 6 }}
                name="Media Cumulativa"
                connectNulls={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {datiGraficoErroriTentativi.length > 0 && erroriValid && (
        <div className={styles.contenitoreGrafico}>
          <h4>Errori e Tentativi</h4>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart 
              data={datiGraficoErroriTentativi}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="esercizio" />
              <YAxis domain={[0, 'dataMax + 2']} />
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
                connectNulls={false}
              />
              <Line 
                type="monotone" 
                dataKey="tentativi" 
                stroke="#f59e0b" 
                strokeWidth={3}
                dot={{ fill: '#f59e0b', strokeWidth: 2, r: 6 }}
                name="Tentativi"
                connectNulls={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {(!punteggioValid && datiGraficoPunteggio.length > 0) && (
        <div style={{ color: 'red', padding: '1rem', border: '1px solid red' }}>
          ❌ Dati punteggio non validi. Controlla la console per dettagli.
        </div>
      )}

      {(!erroriValid && datiGraficoErroriTentativi.length > 0) && (
        <div style={{ color: 'red', padding: '1rem', border: '1px solid red' }}>
          ❌ Dati errori/tentativi non validi. Controlla la console per dettagli.
        </div>
      )}

      {datiGraficoPunteggio.length === 0 && datiGraficoErroriTentativi.length === 0 && (
        <div className={styles.nessunDato}>
          <p>Nessun dato disponibile per i grafici.</p>
          <p style={{ fontSize: '0.8em', color: '#666' }}>
            Completa alcuni esercizi per vedere i grafici dei tuoi progressi.
          </p>
        </div>
      )}
    </div>
  );
};

export default GraficiCronologia;
