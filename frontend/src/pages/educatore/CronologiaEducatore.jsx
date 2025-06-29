import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Footer from "../../components/footer/Footer";
import Header from "../../components/header/HeaderEducatore";
import Cronologia from "../../components/educatore/Cronologia/CronologiaEducatore";

const CronologiaEducatore = () => {
  // Hook per la navigazione tra le pagine
  const navigate = useNavigate();
  // State per memorizzare i dati dello studente selezionato
  const [studenteSelezionato, setStudenteSelezionato] = useState(null);

  useEffect(() => {
    // Recupera i dati dello studente dal sessionStorage
    const studenteData = sessionStorage.getItem("studenteSelezionato");
    // Se esistono dati salvati, li converte da JSON e aggiorna lo state
    if (studenteData) {
      const parsedData = JSON.parse(studenteData);
      setStudenteSelezionato(parsedData);
    }
  }, []);

  // Funzione per tornare alla lista studenti
  const handleTornaIndietro = () => {
    // Rimuove i dati dello studente selezionato dal sessionStorage
    sessionStorage.removeItem("studenteSelezionato");
    // Naviga alla pagina home dell'educatore
    navigate("/home-educatore");
  };

  return (
    <>
      <Header />  {/* Header specifico per l'educatore */}
      {/* Componente principale per la visualizzazione della cronologia */}
      <Cronologia  
        onTornaIndietro={handleTornaIndietro}
      />
      <Footer /> {/* Footer della pagina */} 
    </>
  );
};

export default CronologiaEducatore;
