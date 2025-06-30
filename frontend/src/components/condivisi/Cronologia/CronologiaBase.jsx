import React, { useState, useEffect } from "react";
import TabellaCronologia from "./TabellaCronologia";
import GraficiCronologia from "./GraficiCronologia";
import CaricamentoSpinner from "../Layout/CaricamentoSpinner";
import ContainerNotifiche from "../Layout/ContainerNotifiche";
import { utilitaApiDati } from "../../../servizi/utilità/utilitaApiDati";
import { useFeedback } from "../../../hooks/useFeedback";
import styles from './CronologiaBase.module.css';
//Visualizzazione della cronologia degli esercizi, sia tabellare che grafici dei dati
const CronologiaBase = ({ 
  apiEndpoint, //API da richiamare per recuperare dati
  titolo = "Cronologia",
  sottotitolo = "",
  nomeUtente = "",
  mostraBottoneTorna = false,
  onTornaIndietro = () => {},
  testoBottoneGrafici = "📊 Mostra Grafici",
  testoBottoneTabella = "📋 Mostra Tabella",
  mostraFormatoCompleto = false
}) => { //stati del componente
  const [cronologia, setCronologia] = useState([]);
  const [infoStudente, setInfoStudente] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mostraGrafici, setMostraGrafici] = useState(false);
  const [datiGraficoPunteggio, setDatiGraficoPunteggio] = useState([]);
  const [datiGraficoErroriTentativi, setDatiGraficoErroriTentativi] = useState([]);
// Hook personalizzato per gestire notifiche e feedback
  const { notifiche, errore, avviso, info } = useFeedback();

