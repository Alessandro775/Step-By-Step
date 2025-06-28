import React, { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import ContainerNotifiche from '../Layout/ContainerNotifiche';
import MessaggioErrore from '../Layout/MessaggioErrore';
import { useFeedback } from '../../../hooks/useFeedback';
import styles from './GraficiCronologia.module.css';

const GraficiCronologia = ({ 
  datiGraficoPunteggio = [], 
  datiGraficoErroriTentativi = [], 
  titolo = "Andamento Generale" 
}) => {
  const [validazionePunteggio, setValidazionePunteggio] = useState({ isValid: false, message: '' });
  const [validazioneErrori, setValidazioneErrori] = useState({ isValid: false, message: '' });
  
  const { notifiche, errore, avviso, info } = useFeedback();

  // ✅ Funzione di validazione centralizzata
  const validateData = (data, dataType) => {
    if (!Array.isArray(data) || data.length === 0) {
      return { isValid: false, message: `Nessun dato disponibile per ${dataType}` };
    }
    
    const invalidItems = [];
    
    const isValid = data.every((item, index) => {
      const hasRequiredFields = item.esercizio;
      let hasValidNumbers = true;
      
      if (dataType === 'punteggio') {
        hasValidNumbers = typeof item.punteggioSingolo === 'number' && 
                         typeof item.punteggioMedioCumulativo === 'number' &&
                         !isNaN(item.punteggioSingolo) && 
                         !isNaN(item.punteggioMedioCumulativo);
        
        if (!hasValidNumbers || !hasRequiredFields) {
          invalidItems.push(`Esercizio ${index + 1}: dati punteggio non validi`);
        }
      } else {
        hasValidNumbers = typeof item.errori === 'number' && 
                         typeof item.tentativi === 'number' &&
                         !isNaN(item.errori) && 
                         !isNaN(item.tentativi);
        
        if (!hasValidNumbers || !hasRequiredFields) {
          invalidItems.push(`Esercizio ${index + 1}: dati errori/tentativi non validi`);
        }
      }
      
      return hasRequiredFields && hasValidNumbers;
    });
    
    return { 
      isValid, 
      invalidItems,
      message: isValid 
        ? `Dati ${dataType} validati con successo (${data.length} elementi)`
        : `Dati ${dataType} non validi: ${invalidItems.join(', ')}`
    };
  };

  useEffect(() => {
    const validPunteggio = validateData(datiGraficoPunteggio, 'punteggio');
    const validErrori = validateData(datiGraficoErroriTentativi, 'errori/tentativi');
    
    setValidazionePunteggio(validPunteggio);
    setValidazioneErrori(validErrori);

    let messaggiErrore = [];
  
    if (datiGraficoPunteggio.length > 0 && !validPunteggio.isValid) {
      messaggiErrore.push(`Grafico punteggio: ${validPunteggio.message}`);
    }

    if (datiGraficoErroriTentativi.length > 0 && !validErrori.isValid) {
      messaggiErrore.push(`Grafico errori/tentativi: ${validErrori.message}`);
    }
  
    if (messaggiErrore.length > 0) {
      errore(`❌ Problemi con i dati dei grafici: ${messaggiErrore.join(' | ')}`, {
        durata: 6000,
        azione: {
          testo: "📊 Dettagli",
          onClick: () => {
            info(`Debug info: ${JSON.stringify({
              punteggioItems: datiGraficoPunteggio.length,
              erroriItems: datiGraficoErroriTentativi.length,
              validazionePunteggio: validPunteggio.message,
              validazioneErrori: validErrori.message
            }, null, 2)}`, { durata: 10000 });
          }
        }
      });
    } else if (datiGraficoPunteggio.length === 0 && datiGraficoErroriTentativi.length === 0) {
      info("📋 Nessun dato disponibile per generare i grafici", {
        durata: 4000
      });
    }
  }, [datiGraficoPunteggio, datiGraficoErroriTentativi]);

  // ✅ Gestione errori di rendering usando componenti condivisi
  const handleChartError = (chartType, error) => {
    errore(`❌ Errore nel rendering del grafico ${chartType}: ${error.message}`, {
      durata: 5000,
      azione: {
        testo: "🔄 Ricarica",
        onClick: () => window.location.reload()
      }
    });
  };

  // ✅ Componente riutilizzabile per grafico
  const renderGrafico = (dati, validazione, tipo, config) => {
    if (dati.length === 0 || !validazione.isValid) return null;

    return (
      <div className={styles.contenitoreGrafico}>
        <h4>{config.titolo}</h4>
        <div className={styles.chartWrapper}>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart 
              data={dati}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              onError={(error) => handleChartError(tipo, error)}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="esercizio" />
              <YAxis domain={config.domain} />
              <Tooltip 
                labelFormatter={(value) => `Esercizio: ${value}`}
                formatter={config.tooltipFormatter}
              />
              <Legend />
              {config.lines.map((line, index) => (
                <Line 
                  key={index}
                  type="monotone" 
                  dataKey={line.dataKey}
                  stroke={line.stroke}
                  strokeWidth={line.strokeWidth}
                  dot={{ fill: line.stroke, strokeWidth: 2, r: line.dotSize }}
                  name={line.dataKey}
                  connectNulls={false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  const configPunteggio = {
    titolo: "📈 Andamento Punteggio (Media Cumulativa)",
    domain: [0, 100],
    tooltipFormatter: (value, name) => {
      if (name === 'punteggioSingolo') return [`${value}%`, 'Punteggio Singolo'];
      if (name === 'punteggioMedioCumulativo') return [`${value}%`, 'Media Cumulativa'];
      return [value, name];
    },
    lines: [
      { dataKey: 'punteggioSingolo', stroke: '#94a3b8', strokeWidth: 2, dotSize: 4 },
      { dataKey: 'punteggioMedioCumulativo', stroke: '#2563eb', strokeWidth: 4, dotSize: 6 }
    ]
  };

  const configErrori = {
    titolo: "🎯 Andamento Errori e Tentativi",
    domain: [0, 'dataMax + 2'],
    tooltipFormatter: (value, name) => {
      if (name === 'errori') return [value, 'Errori'];
      if (name === 'tentativi') return [value, 'Tentativi'];
      return [value, name];
    },
    lines: [
      { dataKey: 'errori', stroke: '#ef4444', strokeWidth: 3, dotSize: 6 },
      { dataKey: 'tentativi', stroke: '#f59e0b', strokeWidth: 3, dotSize: 6 }
    ]
  };

  return (
    <div className={styles.sezioneGrafici}>
      <ContainerNotifiche notifiche={notifiche} />
      
      <h3>{titolo}</h3>
      
      {renderGrafico(datiGraficoPunteggio, validazionePunteggio, 'punteggio', configPunteggio)}
      {renderGrafico(datiGraficoErroriTentativi, validazioneErrori, 'errori/tentativi', configErrori)}

      {/* ✅ Stati vuoti e informativi */}
      {datiGraficoPunteggio.length === 0 && datiGraficoErroriTentativi.length === 0 && (
        <div className={styles.nessunDato}>
          <div className={styles.emptyIcon}>📊</div>
          <p><strong>Nessun dato disponibile per i grafici</strong></p>
          <p>Completa alcuni esercizi per vedere i grafici dei progressi.</p>
          <button 
            className={styles.refreshButton}
            onClick={() => {
              info("🔄 Aggiornamento dati grafici...", { durata: 2000 });
              window.location.reload();
            }}
          >
            🔄 Aggiorna Dati
          </button>
        </div>
      )}

      {(datiGraficoPunteggio.length === 0 && datiGraficoErroriTentativi.length > 0) && (
        <div className={styles.infoMessage}>
          <p>ℹ️ Solo il grafico errori/tentativi è disponibile</p>
        </div>
      )}

      {(datiGraficoPunteggio.length > 0 && datiGraficoErroriTentativi.length === 0) && (
        <div className={styles.infoMessage}>
          <p>ℹ️ Solo il grafico punteggi è disponibile</p>
        </div>
      )}
    </div>
  );
};

export default GraficiCronologia;
