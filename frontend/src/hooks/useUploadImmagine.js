import { useState } from 'react';
import { useFeedback } from './useFeedback';
import { serviziContenuti } from '../servizi/api/serviziContenuti';
//Custom hook per la gestione dell'upload di immagini
export const useUploadImmagine = (setFormData) => {
  //Stati per gestire il processo completo di upload immagini
  const [selectedFile, setSelectedFile] = useState(null);// File selezionato dall'utente
  const [uploadingImage, setUploadingImage] = useState(false);// Flag upload in corso
  const [previewUrl, setPreviewUrl] = useState(null); // URL per anteprima immagine
//Hook per gestire notifiche e feedback utente
  const { successo, errore } = useFeedback();
// Gestisce la selezione di un file immagine dall'input
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Salva il file selezionato
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target.result);// Data URL per anteprima
      };
      reader.readAsDataURL(file);// Avvia la lettura del file
    }
  };
//Esegue l'upload dell'immagine selezionata al server
  const uploadImage = async () => {
    //Verifica che sia stato selezionato un file
    if (!selectedFile) {
      errore("Seleziona prima un'immagine", { durata: 3000 });
      return;
    }
    setUploadingImage(true);//Imposta stato di caricamento
    try {
      // Chiamata API per upload immagine
      const data = await serviziContenuti.uploadImmagine(selectedFile);
      //aggiorna il form parent con l'URL dell'immagine caricata
      setFormData((prev) => ({
        ...prev,
        immagine: data.imageUrl,
      }));
      // Notifica di successo
      successo("Immagine caricata con successo!", { durata: 4000 });
    } catch (err) {
      console.error("Errore upload:", err);
      errore("Errore upload immagine: " + err.message, { durata: 6000 });
    } finally {
      setUploadingImage(false);// Sempre eseguito: rimuove stato di caricamento
    }
  };

  const resetUpload = () => {
    setSelectedFile(null); // Rimuove file selezionato
    setPreviewUrl(null);// Rimuove anteprima
  };

  return {
    selectedFile, // File attualmente selezionato
    uploadingImage,// Flag upload in corso
    previewUrl, // URL anteprima per visualizzazione
    handleFileSelect,// Gestione selezione file
    uploadImage,// Esecuzione upload
    resetUpload// Reset stato upload
  };
};
