// servizi/api/utilitaApiDati.js
export const utilitaApiDati = {
  preparaDatiGraficoPunteggio: (cronologia) => {
    console.log("🔧 Preparazione dati punteggio - Input:", cronologia);
    
    if (!Array.isArray(cronologia) || cronologia.length === 0) {
      console.log("❌ Cronologia vuota o non array");
      return [];
    }

    const sortedData = cronologia
      .filter((record) => {
        const hasDate = record.data_completamento;
        const hasScore = record.punteggio !== null && record.punteggio !== undefined;
        console.log("🔍 Record:", record.titolo, "Data:", hasDate, "Punteggio:", record.punteggio);
        return hasDate && hasScore;
      })
      .sort((a, b) => new Date(a.data_completamento) - new Date(b.data_completamento));

    console.log("📊 Dati filtrati e ordinati:", sortedData.length, "record");

    let cumulativeSum = 0;
    let cumulativeCount = 0;

    const result = sortedData.map((record, index) => {
      // CONVERTO ESPLICITAMENTE A NUMERO
      const punteggio = parseFloat(record.punteggio) || 0;
      cumulativeSum += punteggio;
      cumulativeCount++;
      
      const dataPoint = {
        esercizio: `Es. ${index + 1}`,
        punteggioSingolo: punteggio, // NUMERO, NON STRINGA
        punteggioMedioCumulativo: Math.round((cumulativeSum / cumulativeCount) * 100) / 100,
      };
      
      console.log("📈 Data point:", dataPoint);
      return dataPoint;
    });

    console.log("✅ Dati finali punteggio:", result);
    return result;
  },

  preparaDatiGraficoErroriTentativi: (cronologia) => {
    console.log("🔧 Preparazione dati errori/tentativi - Input:", cronologia);
    
    if (!Array.isArray(cronologia) || cronologia.length === 0) {
      console.log("❌ Cronologia vuota o non array");
      return [];
    }

    const result = cronologia
      .filter((record) => record.data_completamento)
      .sort((a, b) => new Date(a.data_completamento) - new Date(b.data_completamento))
      .map((record, index) => {
        // CONVERTO ESPLICITAMENTE A NUMERO
        const errori = parseInt(record.numero_errori) || 0;
        const tentativi = parseInt(record.tentativi || record.numero_tentativi) || 0;
        
        const dataPoint = {
          esercizio: `Es. ${index + 1}`,
          errori: errori, // NUMERO, NON STRINGA
          tentativi: tentativi, // NUMERO, NON STRINGA
        };
        
        console.log("📊 Data point errori:", dataPoint);
        return dataPoint;
      });

    console.log("✅ Dati finali errori/tentativi:", result);
    return result;
  },

  formattaDataOra: (dataStringa) => {
    return dataStringa 
      ? new Date(dataStringa).toLocaleString("it-IT")
      : "N/D";
  }
};
