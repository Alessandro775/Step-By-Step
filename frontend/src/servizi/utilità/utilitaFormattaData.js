// utilità/formattatoreDate.js
export const formattatoreDate = {
    formatDateItalian(dateString) {
      if (!dateString) return "";
  
      try {
        const mesiItaliani = [
          "gennaio", "febbraio", "marzo", "aprile", "maggio", "giugno",
          "luglio", "agosto", "settembre", "ottobre", "novembre", "dicembre",
        ];
  
        const date = new Date(dateString);
        if (isNaN(date.getTime())) {
          return dateString;
        }
  
        const giorno = date.getDate();
        const mese = mesiItaliani[date.getMonth()];
        const anno = date.getFullYear();
  
        return `${giorno} ${mese} ${anno}`;
      } catch (error) {
        console.error("Errore formattazione data:", error);
        return dateString;
      }
    },
  
    isAssegnatoOggi(dataAssegnazione) {
      const data = new Date(dataAssegnazione);
      const oggi = new Date();
      return data.toDateString() === oggi.toDateString();
    }
  };
  