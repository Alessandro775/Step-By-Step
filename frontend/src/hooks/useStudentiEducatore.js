import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFeedback } from './useFeedback';
import { serviziStudenti } from '../servizi/api/serviziStudenti';

export const useStudentiEducatore = () => {
  const navigate = useNavigate();
  // Hook per la navigazione programmatica tra le pagine
  const { notifiche, successo, errore, avviso } = useFeedback();
   // Array contenente tutti gli studenti associati all'educatore
  const [studenti, setStudenti] = useState([]);
  // Email inserita nel form per aggiungere un nuovo studente
  const [emailNuovoStudente, setEmailNuovoStudente] = useState("");
  // Indica se è in corso il caricamento iniziale degli studenti
  const [loading, setLoading] = useState(true);
  // Indica se è in corso l'aggiunta di un nuovo studente
  const [adding, setAdding] = useState(false);

  // Inizializzazione e autenticazione
  useEffect(() => {
     // Recupera il token JWT dal localStorage per verificare l'autenticazione
    const token = localStorage.getItem("token");
    if (token) {
      try {
         // Decodifica il payload del JWT per estrarre informazioni utente
        const payload = JSON.parse(atob(token.split(".")[1]));
        // Verifica che l'utente sia un educatore (ruolo "E")
        if (payload.ruolo !== "E") {
          errore("Accesso negato: solo gli educatori possono gestire gli studenti", {
            persistente: true
          });
          setLoading(false);
          return;
        }
      } catch (e) {
         // Gestisce errori nella decodifica del token (token corrotto)
        errore("Token non valido. Effettua nuovamente il login.", {
          persistente: true,
           // Azione per permettere all'utente di fare login
          azione: {
            testo: "🔄 Login",
            onClick: () => {
              localStorage.removeItem("token");
              window.location.href = "/login";
            }
          }
        });
        setLoading(false);
        return;
      }
     // Se non c'è token, richiede il login
    } else {
      errore("❌ Token non presente. Effettua il login.", {
        persistente: true,
        azione: {
          testo: "🔑 Vai al Login",
          onClick: () => window.location.href = "/login"
        }
      });
      setLoading(false);
      return;
    }
// Se l'autenticazione è valida, carica gli studenti
    fetchStudenti();
  }, []); // Eseguito solo al mount del componente

  // Recupera dal server tutti gli studenti associati all'educatore
  const fetchStudenti = async () => {
    try {
       // Imposta lo stato di caricamento
      setLoading(true);
       // Chiama l'API per ottenere la lista degli studenti
      const data = await serviziStudenti.fetchStudenti();
      setStudenti(data);      
      // Feedback solo se nessuno studente (condizione limite)
      if (data.length === 0) {
        avviso("📋 Nessuno studente associato al momento", {
          durata: 4000
        });
      }
    } catch (err) {
      // Gestisce errori nel caricamento con feedback all'utente
      console.error("Errore fetch studenti:", err);
      errore(`Errore nel caricamento degli studenti: ${err.message}`, {
        durata: 8000
      });
    } finally {
      // Sempre eseguito: rimuove lo stato di caricamento
      setLoading(false);
    }
  };
 // Gestisce l'aggiunta di un nuovo studente tramite email
  const handleAggiungiStudente = async (e) => {
      // Previene il comportamento default del form (refresh pagina)
    e.preventDefault();
    // Validazione: verifica che l'email non sia vuota
    if (!emailNuovoStudente.trim()) {
      avviso("⚠️ Inserisci un'email valida", { durata: 3000 });
      return;
    }
     // Validazione formato email con regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailNuovoStudente.trim())) {
      avviso("⚠️ Formato email non valido", { durata: 3000 });
      return;
    }
    try {
       // Imposta lo stato di "aggiunta in corso" per disabilitare il form
      setAdding(true);
// Chiama l'API per aggiungere lo studente
      const result = await serviziStudenti.aggiungiStudente(emailNuovoStudente.trim());
        // Reset del campo email dopo successo
      setEmailNuovoStudente("");
      
       // Notifica di successo con email confermata
      successo(` Studente aggiunto con successo! Email: ${emailNuovoStudente.trim()}`, {
        durata: 5000
      });
      // Ricarica la lista degli studenti per mostrare il nuovo studente
      await fetchStudenti();
    } catch (err) {
      console.error("Errore aggiunta studente:", err);
      
       // Gestione errori specifici con messaggi personalizzati
      if (err.message.includes("already exists") || err.message.includes("già presente")) {
          // Studente già presente nella lista
        avviso(`Lo studente con email ${emailNuovoStudente.trim()} è già nella tua lista`, {
          durata: 6000
        });
      } else if (err.message.includes("not found") || err.message.includes("non trovato")) {
        // Email non corrisponde a nessun account studente
        errore(` Nessuno studente trovato con email ${emailNuovoStudente.trim()}`, {
          durata: 6000
        });
      } else {
        // Altri errori generici
        errore(`Errore nell'aggiunta dello studente: ${err.message}`, {
          durata: 8000
        });
      }
    } finally {
      // Sempre eseguito: rimuove lo stato di "aggiunta in corso"
      setAdding(false);
    }
  };