//Funzione principale per il recupero dati dall'API gestisce autenticazione, errori e preocessamento dei dati
  const fetchData = async () => {
    try {
      setLoading(true);
      // Recupera il token di autenticazione
      const token = localStorage.getItem("token");
      //verifica la presenza del token
      if (!token) {
        throw new Error("Token mancante. Effettua nuovamente il login.");
      }
// effettua la chiamata API con headers per l'autenticazione
      const response = await fetch(`http://localhost:3000/api/${apiEndpoint}`, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });
// gestione errori HTTP con messaggi specifici
      if (!response.ok) {
        const getErrorMessage = (status) => {
          switch (status) {
            case 401: return "Sessione scaduta. Effettua nuovamente il login.";
            case 403: return "Non hai i permessi per visualizzare questa cronologia.";
            case 404: return "Cronologia non trovata per questo studente.";
            case 500: return "Errore del server. Riprova tra qualche minuto.";
            default: return `Errore di connessione (${status})`;
          }
        };
        throw new Error(getErrorMessage(response.status));
      }

      const data = await response.json();

//processo dati basato sulle risposte
      //Risposta con oggetto studente e cronologia
      if (data.studente && data.cronologia) {
        setInfoStudente(data.studente);
        setCronologia(data.cronologia);
        // Prepara i dati per i grafici
        setDatiGraficoPunteggio(utilitaApiDati.preparaDatiGraficoPunteggio(data.cronologia));
        setDatiGraficoErroriTentativi(utilitaApiDati.preparaDatiGraficoErroriTentativi(data.cronologia));
        //notifica se la cronologia è vuota
        if (data.cronologia.length === 0) {
          info("📋 Cronologia vuota - nessun esercizio completato", { durata: 4000 });
        }
      } else if (Array.isArray(data)) {
        setCronologia(data);
        // Prepara i dati per i grafici
        setDatiGraficoPunteggio(utilitaApiDati.preparaDatiGraficoPunteggio(data));
        setDatiGraficoErroriTentativi(utilitaApiDati.preparaDatiGraficoErroriTentativi(data));
        
        // Se l'API è per la cronologia dello studente, recupera le informazioni del profilo e imposta il nome e cognome dello studente
        if (apiEndpoint === 'student-cronologia') {
          await fetchProfiloStudente(token);
        } else if (apiEndpoint.includes('studenti/') && nomeUtente) {
          const [nome, ...cognomeParts] = nomeUtente.trim().split(' ');
          setInfoStudente({ 
            nome: nome || '', 
            cognome: cognomeParts.join(' ') || '' 
          });
        }
        // Notifica se la cronologia è vuota
        if (data.length === 0) {
          info("📋 Cronologia vuota - nessun esercizio completato", { durata: 4000 });
        }
      }

    } catch (err) {
      // Gestione degli errori con notifiche
      errore(err.message, {
        durata: 8000,
        azione: {
          testo: "🔄 Riprova",
          onClick: fetchData
        },
        persistente: true
      });
    } finally {
      // Rimuove lo stato di caricamento in ogni caso
      setLoading(false);
    }
  };

  // Funzione separata per il profilo studente
  const fetchProfiloStudente = async (token) => {
    try {
      //esegue una chiamata HTTP GET per recuperare il profilo dello studente
      const profileResponse = await fetch(`http://localhost:3000/api/student-profile`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      //controlla se la risposta è ok
      if (profileResponse.ok) {
        const profileData = await profileResponse.json();
        setInfoStudente(profileData);
      }
    } catch (e) {
      //se non è ok mostra il messaggio di errore
      avviso("⚠️ Impossibile caricare alcune informazioni del profilo", {
        durata: 4000
      });
    }
  };

  //caricamento dei dati
  useEffect(() => {
    if (apiEndpoint) {
      fetchData();
    }
  }, [apiEndpoint, nomeUtente]);

  const handleToggleGrafici = () => {
    setMostraGrafici(!mostraGrafici);
  };
//bottone torna indietro
  const handleTornaIndietro = () => {
    info("⬅️ Tornando alla pagina precedente...", { durata: 1000 });
    onTornaIndietro();
  };
//caricamento
  if (loading) {
    return (
      <>
        <CaricamentoSpinner messaggio="Caricamento cronologia..." />
        <ContainerNotifiche notifiche={notifiche} />
      </>
    );
  }

  const nomeCompleto = infoStudente?.nome 
    ? `${infoStudente.nome} ${infoStudente.cognome || ''}`.trim()
    : nomeUtente || 'Utente';
// Controlla se ci sono dati per i grafici
  const hasDatiGrafici = datiGraficoPunteggio.length > 0 || datiGraficoErroriTentativi.length > 0;

  return (
    <div className={styles.container}>
    {/*conteiner delle notifiche sempre visibile*/}
      <ContainerNotifiche notifiche={notifiche} />
      {/*bottone torna indietro*/}
      {mostraBottoneTorna && (
        <div className={styles.topButtonContainer}>
          <button onClick={handleTornaIndietro} className={styles.backButton}>
            ← Torna Indietro
          </button>
        </div>
      )}
      {/*header con titolo*/}
      <div className={styles.header}>
        <div className={styles.headerCenter}>
          <h1>{titolo}</h1>
          <p><strong>Studente: {nomeCompleto}</strong></p>
          {sottotitolo && <p>{sottotitolo}</p>}
        </div>
      {/*bottone grafici/tabella solo se ci sono dati*/}
        {hasDatiGrafici && (
          <div className={styles.headerRight}>
            <button 
              onClick={handleToggleGrafici}
              className={styles.chartsToggleButton}
            >
              {mostraGrafici ? testoBottoneTabella : testoBottoneGrafici}
            </button>
          </div>
        )}
      </div>
        {/*contenuto principale*/}
      <div className={styles.content}>
        {cronologia.length === 0 ? (
          <div className={styles.emptyState}>
            <p><strong>Nessun esercizio completato.</strong></p>
            <p>La cronologia apparirà qui una volta che lo studente avrà completato alcuni esercizi.</p>
          </div>
        ) : mostraGrafici ? (
          //vista grafici
          <GraficiCronologia
            datiGraficoPunteggio={datiGraficoPunteggio}
            datiGraficoErroriTentativi={datiGraficoErroriTentativi}
          />
        ) : (
          //vista tabella
          <TabellaCronologia 
            cronologia={cronologia} 
            mostraFormatoDataOraCompleto={mostraFormatoCompleto}
          />
        )}
      </div>
    </div>
  );
};

export default CronologiaBase;
