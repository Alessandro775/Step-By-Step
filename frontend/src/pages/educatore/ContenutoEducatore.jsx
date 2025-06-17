import React from 'react';

import Footer from '../../components/footer/Footer'; // Importa il componente Footer
import Header from '../../components/Header/HeaderEducatore'; // Importa il componente Header
import Contenuto from '../../components/educatore/ContenutoStudente'; // Importa il componente ContenutoEducatore

const ContenutoEducatore = () => {
    return (
        <>
            {/* Qui puoi inserire il contenuto della tua homepage, ad esempio: */}
            <Header /> {/* Aggiungi il componente Header qui */}
            <Contenuto /> {/* Aggiungi il componente ContenutoEducatore qui */}
            <Footer /> {/* Aggiungi il componente Footer qui */}
        </>
    );
};

export default ContenutoEducatore;