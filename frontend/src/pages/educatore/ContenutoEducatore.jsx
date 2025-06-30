import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Footer from "../../components/footer/Footer";
import Header from "../../components/header/HeaderEducatore";
import Contenuto from "../../components/educatore/Contenuto/ContenutoStudente";

const ContenutoEducatore = () => {
  const navigate = useNavigate();

  // Gestisce il ritorno alla home educatore
  const handleTornaIndietro = () => {
    sessionStorage.removeItem("studenteSelezionato");
    navigate("/home-educatore");
  };

  // Listener per evento di ritorno alla lista studenti
  useEffect(() => {
    const handleBackEvent = () => {
      handleTornaIndietro();
    };

    window.addEventListener("backToStudenti", handleBackEvent);

    // Cleanup del listener
    return () => {
      window.removeEventListener("backToStudenti", handleBackEvent);
    };
  }, []);

  return (
    <>
      <Header />
      <Contenuto />
      <Footer />
    </>
  );
};

export default ContenutoEducatore;
