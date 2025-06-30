import React from "react";
import Footer from "../../components/footer/Footer";
import Header from "../../components/header/HeaderEducatore"; 
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
