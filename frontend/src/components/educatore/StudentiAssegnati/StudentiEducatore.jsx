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
    studenti, // Array degli studenti assegnati all'educatore
    emailNuovoStudente,  // Valore corrente del campo email per nuovo studente
    loading, // Stato di caricamento iniziale
    adding, // Stato di aggiunta nuovo studente in corso
    notifiche, // Ricevi le notifiche
    
    setEmailNuovoStudente, // Funzione per aggiornare l'email del nuovo studente
    
    // Azioni
    handleAggiungiStudente, // Gestisce l'aggiunta di un nuovo studente
    handleEliminaStudente, // Gestisce l'eliminazione di uno studente
    handleVisualizzaContenuti, // Naviga alla pagina contenuti dello studente
    handleVisualizzaCronologia // Naviga alla cronologia dello studente
  } = useStudentiEducatore();

  if (loading) {
    return (
      <>
      {/* Spinner con messaggio descrittivo */}
        <CaricamentoSpinner messaggio="Caricamento studenti..." />
        {/* Notifiche sempre visibili anche durante il caricamento */}
        <ContainerNotifiche notifiche={notifiche} />
      </>
    );
  }

  return (
    <div className={styles.container}>
      {/* Container delle notifiche */}
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
          studenti={studenti} //dati degli studenti
          onVisualizzaContenuti={handleVisualizzaContenuti} //richiamo dei contenuti
          onVisualizzaCronologia={handleVisualizzaCronologia} //richiamo della cronologia
          onEliminaStudente={handleEliminaStudente} //richiamo per l'eliminazione
        />
      </div>
    </div>
  );
};

export default StudentiEducatore;
