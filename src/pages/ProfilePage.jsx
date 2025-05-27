import React from 'react';
import './ProfilePage.modele.css';
import Header from '../components/Header/Header'; // Importa il componente Header

const ProfilePage = () => {
    return (
    <div className="profile-container">
        {/* Aggiungi il componente Header qui */}
        <Header />
        <h1 className="pageTitle">Profilo Utente</h1>
        <div className="profile-content">
            <div className="profile-section">                
                {/* Sezione delle informazioni personali */}
                <h2>Informazioni Personali</h2>
                <div className="profile-info">
                    <p><strong>Nome:</strong></p>
                    <p><strong>Cognome:</strong></p>
                    <p><strong>Email:</strong></p>
                </div>
                
                {/* Bottone Cronologia */}
                <button className="history-button">
                    Cronologia
                </button>
            </div>
        </div>
    </div>
    );

};

export default ProfilePage;