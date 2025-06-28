import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFeedback } from './useFeedback';
import { serviziStudenti } from '../servizi/api/serviziStudenti';

export const useStudentiEducatore = () => {
  const navigate = useNavigate();
  
  // ✅ Hook per il feedback integrato
  const { notifiche, successo, errore, avviso } = useFeedback();
  
  // Stati
  const [studenti, setStudenti] = useState([]);
  const [emailNuovoStudente, setEmailNuovoStudente] = useState("");
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  // Inizializzazione
  useEffect(() => {
    const token = localStorage.getItem("token");
    console.log("=== DEBUG TOKEN ===");
    console.log("Token presente:", !!token);

    if (token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        console.log("Payload token:", payload);
        console.log("ID utente:", payload.id);
        console.log("Ruolo utente:", payload.ruolo);

        if (payload.ruolo !== "E") {
          errore("Accesso negato: solo gli educatori possono gestire gli studenti", {
            persistente: true
          });
          setLoading(false);
          return;
        }
      } catch (e) {
        console.error("Errore decodifica token:", e);
        errore("Token non valido. Effettua nuovamente il login.", {
          persistente: true,
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

    fetchStudenti();
  }, []);

  // Funzioni API
  const fetchStudenti = async () => {
    try {
      setLoading(true);
      const data = await serviziStudenti.fetchStudenti();
      setStudenti(data);
      console.log("Studenti caricati correttamente");
      
      // ✅ Feedback solo se nessuno studente (condizione limite)
      if (data.length === 0) {
        avviso("📋 Nessuno studente associato al momento", {
          durata: 4000
        });
      }
    } catch (err) {
      console.error("Errore fetch studenti:", err);
      errore(`Errore nel caricamento degli studenti: ${err.message}`, {
        durata: 8000
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAggiungiStudente = async (e) => {
    e.preventDefault();
    
    if (!emailNuovoStudente.trim()) {
      avviso("⚠️ Inserisci un'email valida", { durata: 3000 });
      return;
    }

    // ✅ Validazione email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailNuovoStudente.trim())) {
      avviso("⚠️ Formato email non valido", { durata: 3000 });
      return;
    }

    try {
      setAdding(true);

      const result = await serviziStudenti.aggiungiStudente(emailNuovoStudente.trim());
      
      setEmailNuovoStudente("");
      
      // ✅ Messaggio di successo personalizzato
      successo(` Studente aggiunto con successo! Email: ${emailNuovoStudente.trim()}`, {
        durata: 5000
      });
      
      await fetchStudenti();
    } catch (err) {
      console.error("Errore aggiunta studente:", err);
      
      // ✅ Gestione errori specifici
      if (err.message.includes("already exists") || err.message.includes("già presente")) {
        avviso(`Lo studente con email ${emailNuovoStudente.trim()} è già nella tua lista`, {
          durata: 6000
        });
      } else if (err.message.includes("not found") || err.message.includes("non trovato")) {
        errore(` Nessuno studente trovato con email ${emailNuovoStudente.trim()}`, {
          durata: 6000
        });
      } else {
        errore(`Errore nell'aggiunta dello studente: ${err.message}`, {
          durata: 8000
        });
      }
    } finally {
      setAdding(false);
    }
  };

  const handleEliminaStudente = async (idStudente, nomeStudente) => {
    // ✅ Conferma con informazioni utili
    const conferma = window.confirm(
      `Sei sicuro di voler rimuovere ${nomeStudente} dalla tua lista studenti?\n\nQuesta azione rimuoverà l'associazione ma non eliminerà l'account dello studente.`
    );

    if (!conferma) return;

    try {
      const result = await serviziStudenti.eliminaStudente(idStudente);
      
      // ✅ Messaggio di successo con azione di undo (se supportato)
      successo(`🗑️ ${nomeStudente} è stato rimosso dalla tua lista`, {
        durata: 8000
      });
      
      await fetchStudenti();
    } catch (err) {
      console.error("Errore eliminazione studente:", err);
      
      // ✅ Gestione errori specifici per la rimozione
      if (err.message.includes("not found")) {
        avviso(`Lo studente ${nomeStudente} non è più nella tua lista`, {
          durata: 5000
        });
      } else if (err.message.includes("permission")) {
        errore(`Non hai i permessi per rimuovere ${nomeStudente}`, {
          durata: 6000
        });
      } else {
        errore(`Errore nella rimozione di ${nomeStudente}: ${err.message}`, {
          durata: 8000
        });
      }
    }
  };

  // Funzioni di navigazione
  const handleVisualizzaContenuti = (idStudente, nomeStudente) => {
    const studenteCompleto = studenti.find(s => s.idStudente === idStudente);
    
    const studenteSelezionatoCompleto = {
      id: idStudente,
      idStudente: idStudente,
      nome: studenteCompleto?.nome || 'Studente',
      cognome: studenteCompleto?.cognome || '',
      email: studenteCompleto?.email || ''
    };

    console.log("🔧 Studente selezionato per contenuti:", studenteSelezionatoCompleto);
    sessionStorage.setItem('studenteSelezionato', JSON.stringify(studenteSelezionatoCompleto));
    
    // ✅ Feedback di navigazione
    successo(`📚 Caricamento contenuti per ${nomeStudente}...`, { durata: 2000 });
    navigate('/contenuto-educatore');
  };

  const handleVisualizzaCronologia = (idStudente, nomeStudente) => {
    const studenteCompleto = studenti.find(s => s.idStudente === idStudente);
    
    const studenteSelezionatoCompleto = {
      id: idStudente,
      idStudente: idStudente,
      nome: studenteCompleto?.nome || 'Studente',
      cognome: studenteCompleto?.cognome || '',
      email: studenteCompleto?.email || ''
    };

    console.log("🔧 Studente selezionato per cronologia:", studenteSelezionatoCompleto);
    sessionStorage.setItem('studenteSelezionato', JSON.stringify(studenteSelezionatoCompleto));
    
    // ✅ Feedback di navigazione
    successo(`📊 Caricamento cronologia per ${nomeStudente}...`, { durata: 2000 });
    navigate('/cronologia-educatore');
  };

  return {
    // Stati
    studenti,
    emailNuovoStudente,
    loading,
    adding,
    notifiche, // ✅ Esponi le notifiche
    
    // Setters
    setEmailNuovoStudente,
    
    // Azioni
    handleAggiungiStudente,
    handleEliminaStudente,
    handleVisualizzaContenuti,
    handleVisualizzaCronologia,
    fetchStudenti,
    
    // Metodi feedback
    successo,
    errore,
    avviso
  };
};
