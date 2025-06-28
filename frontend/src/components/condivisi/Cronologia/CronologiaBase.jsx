import React, { useState, useEffect } from "react";
import TabellaCronologia from "./TabellaCronologia";
import GraficiCronologia from "./GraficiCronologia";
import CaricamentoSpinner from "../Layout/CaricamentoSpinner";
import ContainerNotifiche from "../Layout/ContainerNotifiche";
import MessaggioErrore from "../Layout/MessaggioErrore";
import { utilitaApiDati } from "../../../servizi/utilità/utilitaApiDati";
import { useFeedback } from "../../../hooks/useFeedback";
import styles from './CronologiaBase.module.css';

const CronologiaBase = ({ 
  apiEndpoint,
  titolo = "Cronologia",
  sottotitolo = "",
  nomeUtente = "",
  mostraBottoneTorna = false,
  onTornaIndietro = () => {},
  testoBottoneGrafici = "📊 Mostra Grafici",
  testoBottoneTabella = "📋 Mostra Tabella",
  mostraFormatoCompleto = false
}) => {
  const [cronologia, setCronologia] = useState([]);
  const [infoStudente, setInfoStudente] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mostraGrafici, setMostraGrafici] = useState(false);
  const [datiGraficoPunteggio, setDatiGraficoPunteggio] = useState([]);
  const [datiGraficoErroriTentativi, setDatiGraficoErroriTentativi] = useState([]);

  const { notifiche, errore, avviso, info } = useFeedback();

  // ✅ Funzione di fetch centralizzata usando pattern dal contesto
  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      
      if (!token) {
        throw new Error("Token mancante. Effettua nuovamente il login.");
      }

      const response = await fetch(`http://localhost:3000/api/${apiEndpoint}`, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

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

      // ✅ Logica di processamento dati usando utilitaApiDati
      if (data.studente && data.cronologia) {
        setInfoStudente(data.studente);
        setCronologia(data.cronologia);
        setDatiGraficoPunteggio(utilitaApiDati.preparaDatiGraficoPunteggio(data.cronologia));
        setDatiGraficoErroriTentativi(utilitaApiDati.preparaDatiGraficoErroriTentativi(data.cronologia));
        
        if (data.cronologia.length === 0) {
          info("📋 Cronologia vuota - nessun esercizio completato", { durata: 4000 });
        }
      } else if (Array.isArray(data)) {
        setCronologia(data);
        setDatiGraficoPunteggio(utilitaApiDati.preparaDatiGraficoPunteggio(data));
        setDatiGraficoErroriTentativi(utilitaApiDati.preparaDatiGraficoErroriTentativi(data));
        
        // ✅ Caricamento profilo studente se necessario
        if (apiEndpoint === 'student-cronologia') {
          await fetchProfiloStudente(token);
        } else if (apiEndpoint.includes('studenti/') && nomeUtente) {
          const [nome, ...cognomeParts] = nomeUtente.trim().split(' ');
          setInfoStudente({ 
            nome: nome || '', 
            cognome: cognomeParts.join(' ') || '' 
          });
        }

        if (data.length === 0) {
          info("📋 Cronologia vuota - nessun esercizio completato", { durata: 4000 });
        }
      }

    } catch (err) {
      errore(err.message, {
        durata: 8000,
        azione: {
          testo: "🔄 Riprova",
          onClick: fetchData
        },
        persistente: true
      });
    } finally {
      setLoading(false);
    }
  };

  // ✅ Funzione separata per il profilo studente
  const fetchProfiloStudente = async (token) => {
    try {
      const profileResponse = await fetch(`http://localhost:3000/api/student-profile`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (profileResponse.ok) {
        const profileData = await profileResponse.json();
        setInfoStudente(profileData);
      }
    } catch (e) {
      avviso("⚠️ Impossibile caricare alcune informazioni del profilo", {
        durata: 4000
      });
    }
  };

  useEffect(() => {
    if (apiEndpoint) {
      fetchData();
    }
  }, [apiEndpoint, nomeUtente]);

  const handleToggleGrafici = () => {
    setMostraGrafici(!mostraGrafici);
  };

  const handleTornaIndietro = () => {
    info("⬅️ Tornando alla pagina precedente...", { durata: 1000 });
    onTornaIndietro();
  };

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

  const hasDatiGrafici = datiGraficoPunteggio.length > 0 || datiGraficoErroriTentativi.length > 0;

  return (
    <div className={styles.container}>
      <ContainerNotifiche notifiche={notifiche} />
      
      {mostraBottoneTorna && (
        <div className={styles.topButtonContainer}>
          <button onClick={handleTornaIndietro} className={styles.backButton}>
            ← Torna Indietro
          </button>
        </div>
      )}
        
      <div className={styles.header}>
        <div className={styles.headerCenter}>
          <h1>{titolo}</h1>
          <p><strong>Studente: {nomeCompleto}</strong></p>
          {sottotitolo && <p>{sottotitolo}</p>}
        </div>

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

      <div className={styles.content}>
        {cronologia.length === 0 ? (
          <div className={styles.emptyState}>
            <p><strong>Nessun esercizio completato.</strong></p>
            <p>La cronologia apparirà qui una volta che lo studente avrà completato alcuni esercizi.</p>
          </div>
        ) : mostraGrafici ? (
          <GraficiCronologia
            datiGraficoPunteggio={datiGraficoPunteggio}
            datiGraficoErroriTentativi={datiGraficoErroriTentativi}
          />
        ) : (
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
