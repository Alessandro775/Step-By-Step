import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from '../ProfilePage.module.css';
import Header from '../../components/Header/HeaderEducatore';
import Footer from '../../components/footer/Footer';

const EducatorProfile = () => {
  const navigate = useNavigate();
  
  // State per gestire la modalità di modifica
  const [isEditing, setIsEditing] = useState(false);
  
  // State per la finestra di conferma eliminazione
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // State per memorizzare le informazioni dell'educatore
  const [userInfo, setUserInfo] = useState({
    nome: 'Mario',
    cognome: 'Rossi',
    email: 'mario.rossi@email.com',
    istituto: 'Università Statale di Milano'
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
    console.log('Apertura cronologia educatore');
  };

  // Funzione per mostrare la conferma di eliminazione
  const handleDeleteProfile = () => {
    setShowDeleteConfirm(true);
  };

  // Funzione per confermare l'eliminazione
  const confirmDelete = () => {
    console.log('Profilo eliminato');
    setShowDeleteConfirm(false);
    
    // Effettua il logout
    localStorage.removeItem('authToken');
    localStorage.removeItem('userType');
    localStorage.removeItem('userData');
    
    // Redirect alla home
    navigate('/');
  };

  // Funzione per annullare l'eliminazione
  const cancelDelete = () => {
    setShowDeleteConfirm(false);
  };

  return (
    <div className={styles.profileContainer}>
      <Header />
      
      <div className={styles.profileContent}>
        {/* BLOCCO INFORMAZIONI PERSONALI */}
        <div className={styles.infoBlock}>
          <div className={styles.blockHeader}>
            <h2 className={styles.blockTitle}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
              </svg>
              Informazioni Personali
            </h2>
            <button onClick={handleEdit} className={styles.editBtn}>
              {isEditing ? 'Modifica' : 'Modifica'}
            </button>
          </div>

          <div className={styles.infoGrid}>
            {/* Riga Nome e Cognome */}
            <div className={styles.nameRow}>
              <div className={styles.infoItem}>
                <label>Nome</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={userInfo.nome}
                    onChange={(e) => handleInputChange('nome', e.target.value)}
                    className={styles.inputField}
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
                  />
                ) : (
                  <div className={styles.infoValue}>{userInfo.cognome}</div>
                )}
              </div>
            </div>

            {/* Riga Email */}
            <div className={styles.singleRow}>
              <div className={styles.infoItem}>
                <label>Email</label>
                {isEditing ? (
                  <input
                    type="email"
                    value={userInfo.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className={styles.inputField}
                  />
                ) : (
                  <div className={styles.infoValue}>{userInfo.email}</div>
                )}
              </div>
            </div>

            {/* Riga Istituto */}
            <div className={styles.singleRow}>
              <div className={styles.infoItem}>
                <label>Istituto</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={userInfo.istituto}
                    onChange={(e) => handleInputChange('istituto', e.target.value)}
                    className={styles.inputField}
                  />
                ) : (
                  <div className={styles.infoValue}>{userInfo.istituto}</div>
                )}
              </div>
            </div>

            {/* Pulsante Elimina Profilo */}
            <div className={styles.deleteSection}>
              <button 
                onClick={handleDeleteProfile}
                className={styles.deleteBtn}
              >
                Elimina Profilo
              </button>
            </div>
          </div>

          {/* Sezione salvataggio */}
          {isEditing && (
            <div className={styles.saveSection}>
              <button onClick={handleSave} className={styles.saveBtn}>
                Salva Modifiche
              </button>
            </div>
          )}
        </div>

        {/* BLOCCO CRONOLOGIA */}
        <div className={styles.cronologiaBlock}>
          <h2 className={styles.cronologiaTitle}>
            Cronologia Esercizi
          </h2>
          <p className={styles.cronologiaDescription}>
            Visualizza tutti gli esercizi che sono stati completati durante il percorso di apprendimento.
          </p>
          <div className={styles.cronologiaButtonContainer}>
            <button onClick={handleCronologia} className={styles.cronologiaBtn}>
              Visualizza gli esercizi svolti
            </button>
          </div>
        </div>
      </div>

      {/* Finestra di conferma eliminazione */}
      {showDeleteConfirm && (
        <div className={styles.confirmOverlay}>
          <div className={styles.confirmDialog}>
            <h3>Conferma Eliminazione</h3>
            <p>Sei sicuro di voler eliminare il tuo profilo?</p>
            <div className={styles.confirmButtons}>
              <button 
                onClick={confirmDelete}
                className={styles.confirmBtn}
              >
                Sì, Elimina
              </button>
              <button 
                onClick={cancelDelete}
                className={styles.cancelBtn}
              >
                Annulla
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default EducatorProfile;
