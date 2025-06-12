import React, { useState } from 'react';
import styles from './ProfilePage.module.css';
import Header from '../components/Header/Header';
import Footer from '../components/footer/Footer';

const FamilyPage = () => {
    // State per gestire la modalità di modifica
    const [isEditing, setIsEditing] = useState(false);
    
    // State per memorizzare le informazioni della famiglia (rimosso istituto, aggiunti telefono e email studente)
    const [userInfo, setUserInfo] = useState({
        nome: 'Mario',
        cognome: 'Rossi',
        email: 'mario.rossi@email.com',
        telefono: '+39 333 123 4567',
        emailStudente: 'studente@email.com'
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

                        {/* Telefono e Email Studente in una riga con spazio */}
                        <div className={styles.contactRow}>
                            <div className={styles.infoItem}>
                                <label>Telefono</label>
                                {isEditing ? (
                                    <input 
                                        type="tel" 
                                        value={userInfo.telefono}
                                        onChange={(e) => handleInputChange('telefono', e.target.value)}
                                        className={styles.inputField}
                                        placeholder="Inserisci il tuo telefono"
                                    />
                                ) : (
                                    <div className={styles.infoValue}>{userInfo.telefono}</div>
                                )}
                            </div>
                            
                            <div className={styles.fieldSpacer}></div>
                            
                            <div className={styles.infoItem}>
                                <label>Email Studente</label>
                                {isEditing ? (
                                    <input 
                                        type="email" 
                                        value={userInfo.emailStudente}
                                        onChange={(e) => handleInputChange('emailStudente', e.target.value)}
                                        className={styles.inputField}
                                        placeholder="Inserisci l'email dello studente"
                                    />
                                ) : (
                                    <div className={styles.infoValue}>{userInfo.emailStudente}</div>
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
            </div>

            {/* Footer della pagina */}
            <Footer />
        </div>
    );
};

export default FamilyPage;