// Rimuove l'associazione tra educatore e studente (non elimina l'account)
  const handleEliminaStudente = async (idStudente, nomeStudente) => {
     // Richiede conferma esplicita con spiegazione dell'azione
    const conferma = window.confirm(
      `Sei sicuro di voler rimuovere ${nomeStudente} dalla tua lista studenti?\n\nQuesta azione rimuoverà l'associazione ma non eliminerà l'account dello studente.`
    );
 // Se l'utente annulla, interrompe l'operazione
    if (!conferma) return;

    try {
       // Chiama l'API per rimuovere l'associazione
      const result = await serviziStudenti.eliminaStudente(idStudente);
      
      // Notifica di successo con nome dello studente
      successo(`🗑️ ${nomeStudente} è stato rimosso dalla tua lista`, {
        durata: 8000
      });
       // Ricarica la lista per aggiornare la vista
      await fetchStudenti();
    } catch (err) {
      console.error("Errore eliminazione studente:", err);
      
      // Gestione errori specifici per la rimozione
      if (err.message.includes("not found")) {
        // Studente già non più presente
        avviso(`Lo studente ${nomeStudente} non è più nella tua lista`, {
          durata: 5000
        });
      } else if (err.message.includes("permission")) {
        // Problemi di permessi
        errore(`Non hai i permessi per rimuovere ${nomeStudente}`, {
          durata: 6000
        });
      } else {
         // Altri errori generici
        errore(`Errore nella rimozione di ${nomeStudente}: ${err.message}`, {
          durata: 8000
        });
      }
    }
  };

  // Naviga alla pagina dei contenuti/esercizi di uno studente specifico
  const handleVisualizzaContenuti = (idStudente, nomeStudente) => {
    // Trova i dati completi dello studente nell'array
    const studenteCompleto = studenti.find(s => s.idStudente === idStudente);
    // Prepara l'oggetto con tutti i dati necessari per la pagina di destinazione
    const studenteSelezionatoCompleto = {
      id: idStudente,
      idStudente: idStudente, // Duplicato per compatibilità con diverse parti del codice
      nome: studenteCompleto?.nome || 'Studente', // Fallback se nome mancante
      cognome: studenteCompleto?.cognome || '',
      email: studenteCompleto?.email || ''
    };
    // Salva i dati dello studente nel sessionStorage per la pagina di destinazione
    sessionStorage.setItem('studenteSelezionato', JSON.stringify(studenteSelezionatoCompleto));
    
    // Feedback di navigazione per informare l'utente
    successo(`📚 Caricamento contenuti per ${nomeStudente}...`, { durata: 2000 });
    // Naviga alla pagina dei contenuti
    navigate('/contenuto-educatore');
  };
// Naviga alla pagina della cronologia/statistiche di uno studente specifico
  const handleVisualizzaCronologia = (idStudente, nomeStudente) => {
    // Trova i dati completi dello studente nell'array
    const studenteCompleto = studenti.find(s => s.idStudente === idStudente);
     // Prepara l'oggetto con tutti i dati necessari
    const studenteSelezionatoCompleto = {
      id: idStudente,
      idStudente: idStudente,
      nome: studenteCompleto?.nome || 'Studente',
      cognome: studenteCompleto?.cognome || '',
      email: studenteCompleto?.email || ''
    };
     // Salva i dati nel sessionStorage
    sessionStorage.setItem('studenteSelezionato', JSON.stringify(studenteSelezionatoCompleto));
    // Feedback di navigazione
    successo(`📊 Caricamento cronologia per ${nomeStudente}...`, { durata: 2000 });
     // Naviga alla pagina della cronologia
    navigate('/cronologia-educatore');
  };

  return {
    // Stati
    studenti,// Array degli studenti associati
    emailNuovoStudente,// Valore del campo email nel form
    loading,// Stato di caricamento iniziale
    adding,// Stato di aggiunta in corso
    notifiche,  // Array delle notifiche da mostrare
    
    // Setters
    setEmailNuovoStudente,// Per aggiornare il campo email dal componente
    
    // Azioni
    handleAggiungiStudente,// Gestisce l'aggiunta di un nuovo studente
    handleEliminaStudente,// Gestisce la rimozione di uno studente
    handleVisualizzaContenuti, // Naviga ai contenuti di uno studente
    handleVisualizzaCronologia,// Naviga alla cronologia di uno studente
    fetchStudenti,// Ricarica manualmente la lista degli studenti
    
    // Metodi feedback
    successo, // Mostra notifiche di successo
    errore, // Mostra notifiche di errore
    avviso // Mostra notifiche di avviso
  };
};
