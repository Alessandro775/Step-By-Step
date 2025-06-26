import React, { useState, useEffect } from "react";
import TabellaCronologia from "./TabellaCronologia";
import GraficiCronologia from "./GraficiCronologia";
import { utilitaApiDati } from "../../../servizi/api/utilitaApiDati";
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
  const [error, setError] = useState(null);
  const [mostraGrafici, setMostraGrafici] = useState(false);
  const [datiGraficoPunteggio, setDatiGraficoPunteggio] = useState([]);
  const [datiGraficoErroriTentativi, setDatiGraficoErroriTentativi] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const token = localStorage.getItem("token");
        if (!token) {
          throw new Error("Token mancante");
        }

        console.log("🔗 Chiamando API:", `http://localhost:3000/api/${apiEndpoint}`);

        const response = await fetch(`http://localhost:3000/api/${apiEndpoint}`, {
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        });

        console.log("📡 Status:", response.status);

        if (!response.ok) {
          throw new Error(`Errore ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        console.log("✅ Dati ricevuti:", data);

        if (data.studente && data.cronologia) {
          console.log("📊 Caso FAMIGLIA rilevato");
          setInfoStudente(data.studente);
          setCronologia(data.cronologia);
          
          const punteggioData = utilitaApiDati.preparaDatiGraficoPunteggio(data.cronologia);
          const erroriData = utilitaApiDati.preparaDatiGraficoErroriTentativi(data.cronologia);
          setDatiGraficoPunteggio(punteggioData);
          setDatiGraficoErroriTentativi(erroriData);
        } 
        else if (Array.isArray(data)) {
          console.log("📊 Caso STUDENTE/EDUCATORE rilevato");
          setCronologia(data);
          
          const punteggioData = utilitaApiDati.preparaDatiGraficoPunteggio(data);
          const erroriData = utilitaApiDati.preparaDatiGraficoErroriTentativi(data);
          setDatiGraficoPunteggio(punteggioData);
          setDatiGraficoErroriTentativi(erroriData);
          
          if (apiEndpoint === 'student-cronologia') {
            console.log("🔄 Caricamento profilo per studente...");
            try {
              const profileResponse = await fetch(`http://localhost:3000/api/student-profile`, {
                headers: { "Authorization": `Bearer ${token}` }
              });
              if (profileResponse.ok) {
                const profileData = await profileResponse.json();
                setInfoStudente(profileData);
                console.log("✅ Profilo studente caricato:", profileData);
              }
            } catch (e) {
              console.warn("⚠️ Profilo non caricabile:", e);
            }
          }
          else if (apiEndpoint.includes('studenti/') && apiEndpoint.includes('/cronologia')) {
            console.log("👨‍🏫 Caso EDUCATORE confermato - Nome passato:", nomeUtente);
            if (nomeUtente) {
              const nomiParts = nomeUtente.trim().split(' ');
              const nome = nomiParts[0] || '';
              const cognome = nomiParts.slice(1).join(' ') || '';
              
              setInfoStudente({ 
                nome: nome, 
                cognome: cognome 
              });
              console.log("✅ Info studente impostata per educatore:", { nome, cognome });
            }
          }
        }

      } catch (err) {
        console.error("❌ ERRORE:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (apiEndpoint) {
      fetchData();
    }
  }, [apiEndpoint, nomeUtente]);

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Caricamento cronologia...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <h2>❌ ERRORE</h2>
        <p><strong>{error}</strong></p>
        <div className={styles.buttonGroup}>
          <button onClick={() => window.location.reload()} className={styles.chartsButton}>
            🔄 Ricarica
          </button>
          {mostraBottoneTorna && (
            <button onClick={onTornaIndietro} className={styles.backButton}>
              ← Torna Indietro
            </button>
          )}
        </div>
      </div>
    );
  }

  const nomeCompleto = infoStudente && infoStudente.nome 
    ? `${infoStudente.nome} ${infoStudente.cognome || ''}`.trim()
    : nomeUtente || 'Utente';

  const hasDatiGrafici = datiGraficoPunteggio.length > 0 || datiGraficoErroriTentativi.length > 0;

  console.log("🎯 Nome finale da mostrare:", nomeCompleto);

  return (
    <div className={styles.container}>
         {mostraBottoneTorna && (
          <div className={styles.topButtonContainer}>
            <button onClick={onTornaIndietro} className={styles.backButton}>
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
              onClick={() => setMostraGrafici(!mostraGrafici)}
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
