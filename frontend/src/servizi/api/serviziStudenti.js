// URL base per tutte le chiamate API relative agli studenti
const API_BASE_URL = "http://localhost:3000/api";

/**
 * Oggetto serviziStudenti - Contiene tutti i servizi per la gestione degli studenti
 * Fornisce metodi per recuperare, aggiungere ed eliminare studenti dal sistema
 * Utilizzato principalmente dagli educatori per gestire la propria classe
 */
export const serviziStudenti = {
 /**
   * Recupera la lista di tutti gli studenti associati all'educatore corrente
   * Utilizzato per popolare la dashboard dell'educatore con i suoi studenti
   * Include validazione del token e gestione robusta degli errori di autorizzazione*/
  async fetchStudenti() {
    // Recupera il token di autenticazione dal localStorage
    const token = localStorage.getItem("token");
    // Verifica preliminare della presenza del token prima di effettuare la chiamata
    if (!token) {
      throw new Error("Token non presente. Effettua il login.");
    }

    console.log("=== FETCH STUDENTI ===");
    console.log("Chiamata API in corso...");

     // Effettua la chiamata GET per recuperare la lista degli studenti
    const response = await fetch(`${API_BASE_URL}/studenti`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    console.log("Status response:", response.status);
    //Gestione granulare degli errori HTTP con feedback specifico per ogni scenario
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Errore response:", response.status, errorText);

      if (response.status === 401) {
        // Token scaduto o non valido - richiede nuovo login
        throw new Error("Sessione scaduta. Effettua nuovamente il login.");
      } else if (response.status === 403) {
        // Accesso negato - utente non ha i permessi necessari
        throw new Error("Accesso negato. Solo gli educatori possono vedere gli studenti.");
      } else {
        // Altri errori HTTP generici
        throw new Error(`Errore del server: ${response.status}`);
      }
    }
  //  Converte la risposta in JSON
    const data = await response.json();
    console.log("Dati ricevuti dal server:", data);
    console.log("Tipo di dati:", typeof data);
    console.log("È un array?", Array.isArray(data));
    console.log("Numero di studenti:", data.length);

    // Il server deve restituire un array di studenti per il corretto funzionamento
    if (!Array.isArray(data)) {
      throw new Error("Formato dati non valido: atteso array");
    }
    // Logging dettagliato per debugging quando ci sono dati disponibili
    if (data.length > 0) {
      console.log("Struttura primo studente:", Object.keys(data[0]));
      console.log("Primo studente completo:", data[0]);
    }

    return data;
  },
  /**
   * Aggiunge un nuovo studente alla classe dell'educatore
   * Permette agli educatori di associare studenti esistenti alla propria classe
   * tramite l'email dello studente*/
  async aggiungiStudente(email) {
      // Recupera il token di autenticazione
    const token = localStorage.getItem("token");
    
    console.log("=== AGGIUNTA STUDENTE ===");
    console.log("Email da aggiungere:", email);

    // Effettua la chiamata POST per aggiungere lo studente   
    const response = await fetch(`${API_BASE_URL}/studenti`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ email }),
    });

    console.log("Status aggiunta:", response.status);
    // Gestione degli errori durante l'aggiunta dello studente
    if (!response.ok) {
      const errorData = await response.json();
      console.error("Errore aggiunta:", errorData);
      throw new Error(errorData.error || "Errore nell'aggiunta dello studente");
    }

     // Converte la risposta di successo in JSON
    const result = await response.json();
    console.log("Risultato aggiunta:", result);
    return result;
  },
  /**
   * Elimina l'associazione di uno studente dalla classe dell'educatore
   * Rimuove lo studente dalla lista dell'educatore ma non elimina il profilo studente*/
  async eliminaStudente(idStudente) {
        // Recupera il token di autenticazione
    const token = localStorage.getItem("token");
    
    console.log("=== ELIMINAZIONE STUDENTE ===");
    console.log("ID studente da eliminare:", idStudente);

    // Effettua la chiamata DELETE per rimuovere l'associazione 
    const response = await fetch(`${API_BASE_URL}/studenti/${idStudente}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    console.log("Status eliminazione:", response.status);
    //Gestione degli errori durante la rimozione dello studente
    if (!response.ok) {
      const errorData = await response.json();
      console.error("Errore eliminazione:", errorData);
      throw new Error(errorData.error || "Errore nella rimozione dello studente");
    }
      // Converte la risposta di successo in JSON
    const result = await response.json();
    console.log("Risultato eliminazione:", result);
    return result;
  }
};
