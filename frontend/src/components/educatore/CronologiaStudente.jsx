import React, { useState, useEffect } from "react";
import styles from "./CronologiaStudente.module.css";
import Grafici from "../studente/GraficiStudente";

const CronologiaStudente = () => {
  const [cronologia, setCronologia] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [errorsAttemptsData, setErrorsAttemptsData] = useState([]);
  const [showCharts, setShowCharts] = useState(false);
  const [studenteInfo, setStudenteInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);


  
  useEffect(() => {
    const studenteData = sessionStorage.getItem("studenteSelezionato");
    if (studenteData) {
      const parsedData = JSON.parse(studenteData);
      setStudenteInfo(parsedData);
      fetchCronologia(parsedData.id);
    } else {
      setError("Informazioni studente non trovate");
      setLoading(false);
    }
  }, []);

  const prepareChartData = (cronologia) => {
    const sortedData = cronologia
      .filter(
        (record) => record.data_completamento && record.punteggio !== null
      )
      .sort(
        (a, b) =>
          new Date(a.data_completamento) - new Date(b.data_completamento)
      );

    let cumulativeSum = 0;
    let cumulativeCount = 0;

    return sortedData.map((record, index) => {
      cumulativeSum += parseFloat(record.punteggio) || 0;
      cumulativeCount++;

      return {
        esercizio: `Es. ${index + 1}`,
        data: new Date(record.data_completamento).toLocaleDateString("it-IT"),
        punteggioSingolo: record.punteggio || 0,
        punteggioMedioCumulativo:
          Math.round((cumulativeSum / cumulativeCount) * 100) / 100,
        dataCompleta: record.data_completamento,
      };
    });
  };

  // Funzione per preparare i dati per il grafico errori e tentativi
  const prepareErrorsAttemptsData = (cronologia) => {
    return cronologia
      .filter((record) => record.data_completamento)
      .sort(
        (a, b) =>
          new Date(a.data_completamento) - new Date(b.data_completamento)
      )
      .map((record, index) => ({
        esercizio: `Es. ${index + 1}`,
        data: new Date(record.data_completamento).toLocaleDateString("it-IT"),
        errori: parseInt(record.numero_errori) || 0,
        tentativi: parseInt(record.tentativi || record.numero_tentativi) || 0,
        dataCompleta: record.data_completamento,
      }));
  };

  
  const fetchCronologia = async (idStudente) => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem("token");
      console.log("=== FETCH CRONOLOGIA FRONTEND ===");
      console.log("ID Studente:", idStudente);
      console.log("Token presente:", !!token);

      if (!token) {
        throw new Error("Token non presente");
      }

      const response = await fetch(
        `http://localhost:3000/api/studenti/${idStudente}/cronologia`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log("Response status:", response.status);
      console.log("Response ok:", response.ok);

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Errore response:", errorData);
        throw new Error(
          errorData.error || "Errore nel caricamento della cronologia"
        );
      }

      const data = await response.json();
      console.log("Dati ricevuti:", data);
      setCronologia(data);

      
      // Prepara i dati per i grafici
      const chartDataPreparata = prepareChartData(data);
      const errorsAttemptsDataPreparata = prepareErrorsAttemptsData(data);

      setChartData(chartDataPreparata);
      setErrorsAttemptsData(errorsAttemptsDataPreparata);
    } catch (err) {
      console.error("Errore catch:", err);
      setError("Errore nel caricamento della cronologia: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTornaIndietro = () => {
    const event = new CustomEvent("backToStudenti");
    window.dispatchEvent(event);
  };

  const handleToggleCharts = () => {
    setShowCharts(!showCharts);
  };

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
        <h2>Errore</h2>
        <p>{error}</p>
        <button onClick={handleTornaIndietro} className={styles.backButton}>
          Torna Indietro
        </button>
      </div>
    );
  }

  return (
    <>
      {!showCharts ? (
        <div className={styles.container}>
          <div className={styles.header}>
            <h1>Cronologia Studente</h1>
            <div className={styles.studenteInfo}>
              <p>
                Studente: <strong>{studenteInfo?.nome}</strong>
              </p>
            </div>
            <div className={styles.buttonGroup}>
              <button
                onClick={handleTornaIndietro}
                className={styles.backButton}
              >
                Torna Indietro
              </button>

              <button
                onClick={handleToggleCharts}
                className={styles.chartsButton}>                
                Visualizza Grafici
              </button>
            </div>
          </div>

          <div className={styles.content}>
            {cronologia.length === 0 ? (
              <div className={styles.noDataContainer}>
                <h3>Nessuna attività registrata per questo studente</h3>
                <p>
                  Gli esercizi completati appariranno qui una volta che lo
                  studente avrà iniziato a lavorare.
                </p>
              </div>
            ) : (
              <div className={styles.tableContainer}>
                <table className={styles.cronologiaTable}>
                  <thead>
                    <tr>
                      <th>Esercizio</th>
                      <th>Tipo</th>
                      <th>Punteggio</th>
                      <th>Tempo Impiegato</th>
                      <th>Data Completamento</th>
                      <th>Tentativi</th>
                      <th>Errori</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cronologia.map((record, index) => (
                      <tr key={index}>
                        <td>{record.titolo || "N/D"}</td>
                        <td>
                          {record.tipo_esercizio || record.descrizione || "N/D"}
                        </td>
                        <td>
                          {record.punteggio !== null ? record.punteggio : "N/D"}
                        </td>
                        <td>
                          {record.tempo_impiegato || record.tempo || "N/D"}
                        </td>
                        <td>
                          {record.data_completamento
                            ? new Date(
                                record.data_completamento
                              ).toLocaleString("it-IT")
                            : "N/D"}
                        </td>
                        <td>
                          {record.tentativi || record.numero_tentativi || "N/D"}
                        </td>
                        <td>{record.numero_errori || "N/D"}</td>
                      </tr>
                    ))}
                    
                  </tbody>
                </table>
                
              </div>
            )}
          </div>
          
        </div>
      ) : (showCharts && (
        <div>
          <button 
            className={styles.tornaIndietroButton} 
            onClick={handleToggleCharts}
          >
            ← Torna alla cronologia
          </button>
          <Grafici 
            chartData={chartData} 
            errorsAttemptsData={errorsAttemptsData} 
          />
        </div>
      ))}
    </>
  );
};

export default CronologiaStudente;
