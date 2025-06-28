// hooks/useGestioneContenutoForm.js
import { useState } from 'react';
import { useFeedback } from './useFeedback';
import { serviziContenuti } from '../servizi/api/serviziContenuti';

export const useGestioneContenutoForm = (studenteInfo, onSuccesso) => {
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    testo: "",
    immagine: "",
    idEsercizio: "",
  });

  const { successo, errore, avviso } = useFeedback();

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const resetForm = () => {
    setFormData({
      testo: "",
      immagine: "",
      idEsercizio: "",
    });
    setShowForm(false);
  };

  const submitContenuto = async (e) => {
    e.preventDefault();

    if (!formData.testo || !formData.idEsercizio) {
      avviso("Compila tutti i campi obbligatori", { durata: 3000 });
      return;
    }

    setSubmitting(true);
    try {
      const result = await serviziContenuti.aggiungiContenuto(studenteInfo.id, formData);
      
      if (result.riassegnazione) {
        avviso(`✅ ${result.message}\n\n⚠️ Nota: Questo esercizio era già stato assegnato in precedenza.`, { durata: 8000 });
      } else {
        successo(`✅ ${result.message}`, { durata: 5000 });
      }
      
      resetForm();
      await onSuccesso(studenteInfo.id);
    } catch (err) {
      console.error("Errore submit:", err);
      errore("Errore nell'aggiunta del contenuto: " + err.message, { durata: 8000 });
    } finally {
      setSubmitting(false);
    }
  };

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
