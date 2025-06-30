export const utilitaApiDati = {
  //preparazione dati grafico punteggi
  preparaDatiGraficoPunteggio: (cronologia) => {    
    if (!Array.isArray(cronologia) || cronologia.length === 0) {
      return [];
    }
//filtra i record validi e li ordina cronologicamnte
    const sortedData = cronologia
      .filter((record) => {
        const hasDate = record.data_completamento;
        const hasScore = record.punteggio !== null && record.punteggio !== undefined;
        return hasDate && hasScore;
      })
      .sort((a, b) => new Date(a.data_completamento) - new Date(b.data_completamento));
//Variabili per calcolare la media cumulativa dei punteggi
    let cumulativeSum = 0; // Somma cumulativa dei punteggi
    let cumulativeCount = 0;  // Contatore degli esercizi processati

    const result = sortedData.map((record, index) => {
      // CONVERTO ESPLICITAMENTE A NUMERO
      const punteggio = parseFloat(record.punteggio) || 0;
      cumulativeSum += punteggio;
      cumulativeCount++;
       // Oggetto dati per il grafico
      const dataPoint = {
        esercizio: `Es. ${index + 1}`,
        punteggioSingolo: punteggio, // NUMERO, NON STRINGA
        punteggioMedioCumulativo: Math.round((cumulativeSum / cumulativeCount) * 100) / 100, // Media arrotondata
      };
      return dataPoint;
    });
    return result;
  },
//Prepara i dati della cronologia per il grafico errori e tentativi
  preparaDatiGraficoErroriTentativi: (cronologia) => {
    //validazione input
    if (!Array.isArray(cronologia) || cronologia.length === 0) {
      return [];
    }

    const result = cronologia
      .filter((record) => record.data_completamento)  // Solo record completati
      .sort((a, b) => new Date(a.data_completamento) - new Date(b.data_completamento)) // Ordine cronologico
      .map((record, index) => {
        // Converto il numero per grafico
        const errori = parseInt(record.numero_errori) || 0;
         // Gestisce diversi nomi di campo per tentativi (flessibilità API)
        const tentativi = parseInt(record.tentativi || record.numero_tentativi) || 0;
        
        const dataPoint = {
          esercizio: `Es. ${index + 1}`,
          errori: errori, // numero non stringa
          tentativi: tentativi, // numero non stringa
        };
        return dataPoint;
      });
    return result;
  },

  formattaDataOra: (dataStringa) => {
    return dataStringa 
      ? new Date(dataStringa).toLocaleString("it-IT") // Formato italiano
      : "N/D";
  }
};
