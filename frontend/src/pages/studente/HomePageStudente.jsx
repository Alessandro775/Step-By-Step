import React from 'react';

import Footer from '../../components/footer/Footer'; // Importa il componente Footer
import Header from '../../components/Header/HeaderStudente'; // Importa il componente Header
import CorpoHomePage from '../../components/studente/CorpoHomePage';

const HomePageStudente = () => {
    return (
        <>
            {/* Qui puoi inserire il contenuto della tua homepage, ad esempio: */}
            <Header /> {/* Aggiungi il componente Header qui */}
            <CorpoHomePage/>
            <Footer /> {/* Aggiungi il componente Footer qui */}
        </>
    );
};

export default HomePageStudente;