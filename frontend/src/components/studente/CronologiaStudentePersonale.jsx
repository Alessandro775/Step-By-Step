import React, { useState, useEffect } from "react";
import Grafici from "./Grafici";
import styles from "./CronologiaStudente.module.css";

const CronologiaStudentePersonale = () => {
  const [cronologia, setCronologia] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [errorsAttemptsData, setErrorsAttemptsData] = useState([]);
  const [showCharts, setShowCharts] = useState(false);

  useEffect(() => {
    fetchCronologia();
  }, []);

  // Funzione per preparare i dati per il grafico del punteggio
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

  const fetchCronologia = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem("token");

      if (!token) {
        throw new Error("Token non presente");
      }

      const response = await fetch(
        "http://localhost:3000/api/student-cronologia",
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || "Errore nel caricamento della cronologia"
        );
      }

      const data = await response.json();
      setCronologia(data);

      // Prepara i dati per i grafici
      const chartDataPreparata = prepareChartData(data);
      const errorsAttemptsDataPreparata = prepareErrorsAttemptsData(data);

      setChartData(chartDataPreparata);
      setErrorsAttemptsData(errorsAttemptsDataPreparata);
    } catch (err) {
      setError("Errore nel caricamento della cronologia: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleCharts = () => {
    setShowCharts(!showCharts);
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <span>Caricamento cronologia...</span>
        </div>
      </div>
    );
  }

 return (
    <div className={styles.container}>
        <div className={styles.header}>
            <div className={styles.headerCenter}>
                <h2>La Mia Cronologia</h2>
                <p>Visualizza i tuoi progressi negli esercizi</p>
            </div>

            <div className={styles.headerRight}>
                {(chartData.length > 0 || errorsAttemptsData.length > 0) && (
                    <button 
                        onClick={handleToggleCharts}
                        className={styles.chartsToggleButton}
                    >
                        📊 {showCharts ? 'Mostra Cronologia' : 'Mostra Grafici'}
                    </button>
                )}
            </div>
        </div>

        {error && (
            <div className={styles.error}>
                {error}
            </div>
        )}

        {/* CONDITIONAL RENDERING - O grafici O cronologia */}
        {showCharts ? (
            // Mostra solo i grafici
            (chartData.length > 0 || errorsAttemptsData.length > 0) && (
                <Grafici
                    chartData={chartData}
                    errorsAttemptsData={errorsAttemptsData}
                />
            )
        ) : (
            // Mostra solo la cronologia
            <div className={styles.contentSection}>
                {cronologia.length === 0 ? (
                    <div className={styles.emptyState}>
                        <p>Non hai ancora completato nessun esercizio</p>
                        <p>I tuoi progressi appariranno qui una volta completati gli esercizi assegnati.</p>
                    </div>
                ) : (
                    <div className={styles.tableContainer}>
                        <table className={styles.table}>
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
                                    <tr key={record.idRisultato || index}>
                                        <td>{record.titolo || 'N/D'}</td>
                                        <td>{record.tipo_esercizio || record.descrizione || 'N/D'}</td>
                                        <td>{record.punteggio !== null ? record.punteggio : 'N/D'}</td>
                                        <td>{record.tempo_impiegato || record.tempo || 'N/D'}</td>
                                        <td>
                                            {record.data_completamento 
                                                ? new Date(record.data_completamento).toLocaleString('it-IT')
                                                : 'N/D'
                                            }
                                        </td>
                                        <td>{record.tentativi || record.numero_tentativi || 'N/D'}</td>
                                        <td>{record.numero_errori || 'N/D'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        )}
    </div>
);

};

export default CronologiaStudentePersonale;
