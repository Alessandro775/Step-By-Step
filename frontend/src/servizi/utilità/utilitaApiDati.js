//Contiene funzioni di utilità per l'elaborazione dei dati API
export const utilitaApiDati = {
  // Prepara i dati della cronologia per la visualizzazione nel grafico dei punteggi
  preparaDatiGraficoPunteggio: (cronologia) => {
    console.log("🔧 Input cronologia:", cronologia);

    //Verifica che la cronologia sia un array non vuoto prima di procedere
    if (!Array.isArray(cronologia) || cronologia.length === 0) {
      console.log("❌ Cronologia vuota");
      return [];
    }

      //Filtraggio e ordinamento dei dati validi
      //Mantiene solo i record che hanno sia data di completamento che punteggio valido
    const sortedData = cronologia
      .filter((record) => {
          // Verifica presenza della data di completamento
        const hasDate = record.data_completamento;
         // Verifica presenza di un punteggio valido (non null, undefined o stringa vuota)
        const hasScore = record.punteggio !== null && record.punteggio !== undefined && record.punteggio !== "";
        console.log("🔍 Record:", record.titolo, "Punteggio:", record.punteggio, "Tipo:", typeof record.punteggio);
        return hasDate && hasScore;
      })
       // Ordina i record per data di completamento (dal più vecchio al più recente
      .sort((a, b) => new Date(a.data_completamento) - new Date(b.data_completamento));

    console.log("📊 Dati filtrati:", sortedData.length, "record");

    if (sortedData.length === 0) {
      //Controllo di sicurezza dopo il filtraggio
      console.log("❌ Nessun dato valido dopo il filtro");
      return [];
    }
    //Variabili per il calcolo della media cumulativa
    let cumulativeSum = 0;
    let cumulativeCount = 0;

     //Trasformazione dei dati per il grafico
    const result = sortedData.map((record, index) => {
      //Converte il punteggio in numero, gestendo sia virgole che punti decimali
      const punteggio = parseFloat(String(record.punteggio).replace(',', '.')) || 0;
       // Aggiorna i totali cumulativi per il calcolo della media
      cumulativeSum += punteggio;
      cumulativeCount++;

      //Creazione del punto dati per il grafico
      const dataPoint = {
        esercizio: `Es. ${index + 1}`,// Etichetta progressiva per l'asse X
        punteggioSingolo: Number(punteggio),
        punteggioMedioCumulativo: Number((cumulativeSum / cumulativeCount).toFixed(2)), // Media fino a questo punto
      };
      
      console.log("📈 Data point creato:", dataPoint);
      return dataPoint;
    });

    console.log("✅ Dati finali punteggio:", result);
    return result;
  },
  /*
   * Prepara i dati della cronologia per la visualizzazione nel grafico errori/tentativi
   * Trasforma i record in un formato ottimizzato per grafici che mostrano
   * l'andamento degli errori e dei tentativi nel tempo*/
  preparaDatiGraficoErroriTentativi: (cronologia) => {
    console.log("🔧 Input errori/tentativi:", cronologia);
     //Validazione iniziale dei dati di input
    if (!Array.isArray(cronologia) || cronologia.length === 0) {
      console.error("❌ Cronologia vuota per errori");
      return [];
    }
    //Elaborazione e trasformazione dei dati
    const result = cronologia
     // Mantiene solo i record con data di completamento valida
      .filter((record) => record.data_completamento)
      // Ordina cronologicamente per una visualizzazione coerente
      .sort((a, b) => new Date(a.data_completamento) - new Date(b.data_completamento))
      .map((record, index) => {
        /**
         * Estrazione e normalizzazione dei dati numerici
         * Gestisce diversi nomi di campo possibili e converte in numeri interi
         * con valori di default per dati mancanti o non validi
         */
        const errori = parseInt(String(record.numero_errori || '0')) || 0;
        const tentativi = parseInt(String(record.tentativi || record.numero_tentativi || '0')) || 0;
         /**
         * Creazione del punto dati per il grafico errori/tentativi
         * Include etichetta dell'esercizio e i valori numerici per errori e tentativi
         */
        const dataPoint = {
          esercizio: `Es. ${index + 1}`, // Etichetta progressiva per l'asse X
          errori: Number(errori), // Numero di errori commessi
          tentativi: Number(tentativi), // Numero totale di tentativi effettuati
        };
        
        console.log("📊 Data point errori:", dataPoint);
        return dataPoint;
      });

    console.log("✅ Dati finali errori/tentativi:", result);
    return result;
  },

  /**
   * Formatta una stringa di data in formato italiano leggibile
   * Converte date ISO o altri formati in una rappresentazione localizzata
   * ottimizzata per l'interfaccia utente italiana*/
  formattaData: (dataStringa) => {
     /**
     * Formattazione condizionale della data
     * Se la stringa è valida, converte in formato italiano (solo data, senza ora)
     * Altrimenti restituisce "N/D" (Non Disponibile) come placeholder
     */
    return dataStringa 
      ? new Date(dataStringa).toLocaleDateString("it-IT") // ✅ SOLO DATA, SENZA ORA
      : "N/D"; // Valore di fallback per date non valide o mancanti
  }
};
