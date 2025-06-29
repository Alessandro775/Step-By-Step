import React from "react";
import Footer from "../../components/footer/Footer"; // Importa il componente Footer
import Header from "../../components/Header/HeaderEducatore"; // Importa il componente Header
import Studenti from "../../components/educatore/StudentiAssegnati/StudentiEducatore";

const StudentiEducatore = () => {
  return (
    <>
      {/*componenti richiamati*/}
      <Header /> {/*componente Header  */}
      <Studenti />
      <Footer /> {/*componente Footer  */}
    </>
  );
};

export default StudentiEducatore;
