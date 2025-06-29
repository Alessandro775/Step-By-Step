import React from "react";

import Footer from "../../components/footer/Footer"; // Importa il componente Footer
import Header from "../../components/Header/HeaderStudente"; // Importa il componente Header;
import Cronologia from "../../components/studente/CronologiaStudente/CronologiaStudente"; // Importa il componente CronologiaStudentePersonale

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
