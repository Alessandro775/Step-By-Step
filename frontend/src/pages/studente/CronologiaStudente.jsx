import React from "react";

import Footer from "../../components/footer/Footer";
import Header from "../../components/header/HeaderStudente"; 
import Cronologia from "../../components/studente/CronologiaStudente/CronologiaStudente"; 
const CronologiaStudente = () => {
  return (
    <>
      <Header /> {/* componente Header*/}
      <Cronologia /> {/*componente CronologiaStudentePersonale */}
      <Footer /> {/*componente Footer*/}
    </>
  );
};

export default CronologiaStudente;
