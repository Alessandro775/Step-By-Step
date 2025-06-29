// URL base per tutte le chiamate API al server backend
const APIBASEURL = "http://localhost:3000/api";

/**
 * Oggetto serviziContenuti - Contiene tutti i servizi API per la gestione dei contenuti
 * Fornisce metodi per recuperare, aggiungere, modificare ed eliminare contenuti educativi
 * e per gestire gli esercizi assegnati agli studenti
 */
export const serviziContenuti = {
  /*
   * Recupera tutti i contenuti assegnati a uno specifico studente
   * Utilizzato per visualizzare la lista dei contenuti nella dashboard dello studente*/

  async fetchContenuti(idStudente) {
    // Recupera il token di autenticazione dal localStorage per autorizzare la richiesta
    const token = localStorage.getItem("token");
    // Effettua la chiamata GET per recuperare i contenuti dello studente specifico
    const response = await fetch(
      `${APIBASEURL}/studenti/${idStudente}/contenuti`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );
    // Verifica se la risposta indica un errore HTTP
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.error || "Errore nel caricamento dei contenuti"
      );
    }
    // Restituisce i dati dei contenuti in formato JSON
    return await response.json();
  },

  /**
   * Recupera tutti i tipi di esercizi disponibili nel sistema
   * Utilizzato per popolare dropdown e liste di selezione negli strumenti dell'educatore
   * Include gestione robusta di diversi formati di risposta dal server*/
  async fetchEsercizi() {
    // Recupera il token di autenticazione
    const token = localStorage.getItem("token");

    console.log("🔄 Fetch tipi esercizi - Inizio chiamata");

    try {
      // Effettua la chiamata API per recuperare i tipi di esercizi disponibili
      const response = await fetch(`${APIBASEURL}/esercizi`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      // Log per debugging della risposta HTTP
      console.log("📡 Response status:", response.status);
      console.log("📡 Response headers:", Object.fromEntries(response.headers));
      // Verifica se la risposta indica un errore
      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ Errore response:", errorText);
        throw new Error(`Errore HTTP ${response.status}: ${errorText}`);
      }
      // Converte la risposta in JSON
      const data = await response.json();
      console.log("✅ Dati ricevuti dal server:", data);
      console.log("📊 Tipo di dati:", typeof data);
      console.log("📊 È array?", Array.isArray(data));

      // Gestione robusta di diversi formati di risposta dal server
      let esercizi = [];

      if (Array.isArray(data)) {
        // Formato: array diretto
        esercizi = data;
      } else if (data.esercizi && Array.isArray(data.esercizi)) {
        // Formato: { esercizi: [...] }
        esercizi = data.esercizi;
      } else if (data.data && Array.isArray(data.data)) {
        //Formato: { data: [...] }
        esercizi = data.data;
      } else {
        // Formato non riconosciuto
        console.error("❌ Formato dati non riconosciuto:", data);
        throw new Error("Formato dati esercizi non valido");
      }

      console.log("✅ Esercizi elaborati:", esercizi);
      console.log("📊 Numero esercizi:", esercizi.length);

      if (esercizi.length > 0) {
        console.log("📋 Primo esercizio:", esercizi[0]);
        console.log("📋 Campi primo esercizio:", Object.keys(esercizi[0]));
      }

      return esercizi;
    } catch (error) {
      // Gestione completa degli errori con logging dettagliato
      console.error("❌ Errore completo fetch esercizi:", error);
      throw error;
    }
  },

  //Metodo di fallback per recuperare gli esercizi quando l'endpoint principale non funziona
  async fetchEserciziAlternativo() {
    const token = localStorage.getItem("token");

    console.log("🔄 Tentativo fetch esercizi alternativo");

    try {
      // Lista di endpoint alternativi da provare in sequenza
      const endpoints = [
        `${APIBASEURL}/esercizi`,
        `${APIBASEURL}/tipi-esercizi`,
        `${APIBASEURL}/esercizio`,
        `${APIBASEURL}/educatori/esercizi`,
      ];
      // Prova ogni endpoint fino a trovarne uno funzionante
      for (const endpoint of endpoints) {
        try {
          console.log(`🔍 Provo endpoint: ${endpoint}`);
          // Effettua la chiamata API per l'endpoint corrente
          const response = await fetch(endpoint, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          });
          // Se la risposta è successful, elabora i dati
          if (response.ok) {
            const data = await response.json();
            console.log(`✅ Endpoint funzionante: ${endpoint}`, data);
            // Normalizza i dati in formato array
            let esercizi = Array.isArray(data)
              ? data
              : data.esercizi || data.data || [];
             // Restituisce i dati se ne trova almeno uno
            if (esercizi.length > 0) {
              return esercizi;
            }
          } else {
            console.log(`❌ Endpoint ${endpoint} failed: ${response.status}`);
          }
        } catch (err) {
          // Log dell'errore per l'endpoint corrente e continua con il prossimo
          console.log(`❌ Errore endpoint ${endpoint}:`, err.message);
        }
      }
       // Se nessun endpoint funziona, lancia errore
      throw new Error("Nessun endpoint funzionante trovato per gli esercizi");
    } catch (error) {
      console.error("❌ Errore fetch alternativo:", error);
      throw error;
    }
  },
  //Aggiunge un nuovo contenuto/esercizio a uno studente specifico
  async aggiungiContenuto(idStudente, formData) {
    const token = localStorage.getItem("token");

    console.log("📤 Aggiunta contenuto:", formData);
      // Effettua la chiamata POST per aggiungere il nuovo contenuto
    const response = await fetch(
      `${APIBASEURL}/studenti/${idStudente}/contenuti`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      }
    );
     // Verifica se l'aggiunta è andata a buon fine
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Errore nell'aggiunta del contenuto");
    }

    return await response.json();
  },
  //carica un'immagine sul server per l'utilizzo nei contenuti
  async uploadImmagine(file) {
    const token = localStorage.getItem("token");
    // Crea FormData per gestire l'upload di file binari
    const uploadFormData = new FormData();
    uploadFormData.append("image", file);
     // Effettua la chiamata POST per l'upload dell'immagine
    const response = await fetch(`${APIBASEURL}/upload-image`, {
      method: "POST",
      headers: {
         // il browser lo gestisce automaticamente il Content-Type per FormData
        Authorization: `Bearer ${token}`,
      },
      body: uploadFormData,
    });
     // Verifica se l'upload è andato a buon fine
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Errore upload immagine");
    }

    return await response.json();
  },
  //Riassegna un esercizio già esistente a uno studente
  async riassegnaEsercizio(idStudente, idEsercizioAssegnato) {
    const token = localStorage.getItem("token");
     // Effettua la chiamata POST per riassegnare l'esercizio
    const response = await fetch(
      `${APIBASEURL}/studenti/${idStudente}/contenuti/${idEsercizioAssegnato}/riassegna`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );
     // Verifica se la riassegnazione è andata a buon fine
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.error || "Errore nella riassegnazione dell'esercizio"
      );
    }

    return await response.json();
  },
  //Elimina un contenuto/esercizio assegnato a uno studente
  async eliminaContenuto(idStudente, idEsercizioAssegnato) {
    const token = localStorage.getItem("token");
     // Effettua la chiamata DELETE per eliminare il contenuto
    const response = await fetch(
      `${APIBASEURL}/studenti/${idStudente}/contenuti/${idEsercizioAssegnato}`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );
       // Verifica se l'eliminazione è andata a buon fine
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.error || "Errore nell'eliminazione del contenuto"
      );
    }

    return await response.json();
  },
};
