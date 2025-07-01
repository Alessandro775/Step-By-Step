// componenti/educatore/ContenutoStudente/ContenutoStudente.jsx
import React from "react";
import { useContenutoStudente } from "../../../hooks/useContenutoStudente";
import { useGestioneContenutoForm } from "../../../hooks/useGestioneContenutoForm";
import { useUploadImmagine } from "../../../hooks/useUploadImmagine";
import { usaDialogoConferma } from "../../../hooks/usaDialogoConferma";
import FormAggiungiContenuto from "./FormAggiungiContenuto";
import ListaContenuti from "./ListaContenuti";
import CaricamentoSpinner from "../../condivisi/Layout/CaricamentoSpinner";
import MessaggioErrore from "../../condivisi/Layout/MessaggioErrore";
import DialogoConferma from "../../condivisi/Layout/DialogoConferma";
import ContainerNotifiche from "../../condivisi/Layout/ContainerNotifiche";
import styles from "./ContenutoStudente.module.css";

const ContenutoStudente = () => {
  const {
    contenuti, //array dei contenuti assegnati allo studente
    studenteInfo, //informazioni dello studente
    loading, //stato di caricamento per operazioni asincrone
    error, //messaggio di errore
    esercizi, // Lista degli esercizi disponibili per l'assegnazione
    notifiche, // Lista degli esercizi disponibili per l'assegnazione
    setError, // Funzione per impostare messaggi di errore
    fetchContenuti, // Funzione per ricaricare i contenuti
    riassegnaEsercizio, // Funzione per riassegnare un esercizio
    eliminaContenuto // Funzione per eliminare un contenuto
  } = useContenutoStudente();

  const {
    showForm,           // Flag per mostrare/nascondere il form
    setShowForm,        // Funzione per controllare la visibilità del form
    submitting,         // Stato di invio del form
    formData,           // Dati del form corrente
    setFormData,        // Funzione per aggiornare i dati del form
    handleFormChange,   // Handler per i cambiamenti nei campi del form
    resetForm,          // Funzione per resettare il form
    submitContenuto     // Funzione per inviare il form
  } = useGestioneContenutoForm(studenteInfo, fetchContenuti);

  const uploadProps = useUploadImmagine(setFormData);
  
  const { 
    statoDialogo, //stato del dialogo 
    mostraConferma, // mostrare un dialogo di conferma
    gestisciConferma, //conferma dell'azione
    gestisciAnnulla //annullamento dell'azione
  } = usaDialogoConferma();

  const handleRiassegnaEsercizio = async (idEsercizioAssegnato, testo) => {
    //mostra dialogo con dettagli precisi
    const conferma = await mostraConferma({
      titolo: "Conferma Riassegnazione",
      messaggio: `Sei sicuro di voler riassegnare l'esercizio "${testo}"?\n\nQuesto creerà una nuova copia dell'esercizio per lo studente.`,
      testoConferma: "Riassegna",
      testoAnnulla: "Annulla",
      variante: "default"
    });
//procedere solo se l'utente da conferma
    if (conferma) {
      await riassegnaEsercizio(idEsercizioAssegnato, testo);
    }
  };

  const handleEliminaContenuto = async (idEsercizioAssegnato, titolo) => {
    //dialogo di conferma sulle azioni
    const conferma = await mostraConferma({
      titolo: "Conferma Eliminazione",
      messaggio: `Sei sicuro di voler eliminare il contenuto "${titolo}"?\n\nQuesta azione non può essere annullata.`,
      testoConferma: "Elimina",
      testoAnnulla: "Annulla",
      variante: "pericolo"
    });
//procedere solo se l'utente conferma
    if (conferma) {
      await eliminaContenuto(idEsercizioAssegnato, titolo);
    }
  };

  const handleSubmitForm = async (e) => {
    await submitContenuto(e);
  };
// gestire l'annullamento del form di aggiunta contenuto
  const handleCancelForm = () => {
    resetForm();//pulisce e ripristina il form al suo stato iniziale.
  };
//mostrare spinner durante il caricamento iniziale
  if (loading) {
    return <CaricamentoSpinner messaggio="Caricamento contenuti..." />;
  }

  return (
    <div className={styles.container}>
      {/*titolo dinamico con il nome dello  studente*/}
      <div className={styles.header}>
        <h1 className={styles.title}>
          Contenuti per {studenteInfo?.nome} {studenteInfo?.cognome}
        </h1>
        {/*pulsante per aggiungere un nuovo contenuto*/}
        <button
          onClick={() => setShowForm(true)}
          className={styles.addButton}
          disabled={showForm}
        >
          + Aggiungi Contenuto
        </button>
      </div>
{/*mostra il messaggio di errore se presente*/}
      {error && (
        <MessaggioErrore
          titolo="Errore"
          messaggio={error}
          mostraBottoneTorna={false}
          onTornaIndietro={() => setError(null)}
        />
      )}
{/*gestione di aggiunta contenuto con tutti i campi*/}
      {showForm && (
        <FormAggiungiContenuto
          formData={formData}
          esercizi={esercizi}
          submitting={submitting}
          onFormChange={handleFormChange}
          onSubmit={handleSubmitForm}
          onCancel={handleCancelForm}
          uploadProps={uploadProps}
        />
      )}

      <ListaContenuti
        contenuti={contenuti}
        onRiassegna={handleRiassegnaEsercizio} //riassegna
        onElimina={handleEliminaContenuto} //elimina
      />

      {/* Dialogo di conferma */}
      <DialogoConferma
        aperto={statoDialogo.aperto}
        titolo={statoDialogo.titolo}
        messaggio={statoDialogo.messaggio}
        testoConferma={statoDialogo.testoConferma}
        testoAnnulla={statoDialogo.testoAnnulla}
        variante={statoDialogo.variante}
        onConferma={gestisciConferma}
        onAnnulla={gestisciAnnulla}
        onChiudi={gestisciAnnulla}
      />

      {/* Container per le notifiche */}
      <ContainerNotifiche notifiche={notifiche} />
    </div>
  );
};

export default ContenutoStudente;
