// hooks/useUploadImmagine.js
import { useState } from 'react';
import { useFeedback } from './useFeedback';
import { serviziContenuti } from '../servizi/api/serviziContenuti';

export const useUploadImmagine = (setFormData) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);

  const { successo, errore } = useFeedback();

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async () => {
    if (!selectedFile) {
      errore("Seleziona prima un'immagine", { durata: 3000 });
      return;
    }

    setUploadingImage(true);
    try {
      const data = await serviziContenuti.uploadImmagine(selectedFile);
      setFormData((prev) => ({
        ...prev,
        immagine: data.imageUrl,
      }));
      successo("Immagine caricata con successo!", { durata: 4000 });
    } catch (err) {
      console.error("Errore upload:", err);
      errore("Errore upload immagine: " + err.message, { durata: 6000 });
    } finally {
      setUploadingImage(false);
    }
  };

  const resetUpload = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
  };

  return {
    selectedFile,
    uploadingImage,
    previewUrl,
    handleFileSelect,
    uploadImage,
    resetUpload
  };
};
