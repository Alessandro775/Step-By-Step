import React from "react";
import { useStudentiEducatore } from "../../../hooks/useStudentiEducatore";
import CaricamentoSpinner from "../../condivisi/Layout/CaricamentoSpinner";
import ContainerNotifiche from "../../condivisi/Layout/ContainerNotifiche";
import FormAggiungiStudente from "./FormAggiungiStudente";
import TabellaStudenti from "./TabellaStudenti";
import styles from "./StudentiEducatore.module.css";

const StudentiEducatore = () => {
  const {
    // Stati
    studenti,
    emailNuovoStudente,
    loading,
    adding,
    notifiche, // ✅ Ricevi le notifiche
    
    // Setters
    setEmailNuovoStudente,
    
    // Azioni
    handleAggiungiStudente,
    handleEliminaStudente,
    handleVisualizzaContenuti,
    handleVisualizzaCronologia
  } = useStudentiEducatore();

  if (loading) {
    return (
      <>
        <CaricamentoSpinner messaggio="Caricamento studenti..." />
        <ContainerNotifiche notifiche={notifiche} />
      </>
    );
  }

  return (
    <div className={styles.container}>
      {/* ✅ Container delle notifiche */}
      <ContainerNotifiche notifiche={notifiche} />
      
      {/* Header */}
      <div className={styles.header}>
        <h1>Gestione Studenti</h1>
        <p>Qui puoi gestire gli studenti assegnati al tuo account educatore</p>
      </div>

      {/* Form aggiunta studente */}
      <FormAggiungiStudente
        emailNuovoStudente={emailNuovoStudente}
        setEmailNuovoStudente={setEmailNuovoStudente}
        onSubmit={handleAggiungiStudente}
        adding={adding}
      />

      {/* Lista studenti */}
      <div className={styles.studentsSection}>
        <h2>I Tuoi Studenti ({studenti.length})</h2>
        <div style={{ height: "24px" }}></div>
        
        <TabellaStudenti
          studenti={studenti}
          onVisualizzaContenuti={handleVisualizzaContenuti}
          onVisualizzaCronologia={handleVisualizzaCronologia}
          onEliminaStudente={handleEliminaStudente}
        />
      </div>
    </div>
  );
};

export default StudentiEducatore;
