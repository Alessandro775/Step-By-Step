// servizi/api/serviziContenuti.js
const APIBASEURL = 'http://localhost:3000/api';

export const serviziContenuti = {
  async fetchContenuti(idStudente) {
    const token = localStorage.getItem("token");
    const response = await fetch(`${APIBASEURL}/studenti/${idStudente}/contenuti`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Errore nel caricamento dei contenuti");
    }

    return await response.json();
  },

  // ✅ CORREZIONE: Usa l'endpoint corretto per i tipi di esercizi
  async fetchEsercizi() {
    const token = localStorage.getItem("token");
    
    console.log("🔄 Fetch tipi esercizi - Inizio chiamata");
    
    try {
      // ✅ Usa l'endpoint che funziona già nel tuo sistema
      const response = await fetch(`${APIBASEURL}/esercizi`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      console.log("📡 Response status:", response.status);
      console.log("📡 Response headers:", Object.fromEntries(response.headers));

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ Errore response:", errorText);
        throw new Error(`Errore HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log("✅ Dati ricevuti dal server:", data);
      console.log("📊 Tipo di dati:", typeof data);
      console.log("📊 È array?", Array.isArray(data));

      // ✅ Gestisci diversi formati di risposta
      let esercizi = [];
      
      if (Array.isArray(data)) {
        esercizi = data;
      } else if (data.esercizi && Array.isArray(data.esercizi)) {
        esercizi = data.esercizi;
      } else if (data.data && Array.isArray(data.data)) {
        esercizi = data.data;
      } else {
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
      console.error("❌ Errore completo fetch esercizi:", error);
      throw error;
    }
  },

  // Se l'endpoint /esercizi non funziona, prova questo alternativo
  async fetchEserciziAlternativo() {
    const token = localStorage.getItem("token");
    
    console.log("🔄 Tentativo fetch esercizi alternativo");
    
    try {
      // ✅ Prova diversi endpoint possibili
      const endpoints = [
        `${APIBASEURL}/esercizi`,
        `${APIBASEURL}/tipi-esercizi`,
        `${APIBASEURL}/esercizio`,
        `${APIBASEURL}/educatori/esercizi`
      ];

      for (const endpoint of endpoints) {
        try {
          console.log(`🔍 Provo endpoint: ${endpoint}`);
          
          const response = await fetch(endpoint, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          });

          if (response.ok) {
            const data = await response.json();
            console.log(`✅ Endpoint funzionante: ${endpoint}`, data);
            
            let esercizi = Array.isArray(data) ? data : 
                          data.esercizi || data.data || [];
            
            if (esercizi.length > 0) {
              return esercizi;
            }
          } else {
            console.log(`❌ Endpoint ${endpoint} failed: ${response.status}`);
          }
        } catch (err) {
          console.log(`❌ Errore endpoint ${endpoint}:`, err.message);
        }
      }
      
      throw new Error("Nessun endpoint funzionante trovato per gli esercizi");
      
    } catch (error) {
      console.error("❌ Errore fetch alternativo:", error);
      throw error;
    }
  },

  async aggiungiContenuto(idStudente, formData) {
    const token = localStorage.getItem("token");
    
    console.log("📤 Aggiunta contenuto:", formData);
    
    const response = await fetch(`${APIBASEURL}/studenti/${idStudente}/contenuti`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(formData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Errore nell'aggiunta del contenuto");
    }

    return await response.json();
  },

  async uploadImmagine(file) {
    const token = localStorage.getItem("token");
    const uploadFormData = new FormData();
    uploadFormData.append("image", file);

    const response = await fetch(`${APIBASEURL}/upload-image`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: uploadFormData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Errore upload immagine");
    }

    return await response.json();
  },

  async riassegnaEsercizio(idStudente, idEsercizioAssegnato) {
    const token = localStorage.getItem("token");
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

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Errore nella riassegnazione dell'esercizio");
    }

    return await response.json();
  },

  async eliminaContenuto(idStudente, idEsercizioAssegnato) {
    const token = localStorage.getItem("token");
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

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Errore nell'eliminazione del contenuto");
    }

    return await response.json();
  }
};
