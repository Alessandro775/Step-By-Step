//Contiene funzioni di utilità per la formattazione delle date
export const formattatoreDate = {
  /**
   * Formatta una data in formato italiano esteso e leggibile
   * Converte date ISO o altri formati in una rappresentazione italiana
   * con nomi dei mesi per migliorare la leggibilità nell'interfaccia utente*/
    formatDateItalian(dateString) {
      if (!dateString) return "";
  
      try {
            /**
       * Array dei nomi dei mesi in italiano
       * Utilizzato per sostituire i numeri dei mesi con nomi leggibili
       * Ordinato secondo l'indice JavaScript (0-11)
       */
        const mesiItaliani = [
          "gennaio", "febbraio", "marzo", "aprile", "maggio", "giugno",
          "luglio", "agosto", "settembre", "ottobre", "novembre", "dicembre",
        ];
        
      // Crea oggetto Date dalla stringa di input
        const date = new Date(dateString);
         /**
       * Validazione della data creata
       * isNaN(date.getTime()) verifica se la data è valida
       * Date non valide restituiscono NaN quando si chiama getTime()
       */
        if (isNaN(date.getTime())) {
          // Se la data non è valida, restituisce la stringa originale come fallback
          return dateString;
        }
         /**
       * Estrazione dei componenti della data
       * Utilizza i metodi nativi di Date per ottenere giorno, mese e anno
       */
        const giorno = date.getDate();
        const mese = mesiItaliani[date.getMonth()];
        const anno = date.getFullYear();

        // Costruisce e restituisce la stringa formattata in italiano
        return `${giorno} ${mese} ${anno}`;
      } catch (error) {
         /**
       * Gestione degli errori durante la formattazione
       * Cattura qualsiasi errore imprevisto e lo registra per debugging
       * Restituisce la stringa originale come fallback sicuro
       */
        console.error("Errore formattazione data:", error);
        return dateString;
      }
    },
     /**
   * Verifica se una data di assegnazione corrisponde alla data odierna
   * Utilizzato per identificare esercizi o contenuti assegnati oggi
   * per evidenziarli nell'interfaccia utente o applicare logiche specifiche*/
    isAssegnatoOggi(dataAssegnazione) {
      const data = new Date(dataAssegnazione);
      const oggi = new Date();
      return data.toDateString() === oggi.toDateString();
    }
  };
  