const API_BASE_URL = "http://localhost:3000/api";

export const serviziStudenti = {
  async fetchStudenti() {
    const token = localStorage.getItem("token");

    if (!token) {
      throw new Error("Token non presente. Effettua il login.");
    }

    console.log("=== FETCH STUDENTI ===");
    console.log("Chiamata API in corso...");

    const response = await fetch(`${API_BASE_URL}/studenti`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    console.log("Status response:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Errore response:", response.status, errorText);

      if (response.status === 401) {
        throw new Error("Sessione scaduta. Effettua nuovamente il login.");
      } else if (response.status === 403) {
        throw new Error("Accesso negato. Solo gli educatori possono vedere gli studenti.");
      } else {
        throw new Error(`Errore del server: ${response.status}`);
      }
    }

    const data = await response.json();
    console.log("Dati ricevuti dal server:", data);
    console.log("Tipo di dati:", typeof data);
    console.log("È un array?", Array.isArray(data));
    console.log("Numero di studenti:", data.length);

    if (!Array.isArray(data)) {
      throw new Error("Formato dati non valido: atteso array");
    }

    if (data.length > 0) {
      console.log("Struttura primo studente:", Object.keys(data[0]));
      console.log("Primo studente completo:", data[0]);
    }

    return data;
  },

  async aggiungiStudente(email) {
    const token = localStorage.getItem("token");
    
    console.log("=== AGGIUNTA STUDENTE ===");
    console.log("Email da aggiungere:", email);

    const response = await fetch(`${API_BASE_URL}/studenti`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ email }),
    });

    console.log("Status aggiunta:", response.status);

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Errore aggiunta:", errorData);
      throw new Error(errorData.error || "Errore nell'aggiunta dello studente");
    }

    const result = await response.json();
    console.log("Risultato aggiunta:", result);
    return result;
  },

  async eliminaStudente(idStudente) {
    const token = localStorage.getItem("token");
    
    console.log("=== ELIMINAZIONE STUDENTE ===");
    console.log("ID studente da eliminare:", idStudente);

    const response = await fetch(`${API_BASE_URL}/studenti/${idStudente}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    console.log("Status eliminazione:", response.status);

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Errore eliminazione:", errorData);
      throw new Error(errorData.error || "Errore nella rimozione dello studente");
    }

    const result = await response.json();
    console.log("Risultato eliminazione:", result);
    return result;
  }
};
