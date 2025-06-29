import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Footer from "../../components/footer/Footer";
import Header from "../../components/Header/HeaderEducatore";
import Cronologia from "../../components/educatore/Cronologia/CronologiaEducatore";

const CronologiaEducatore = () => {
  const navigate = useNavigate();
  const [studenteSelezionato, setStudenteSelezionato] = useState(null);

  // Recupera i dati dello studente dal sessionStorage
  useEffect(() => {
    const studenteData = sessionStorage.getItem("studenteSelezionato");
    if (studenteData) {
      const parsedData = JSON.parse(studenteData);
      setStudenteSelezionato(parsedData);
    }
  }, []);

  // Funzione per tornare alla lista studenti
  const handleTornaIndietro = () => {
    sessionStorage.removeItem("studenteSelezionato");
    navigate("/home-educatore");
  };

  return (
    <>
      <Header />
      <Cronologia
        studenteSelezionato={studenteSelezionato}
        onTornaIndietro={handleTornaIndietro}
      />
      <Footer />
    </>
  );
};

export default CronologiaEducatore;
