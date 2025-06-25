import React, { useState, useEffect } from "react";
import TabellaCronologia from "./TabellaCronologia";
import GraficiCronologia from "./GraficiCronologia";
import { utilitaApiDati } from "../../../servizi/api/utilitaApiDati";

const CronologiaBase = ({ 
  apiEndpoint,
  titolo = "Cronologia",
  sottotitolo = "",
  nomeUtente = "", // ✅ AGGIUNTO - per l'educatore
  mostraBottoneTorna = false, // ✅ AGGIUNTO
  onTornaIndietro = () => {}, // ✅ AGGIUNTO
  testoBottoneGrafici = "📊 Mostra Grafici", // ✅ AGGIUNTO
  testoBottoneTabella = "📋 Mostra Tabella", // ✅ AGGIUNTO
  mostraFormatoCompleto = false // ✅ AGGIUNTO
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

        // ✅ GESTIONE CORRETTA DEI DIVERSI FORMATI
        
        // CASO 1: FAMIGLIA - Formato { studente: {...}, cronologia: [...] }
        if (data.studente && data.cronologia) {
          console.log("📊 Caso FAMIGLIA rilevato");
          setInfoStudente(data.studente);
          setCronologia(data.cronologia);
          
          const punteggioData = utilitaApiDati.preparaDatiGraficoPunteggio(data.cronologia);
          const erroriData = utilitaApiDati.preparaDatiGraficoErroriTentativi(data.cronologia);
          setDatiGraficoPunteggio(punteggioData);
          setDatiGraficoErroriTentativi(erroriData);
        } 
        // CASO 2: STUDENTE O EDUCATORE - Formato [...] (solo array)
        else if (Array.isArray(data)) {
          console.log("📊 Caso STUDENTE/EDUCATORE rilevato");
          setCronologia(data);
          
          const punteggioData = utilitaApiDati.preparaDatiGraficoPunteggio(data);
          const erroriData = utilitaApiDati.preparaDatiGraficoErroriTentativi(data);
          setDatiGraficoPunteggio(punteggioData);
          setDatiGraficoErroriTentativi(erroriData);
          
          // ✅ GESTIONE SPECIFICA PER STUDENTE
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
          // ✅ GESTIONE SPECIFICA PER EDUCATORE
          else if (apiEndpoint.includes('studenti/') && apiEndpoint.includes('/cronologia')) {
            console.log("👨‍🏫 Caso EDUCATORE confermato - Nome passato:", nomeUtente);
            // Per l'educatore, usiamo il nomeUtente passato come prop
            if (nomeUtente) {
              // Separa nome e cognome se sono insieme
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
  }, [apiEndpoint, nomeUtente]); // ✅ Aggiungi nomeUtente alle dipendenze

  // Loading
  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <div style={{ 
          width: '40px', height: '40px', 
          border: '4px solid #ddd', borderTop: '4px solid #2e8b57', 
          borderRadius: '50%', margin: '0 auto 1rem',
          animation: 'spin 1s linear infinite'
        }}></div>
        <p>Caricamento cronologia...</p>
      </div>
    );
  }

  // Errore
  if (error) {
    return (
      <div style={{ 
        padding: '2rem', 
        border: '2px solid red', 
        borderRadius: '8px',
        backgroundColor: '#ffe6e6',
        margin: '1rem'
      }}>
        <h2>❌ ERRORE</h2>
        <p><strong>{error}</strong></p>
        <div style={{ marginTop: '1rem' }}>
          <button 
            onClick={() => window.location.reload()}
            style={{ 
              padding: '10px 20px', 
              backgroundColor: '#007bff', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px',
              marginRight: '10px'
            }}
          >
            🔄 Ricarica
          </button>
          {mostraBottoneTorna && (
            <button 
              onClick={onTornaIndietro}
              style={{ 
                padding: '10px 20px', 
                backgroundColor: '#6c757d', 
                color: 'white', 
                border: 'none', 
                borderRadius: '4px'
              }}
            >
              ← Torna Indietro
            </button>
          )}
        </div>
      </div>
    );
  }

  // ✅ LOGICA DEL NOME MIGLIORATA
  const nomeCompleto = infoStudente && infoStudente.nome 
    ? `${infoStudente.nome} ${infoStudente.cognome || ''}`.trim()
    : nomeUtente || 'Utente';

  const hasDatiGrafici = datiGraficoPunteggio.length > 0 || datiGraficoErroriTentativi.length > 0;

  console.log("🎯 Nome finale da mostrare:", nomeCompleto);

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        {mostraBottoneTorna && (
          <button 
            onClick={onTornaIndietro}
            style={{
              backgroundColor: '#6c757d',
              color: 'white',
              padding: '10px 15px',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              marginBottom: '1rem'
            }}
          >
            ← Torna Indietro
          </button>
        )}
        
        <div style={{ textAlign: 'center' }}>
          <h1>{titolo}</h1>
          {sottotitolo && <p style={{ color: '#666', marginBottom: '1rem' }}>{sottotitolo}</p>}
          <div style={{ marginBottom: '1rem' }}>
            <p><strong>Studente: {nomeCompleto}</strong></p>
          </div>
        </div>

        {hasDatiGrafici && (
          <div style={{ textAlign: 'center' }}>
            <button 
              onClick={() => setMostraGrafici(!mostraGrafici)}
              style={{
                backgroundColor: '#2e8b57',
                color: 'white',
                padding: '10px 20px',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              {mostraGrafici ? testoBottoneTabella : testoBottoneGrafici}
            </button>
          </div>
        )}
      </div>

      {/* Contenuto */}
      <div>
        {cronologia.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
            <p><strong>Nessun esercizio completato.</strong></p>
            <p>La cronologia apparirà qui una volta che lo studente avrà completato alcuni esercizi.</p>
          </div>
        ) : mostraGrafici ? (
          <GraficiCronologia
            datiGraficoPunteggio={datiGraficoPunteggio}
            datiGraficoErroriTentativi={datiGraficoErroriTentativi}
            titolo={`Progressi di ${nomeCompleto}`}
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
