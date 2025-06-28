import React from 'react';
import Footer from '../../components/footer/Footer'; // Importa il componente Footer
import Header from '../../components/Header/HeaderEducatore'; // Importa il componente Header
import Studenti from '../../components/educatore/StudentiAssegnati/StudentiEducatore'; 

const StudentiEducatore = () => {
    return (
        <>
            {/* Qui puoi inserire il contenuto della tua homepage, ad esempio: */}
            <Header /> {/* Aggiungi il componente Header qui */}
            <Studenti/>
            <Footer /> {/* Aggiungi il componente Footer qui */}
        </>
    );
};

export default StudentiEducatore;