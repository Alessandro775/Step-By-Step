import React from "react";
import { formattatoreDate } from "../../../servizi/utilità/utilitaFormattaData.js";
import styles from "./ListaContenuti.module.css";

const ListaContenuti = ({ contenuti, onRiassegna, onElimina }) => {
  console.log("📋 ListaContenuti - Props ricevute:", {
    contenuti: contenuti?.length || 0, //array dai cotenuti da visualizzare
    onRiassegna: typeof onRiassegna, //funzione per gestire la riassegnazione
    onElimina: typeof onElimina //funzione per gestire la comunicazione
  });

  if (contenuti.length === 0) {
    //quando non ci sono contenuti
    return (
      <div className={styles.emptyState}>
        <div className={styles.emptyIcon}>📚</div>
        <h3>Nessun contenuto assegnato</h3>
        <p>Inizia aggiungendo il primo contenuto per questo studente</p>
      </div>
    );
  }

  const handleRiassegna = (idEsercizioAssegnato, titolo) => {
    console.log("🔄 Button Riassegna clicked:", { idEsercizioAssegnato, titolo });
    //verifica la presenza della funzione prima di chiamare
    if (onRiassegna) {
      onRiassegna(idEsercizioAssegnato, titolo);
    } else {
      console.error("❌ onRiassegna function not provided");
    }
  };

  const handleElimina = (idEsercizioAssegnato, titolo) => {
    console.log("🗑️ Button Elimina clicked:", { idEsercizioAssegnato, titolo });
    if (onElimina) {
      onElimina(idEsercizioAssegnato, titolo);
    } else {
      console.error("❌ onElimina function not provided");
    }
  };

  return (
    <div className={styles.container}>
       {/* Titolo con conteggio dinamico dei contenuti */}
      <h2 className={styles.title}>Contenuti Assegnati ({contenuti.length})</h2>
      {/*griglia dei contenuti*/}
      <div className={styles.grid}>
        {contenuti.map((contenuto) => {
          console.log("📄 Rendering contenuto:", contenuto);
          
          return (
            <div key={contenuto.idEsercizioAssegnato} className={styles.card}>
              <div className={styles.cardHeader}>
                <div className={styles.headerContent}>
                  <h3 className={styles.cardTitle}>
                    {contenuto.titolo || contenuto.testo || "Senza titolo"}
                  </h3>
                </div>
                {/*azioni della card*/}
                <div className={styles.cardActions}>
                  {/* Pulsante Riassegna */}
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleRiassegna(
                        contenuto.idEsercizioAssegnato, 
                        contenuto.titolo || contenuto.testo
                      );
                    }}
                    className={styles.actionButton}
                    title="Riassegna esercizio"
                    type="button"
                  >
                    🔄
                  </button>
                  {/* Pulsante Elimina */}
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleElimina(
                        contenuto.idEsercizioAssegnato, 
                        contenuto.titolo || contenuto.testo
                      );
                    }}
                    className={`${styles.actionButton} ${styles.deleteButton}`}
                    title="Elimina contenuto"
                    type="button"
                  >
                    🗑️
                  </button>
                </div>
              </div>
          {/*corpo della card*/}
              <div className={styles.cardBody}>
                {contenuto.immagine && (
                  <div className={styles.imageContainer}>
                    <img
                      src={contenuto.immagine}
                      alt={contenuto.titolo || contenuto.testo}
                      className={styles.image}
                      onError={(e) => {
                         // Nasconde immagine se fallisce il caricamento
                        e.target.style.display = 'none';
                      }}
                    />
                  </div>
                )}
              {/*selezione metadata*/}
                <div className={styles.metadata}>
                  <div className={styles.metaItem}>
                    <span className={styles.metaLabel}>📅 Assegnato:</span>
                    <span className={styles.metaValue}>
                      {formattatoreDate.formatDateItalian(
                        contenuto.data_inizio || contenuto.dataAssegnazione
                      )}
                    </span>
                    {/* Badge "Oggi" se assegnato oggi */}
                    {formattatoreDate.isAssegnatoOggi(
                      contenuto.data_inizio || contenuto.dataAssegnazione
                    ) && (
                      <span className={styles.badge}>Oggi</span>
                    )}
                  </div>
                   {/*stato completamento*/}
                  <div className={styles.metaItem}>
                    <span className={styles.metaLabel}>📋 Stato:</span>
                    <span className={`${styles.status} ${
                      contenuto.completato ? styles.completed : styles.pending
                    }`}>
                      {contenuto.completato ? "✅ Completato" : "⏳ In attesa"}
                    </span>
                  </div>
                {/*tipo esercizio, renderizzato solo se presente*/}
                  {contenuto.tipologia && (
                    <div className={styles.metaItem}>
                      <span className={styles.metaLabel}>🎯 Tipo Esercizio:</span>
                      <span className={styles.tipoEsercizio}>
                        {contenuto.tipologia}
                      </span>
                    </div>
                  )}
                  {/*descrizione renderizzato solo se presente*/}
                  {contenuto.descrizione && (
                    <div className={styles.metaItem}>
                      <span className={styles.metaLabel}>📖 Descrizione:</span>
                      <span className={styles.descrizioneValue}>
                        {contenuto.descrizione}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ListaContenuti;
