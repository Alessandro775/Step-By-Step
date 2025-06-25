// servizi/api/utilitaApiDati.js
export const utilitaApiDati = {
  preparaDatiGraficoPunteggio: (cronologia) => {
    console.log("🔧 Input cronologia:", cronologia);
    
    if (!Array.isArray(cronologia) || cronologia.length === 0) {
      console.log("❌ Cronologia vuota");
      return [];
    }

    const sortedData = cronologia
      .filter((record) => {
        const hasDate = record.data_completamento;
        const hasScore = record.punteggio !== null && record.punteggio !== undefined && record.punteggio !== "";
        console.log("🔍 Record:", record.titolo, "Punteggio:", record.punteggio, "Tipo:", typeof record.punteggio);
        return hasDate && hasScore;
      })
      .sort((a, b) => new Date(a.data_completamento) - new Date(b.data_completamento));

    console.log("📊 Dati filtrati:", sortedData.length, "record");

    if (sortedData.length === 0) {
      console.log("❌ Nessun dato valido dopo il filtro");
      return [];
    }

    let cumulativeSum = 0;
    let cumulativeCount = 0;

    const result = sortedData.map((record, index) => {
      const punteggio = parseFloat(String(record.punteggio).replace(',', '.')) || 0;
      cumulativeSum += punteggio;
      cumulativeCount++;
      
      const dataPoint = {
        esercizio: `Es. ${index + 1}`,
        punteggioSingolo: Number(punteggio),
        punteggioMedioCumulativo: Number((cumulativeSum / cumulativeCount).toFixed(2)),
      };
      
      console.log("📈 Data point creato:", dataPoint);
      return dataPoint;
    });

    console.log("✅ Dati finali punteggio:", result);
    return result;
  },

  preparaDatiGraficoErroriTentativi: (cronologia) => {
    console.log("🔧 Input errori/tentativi:", cronologia);
    
    if (!Array.isArray(cronologia) || cronologia.length === 0) {
      console.log("❌ Cronologia vuota per errori");
      return [];
    }

    const result = cronologia
      .filter((record) => record.data_completamento)
      .sort((a, b) => new Date(a.data_completamento) - new Date(b.data_completamento))
      .map((record, index) => {
        const errori = parseInt(String(record.numero_errori || '0')) || 0;
        const tentativi = parseInt(String(record.tentativi || record.numero_tentativi || '0')) || 0;
        
        const dataPoint = {
          esercizio: `Es. ${index + 1}`,
          errori: Number(errori),
          tentativi: Number(tentativi),
        };
        
        console.log("📊 Data point errori:", dataPoint);
        return dataPoint;
      });

    console.log("✅ Dati finali errori/tentativi:", result);
    return result;
  },

  // ✅ MODIFICA QUI: Cambia toLocaleString con toLocaleDateString
  formattaData: (dataStringa) => {
    return dataStringa 
      ? new Date(dataStringa).toLocaleDateString("it-IT") // ✅ SOLO DATA, SENZA ORA
      : "N/D";
  }
};
