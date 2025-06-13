import React from 'react';

import Footer from '../components/footer/Footer'; // Importa il componente Footer
import Header from '../components/Header/Header'; // Importa il componente Header
import CorpoEsercizioAudio from '../components/esercizi/PronunciationApp';
const EsercizioAudio = () => {
    return (
        <>
            {/* Qui puoi inserire il contenuto della tua homepage, ad esempio: */}
            <Header /> {/* Aggiungi il componente Header qui */}
            <CorpoEsercizioAudio /> 
             {/* Aggiungi il componente PronunciationChecker qui */}
            <Footer /> {/* Aggiungi il componente Footer qui */}
        </>
    );
};

export default EsercizioAudio;