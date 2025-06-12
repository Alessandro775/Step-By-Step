import React, { useState } from 'react';
import styles from '../ProfilePage.module.css';
import Header from '../../components/Header/HeaderStudente';
import Footer from '../../components/footer/Footer';

const ProfilePage = () => {
    // State per gestire la modalità di modifica
    const [isEditing, setIsEditing] = useState(false);
    
    // State per memorizzare le informazioni dell'utente (rimossa città)
    const [userInfo, setUserInfo] = useState({
        nome: 'Mario',
        cognome: 'Rossi',
        email: 'mario.rossi@email.com',
        istituto: 'Università Statale di Milano',
        classe: '3A Informatica',
        annoAccademico: '2024/2025'
    });

    // Funzione per attivare/disattivare la modalità modifica
    const handleEdit = () => {
        setIsEditing(!isEditing);
    };

    // Funzione per salvare le modifiche
    const handleSave = () => {
        setIsEditing(false);
        console.log('Dati salvati:', userInfo);
    };

    // Funzione per gestire i cambiamenti negli input
    const handleInputChange = (field, value) => {
        setUserInfo(prev => ({
            ...prev,
            [field]: value
        }));
    };

    // Funzione per gestire il click sulla cronologia
    const handleCronologia = () => {
        console.log('Apertura cronologia utente');
    };

    return (
        <div className={styles.profileContainer}>
            {/* Header della pagina */}
            <Header />
            
            <div style={{ height: 24 }} />
            {/* Contenitore principale delle card */}
            <div className={styles.profileContent}>
                
                {/* BLOCCO 1: Informazioni Personali */}
                <div className={styles.infoBlock}>
                    <div className={styles.blockHeader}>
                        <h2 className={styles.blockTitle}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                            </svg>
                            Informazioni Personali
                        </h2>
                        <button className={styles.editBtn} onClick={handleEdit}>
                            {isEditing ? 'Annulla' : 'Modifica'}
                        </button>
                    </div>
                    
                    <div className={styles.infoGrid}>
                        {/* Nome e Cognome in una riga con spazio */}
                        <div className={styles.nameRow}>
                            <div className={styles.infoItem}>
                                <label>Nome</label>
                                {isEditing ? (
                                    <input 
                                        type="text" 
                                        value={userInfo.nome}
                                        onChange={(e) => handleInputChange('nome', e.target.value)}
                                        className={styles.inputField}
                                        placeholder="Inserisci il tuo nome"
                                    />
                                ) : (
                                    <div className={styles.infoValue}>{userInfo.nome}</div>
                                )}
                            </div>
                            
                            <div className={styles.fieldSpacer}></div>
                            
                            <div className={styles.infoItem}>
                                <label>Cognome</label>
                                {isEditing ? (
                                    <input 
                                        type="text" 
                                        value={userInfo.cognome}
                                        onChange={(e) => handleInputChange('cognome', e.target.value)}
                                        className={styles.inputField}
                                        placeholder="Inserisci il tuo cognome"
                                    />
                                ) : (
                                    <div className={styles.infoValue}>{userInfo.cognome}</div>
                                )}
                            </div>
                        </div>

                        {/* Email da sola in una riga */}
                        <div className={styles.singleRow}>
                            <div className={styles.infoItem}>
                                <label>Email</label>
                                {isEditing ? (
                                    <input 
                                        type="email" 
                                        value={userInfo.email}
                                        onChange={(e) => handleInputChange('email', e.target.value)}
                                        className={styles.inputField}
                                        placeholder="Inserisci la tua email"
                                    />
                                ) : (
                                    <div className={styles.infoValue}>{userInfo.email}</div>
                                )}
                            </div>
                        </div>

                        {/* Istituto da solo in una riga */}
                        <div className={styles.singleRow}>
                            <div className={styles.infoItem}>
                                <label>Istituto</label>
                                {isEditing ? (
                                    <input 
                                        type="text" 
                                        value={userInfo.istituto}
                                        onChange={(e) => handleInputChange('istituto', e.target.value)}
                                        className={styles.inputField}
                                        placeholder="Inserisci il tuo istituto"
                                    />
                                ) : (
                                    <div className={styles.infoValue}>{userInfo.istituto}</div>
                                )}
                            </div>
                        </div>

                        {/* Classe e Anno Accademico in una riga con spazio */}
                        <div className={styles.academicRow}>
                            <div className={styles.infoItem}>
                                <label>Classe</label>
                                {isEditing ? (
                                    <input 
                                        type="text" 
                                        value={userInfo.classe}
                                        onChange={(e) => handleInputChange('classe', e.target.value)}
                                        className={styles.inputField}
                                        placeholder="Inserisci la tua classe"
                                    />
                                ) : (
                                    <div className={styles.infoValue}>{userInfo.classe}</div>
                                )}
                            </div>
                            
                            <div className={styles.fieldSpacer}></div>
                            
                            <div className={styles.infoItem}>
                                <label>Anno Accademico</label>
                                {isEditing ? (
                                    <input 
                                        type="text" 
                                        value={userInfo.annoAccademico}
                                        onChange={(e) => handleInputChange('annoAccademico', e.target.value)}
                                        className={styles.inputField}
                                        placeholder="Es. 2024/2025"
                                    />
                                ) : (
                                    <div className={styles.infoValue}>{userInfo.annoAccademico}</div>
                                )}
                            </div>
                        </div>
                    </div>
                    
                    {/* Sezione bottone salva */}
                    {isEditing && (
                        <div className={styles.saveSection}>
                            <button className={styles.saveBtn} onClick={handleSave}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V5h10v4z"/>
                                </svg>
                                Salva Modifiche
                            </button>
                        </div>
                    )}
                </div>

                {/* BLOCCO 2: Cronologia */}
                <div className={styles.cronologiaBlock}>
                    <h2 className={styles.cronologiaTitle}>
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M13 3c-4.97 0-9 4.03-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42C8.27 19.99 10.51 21 13 21c4.97 0 9-4.03 9-9s-4.03-9-9-9zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z"/>
                        </svg>
                        Cronologia Attività
                    </h2>
                    
                    <p className={styles.cronologiaDescription}>
                        Visualizza gli esercizi svolti
                    </p>
                    
                    <div className={styles.cronologiaButtonContainer}>
                        <button className={styles.cronologiaBtn} onClick={handleCronologia}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M13 3c-4.97 0-9 4.03-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42C8.27 19.99 10.51 21 13 21c4.97 0 9-4.03 9-9s-4.03-9-9-9zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z"/>
                            </svg>
                            Visualizza Cronologia Completa
                        </button>
                    </div>
                </div>
            </div>

            {/* Footer della pagina */}
            <Footer />
        </div>
    );
};

export default ProfilePage;
