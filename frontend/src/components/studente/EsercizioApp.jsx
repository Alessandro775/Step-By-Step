// EsercizioApp.jsx
import React, { useState } from 'react';
import HomeEsercizi from './HomeEsercizi';
import CorpoEsercizioAudio from './CorpoEsercizioAudio';

const EsercizioApp = () => {
    const [currentView, setCurrentView] = useState('home');
    const [esercizioCorrente, setEsercizioCorrente] = useState(null);

    const handleStartEsercizio = (esercizio) => {
        console.log('Avvio esercizio:', esercizio);
        setEsercizioCorrente(esercizio);
        setCurrentView('esercizio');
    };

    const handleEsercizioCompletato = () => {
        console.log('Esercizio completato, torno alla home');
        setEsercizioCorrente(null);
        setCurrentView('home');
    };

    const handleTornaHome = () => {
        console.log('Torno alla home');
        setEsercizioCorrente(null);
        setCurrentView('home');
    };

    return (
        <div>
            {currentView === 'home' && (
                <HomeEsercizi onStartEsercizio={handleStartEsercizio} />
            )}
            
            {currentView === 'esercizio' && esercizioCorrente && (
                <CorpoEsercizioAudio 
                    esercizio={esercizioCorrente}
                    onEsercizioCompletato={handleEsercizioCompletato}
                    onTornaHome={handleTornaHome}
                />
            )}
        </div>
    );
};

export default EsercizioApp;
