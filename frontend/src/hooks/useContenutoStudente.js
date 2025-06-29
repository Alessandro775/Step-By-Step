// hooks/useContenutoStudente.js
import { useState, useEffect } from 'react';
import { useFeedback } from './useFeedback.js';
import { serviziContenuti } from '../servizi/api/serviziContenuti.js';

export const useContenutoStudente = () => {
  //stati principali per la gestione degli stati e dei contenuti delle informazioni studente
  const [contenuti, setContenuti] = useState([]);
  const [studenteInfo, setStudenteInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [esercizi, setEsercizi] = useState([]);
  const [loadingEsercizi, setLoadingEsercizi] = useState(false);

  const { notifiche, successo, errore, avviso } = useFeedback();

  useEffect(() => {
    // Recupera dati studente da sessionStorage
    const studenteData = sessionStorage.getItem("studenteSelezionato");
    console.log("📊 Dati studente da sessionStorage:", studenteData);
    
    if (studenteData) {
      try {
        const parsedData = JSON.parse(studenteData);
        console.log("✅ Studente caricato:", parsedData);
        setStudenteInfo(parsedData);
        fetchContenuti(parsedData.id || parsedData.idStudente);
      } catch (err) {
        console.error("❌ Errore parsing dati studente:", err);
        setError("Errore nel caricamento dei dati studente");
      }
    } else {
      // Gestione caso in cui dati studente non sono presenti
      setError("Informazioni studente non trovate");
      setLoading(false);
    }
    
    // Carica sempre i tipi di esercizi all'avvio
    fetchEsercizi();
  }, []);

  const fetchContenuti = async (idStudente) => {
    // Validazione ID studente
    if (!idStudente) {
      setError("ID studente mancante");
      setLoading(false);
      return;
    }

    try {
       // Imposta stati di caricamento
      setLoading(true);
      setError(null);
      console.log("🔄 Caricamento contenuti per studente:", idStudente);
      // Chiamata API per recuperare contenuti
      const data = await serviziContenuti.fetchContenuti(idStudente);
      console.log("✅ Contenuti caricati:", data);
       // Aggiorna stato con i contenuti ricevuti
      setContenuti(data);
       // Notifica se non ci sono contenuti
      if (data.length === 0) {
        avviso('Nessun contenuto trovato per questo studente.', { durata: 4000 });
      }
    } catch (err) {
      console.error("❌ Errore fetch contenuti:", err);
      // Gestione errori con messaggi user-friendly
      const messaggioErrore = err.message || "Errore sconosciuto nel caricamento";
      setError("Errore nel caricamento dei contenuti: " + messaggioErrore);
      errore(`Errore nel caricamento dei contenuti: ${messaggioErrore}`, { durata: 8000 });
    } finally {
      // Sempre eseguito: rimuove stato di loading
      setLoading(false);
    }
  };

  //carica i tipi di esercizi disponibili per l'assegnazioni
  const fetchEsercizi = async () => {
    try {
      // Tentativo con metodo principale
      setLoadingEsercizi(true);
      console.log("🔄 Caricamento tipi esercizi...");
      
      let data;
      try {
        // Prova prima il metodo principale
        data = await serviziContenuti.fetchEsercizi();
      } catch (error) {
        console.log("⚠️ Metodo principale fallito, provo alternativo...");
        // Se fallisce, prova il metodo alternativo
        data = await serviziContenuti.fetchEserciziAlternativo();
      }
      
      console.log("✅ Tipi esercizi caricati:", data);
      
      setEsercizi(data);
      // Gestione diversi scenari di risposta
      if (data.length === 0) {
        avviso('Nessun tipo di esercizio disponibile', { durata: 3000 });
      } else {
        console.log(`📚 Caricati ${data.length} tipi di esercizi:`, data.map(e => e.titolo || e.nome));
        successo(`Caricati ${data.length} tipi di esercizio`, { durata: 2000 });
      }
    } catch (err) {
      console.error("❌ Errore caricamento tipi esercizi:", err);
      errore('Errore nel caricamento dei tipi di esercizi: ' + err.message, { durata: 5000 });
      
      // Imposta esercizi mock per test se il server non risponde
      console.log("🔧 Imposto esercizi mock per debugging...");
      setEsercizi([
        { id: 1, titolo: "Pronuncia Sillabe", tipologia: "pronuncia_sillabe" },
        { id: 2, titolo: "Pronuncia Parole", tipologia: "pronuncia_parole" },
        { id: 3, titolo: "Ripetizione Suoni", tipologia: "ripetizione_suoni" }
      ]);
      avviso('Usando dati di test per i tipi di esercizi', { durata: 4000 });
    } finally {
      setLoadingEsercizi(false);
    }
  };
//funzione per  riassegnare gli esercizi
  const riassegnaEsercizio = async (idEsercizioAssegnato, testo) => {
    // Validazione informazioni studente
    if (!studenteInfo?.id && !studenteInfo?.idStudente) {
      errore("Informazioni studente mancanti", { durata: 5000 });
      return;
    }

    try {
      console.log("🔄 Riassegnazione esercizio:", { idEsercizioAssegnato, testo });
      // Estrazione ID studente con fallback
      const idStudente = studenteInfo.id || studenteInfo.idStudente;
      // Chiamata API per riassegnazione
      const result = await serviziContenuti.riassegnaEsercizio(idStudente, idEsercizioAssegnato);
      
      console.log("✅ Risultato riassegnazione:", result);
      // Notifica di successo con messaggio dettagliato
      successo(`✅ ${result.message || 'Esercizio riassegnato con successo'}\n\n🔄 Lo studente ora ha una nuova copia dell'esercizio da completare.`, { durata: 6000 });
      // Ricarica contenuti per aggiornare la vista
      await fetchContenuti(idStudente);
    } catch (err) {
      console.error("❌ Errore riassegnazione:", err);
      errore("Errore nella riassegnazione dell'esercizio: " + err.message, { durata: 8000 });
    }
  };
//funzione per eliminare i contenuti
  const eliminaContenuto = async (idEsercizioAssegnato, titolo) => {
    // Validazione informazioni studente
    if (!studenteInfo?.id && !studenteInfo?.idStudente) {
      errore("Informazioni studente mancanti", { durata: 5000 });
      return;
    }

    try {
      console.log("🗑️ Eliminazione contenuto:", { idEsercizioAssegnato, titolo });
      // Estrazione ID studente con fallback
      const idStudente = studenteInfo.id || studenteInfo.idStudente;
      await serviziContenuti.eliminaContenuto(idStudente, idEsercizioAssegnato);
      
      console.log("✅ Contenuto eliminato");
      // Chiamata API per eliminazione
      successo(`Contenuto "${titolo}" eliminato con successo`, { durata: 4000 });
      // Ricarica contenuti per aggiornare la vista
      await fetchContenuti(idStudente);
    } catch (err) {
      console.error("❌ Errore eliminazione:", err);
      errore("Errore nell'eliminazione del contenuto: " + err.message, { durata: 8000 });
    }
  };

  return {
    //stati e dati
    contenuti,
    studenteInfo,
    loading,
    error,
    esercizi,
    loadingEsercizi, // Esponi lo stato di caricamento esercizi
    notifiche,
    setError, // Funzione per impostare errori
    fetchContenuti, // Ricarica contenuti studente
    riassegnaEsercizio,
    eliminaContenuto,
    fetchEsercizi
  };
};
