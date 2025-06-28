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
    contenuti,
    studenteInfo,
    loading,
    error,
    esercizi,
    notifiche,
    setError,
    fetchContenuti,
    riassegnaEsercizio,
    eliminaContenuto
  } = useContenutoStudente();

  const {
    showForm,
    setShowForm,
    submitting,
    formData,
    setFormData,
    handleFormChange,
    resetForm,
    submitContenuto
  } = useGestioneContenutoForm(studenteInfo, fetchContenuti);

  const uploadProps = useUploadImmagine(setFormData);
  
  const { 
    statoDialogo, 
    mostraConferma, 
    gestisciConferma, 
    gestisciAnnulla 
  } = usaDialogoConferma();

  const handleRiassegnaEsercizio = async (idEsercizioAssegnato, testo) => {
    console.log("🔄 Riassegnazione richiesta:", { idEsercizioAssegnato, testo });
    
    const conferma = await mostraConferma({
      titolo: "Conferma Riassegnazione",
      messaggio: `Sei sicuro di voler riassegnare l'esercizio "${testo}"?\n\nQuesto creerà una nuova copia dell'esercizio per lo studente.`,
      testoConferma: "Riassegna",
      testoAnnulla: "Annulla",
      variante: "default"
    });

    if (conferma) {
      await riassegnaEsercizio(idEsercizioAssegnato, testo);
    }
  };

  const handleEliminaContenuto = async (idEsercizioAssegnato, titolo) => {
    console.log("🗑️ Eliminazione richiesta:", { idEsercizioAssegnato, titolo });
    
    const conferma = await mostraConferma({
      titolo: "Conferma Eliminazione",
      messaggio: `Sei sicuro di voler eliminare il contenuto "${titolo}"?\n\nQuesta azione non può essere annullata.`,
      testoConferma: "Elimina",
      testoAnnulla: "Annulla",
      variante: "pericolo"
    });

    if (conferma) {
      await eliminaContenuto(idEsercizioAssegnato, titolo);
    }
  };

  const handleSubmitForm = async (e) => {
    await submitContenuto(e);
  };

  const handleCancelForm = () => {
    resetForm();
  };

  if (loading) {
    return <CaricamentoSpinner messaggio="Caricamento contenuti..." />;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>
          Contenuti per {studenteInfo?.nome} {studenteInfo?.cognome}
        </h1>
        <button
          onClick={() => setShowForm(true)}
          className={styles.addButton}
          disabled={showForm}
        >
          + Aggiungi Contenuto
        </button>
      </div>

      {error && (
        <MessaggioErrore
          titolo="Errore"
          messaggio={error}
          mostraBottoneTorna={false}
          onTornaIndietro={() => setError(null)}
        />
      )}

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
        onRiassegna={handleRiassegnaEsercizio}
        onElimina={handleEliminaContenuto}
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
