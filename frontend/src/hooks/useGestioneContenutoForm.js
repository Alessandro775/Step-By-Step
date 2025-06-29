import { useState } from 'react';
import { useFeedback } from './useFeedback';
import { serviziContenuti } from '../servizi/api/serviziContenuti';
//Custom hook per la gestione del form di aggiunta contenuti per studenti
export const useGestioneContenutoForm = (studenteInfo, onSuccesso) => {
  //Stati per gestire la visibilità e il comportamento del form
  const [showForm, setShowForm] = useState(false);
  //// Controlla visibilità del form
  const [submitting, setSubmitting] = useState(false);
  // Flag per operazione di invio in corso
  const [formData, setFormData] = useState({
    testo: "",
    immagine: "",
    idEsercizio: "",
  });
//Hook per gestire notifiche e feedback utente
  const { successo, errore, avviso } = useFeedback();
//Gestisce i cambiamenti nei campi del form
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,  // Mantiene i valori esistenti
      [name]: value, // Aggiorna solo il campo modificato
    }));
  };
//Resetta il form ai valori iniziali e lo nasconde
  const resetForm = () => {
    setFormData({
      testo: "",
      immagine: "",
      idEsercizio: "",
    });
     // Nasconde il form
    setShowForm(false);
  };
// Gestisce l'invio del form con validazione e chiamata API
  const submitContenuto = async (e) => {
    e.preventDefault();
//verifica che i campi obbligatori siano compilati
    if (!formData.testo || !formData.idEsercizio) {
      avviso("Compila tutti i campi obbligatori", { durata: 3000 });
      return;
    }

    setSubmitting(true);// Imposta stato di caricamento
    try {
      // Chiamata API per aggiungere il contenuto
      const result = await serviziContenuti.aggiungiContenuto(studenteInfo.id, formData);
      //Gestisce diversi tipi di risposta dal server
      if (result.riassegnazione) {
        avviso(`✅ ${result.message}\n\n⚠️ Nota: Questo esercizio era già stato assegnato in precedenza.`, { durata: 8000 });
      } else {
        successo(`✅ ${result.message}`, { durata: 5000 });// Durata maggiore per messaggi importanti
      }
      
      resetForm(); // Pulisce e nasconde il form
      await onSuccesso(studenteInfo.id);// Callback per aggiornare la vista
    } catch (err) {
      console.error("Errore submit:", err);
       // Notifica errore all'utente con messaggio dettagliato
      errore("Errore nell'aggiunta del contenuto: " + err.message, { durata: 8000 });
    } finally {
      setSubmitting(false);
    }
  };
//Restituisce l'interfaccia pubblica del hook
  return {
    showForm,
    setShowForm,
    submitting,
    formData,
    setFormData,
    handleFormChange,
    resetForm,
    submitContenuto
  };
};
