import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from '../ProfilePage.module.css';
import Header from '../../components/Header/HeaderFamiglia';
import Footer from '../../components/footer/Footer';

const FamilyPage = () => {
  const navigate = useNavigate();
  
  // State per gestire la modalità di modifica
  const [isEditing, setIsEditing] = useState(false);
  
  // State per la finestra di conferma eliminazione
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // State per memorizzare le informazioni della famiglia (CORRETTO per DB)
  const [userInfo, setUserInfo] = useState({
    cognome_famiglia: '',
    email: '',
    numero_telefono: '',
    email_studente: ''
  });

  // useEffect per caricare i dati del profilo dal database
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }

        const response = await fetch('http://localhost:3000/api/family-profile', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Errore nel caricamento del profilo');
        }

        const profileData = await response.json();
        setUserInfo(profileData);
      } catch (error) {
        console.error('Errore caricamento profilo:', error);
        alert('Errore nel caricamento del profilo: ' + error.message);
      }
    };

    loadProfile();
  }, [navigate]);

  // Funzione per attivare/disattivare la modalità modifica
  const handleEdit = () => {
    setIsEditing(!isEditing);
  };

  // Funzione per salvare le modifiche (IMPLEMENTATA)
  const handleSave = async () => {
    try {
      // Validazione locale
      if (!userInfo.cognome_famiglia || !userInfo.numero_telefono || !userInfo.email_studente) {
        alert('Tutti i campi sono obbligatori');
        return;
      }

      const token = localStorage.getItem('token');
      
      // Invia solo i campi modificabili (ESCLUDI L'EMAIL principale)
      const updateData = {
        cognome_famiglia: userInfo.cognome_famiglia,
        numero_telefono: userInfo.numero_telefono,
        email_studente: userInfo.email_studente
      };

      const response = await fetch('http://localhost:3000/api/family-profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updateData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Errore nel salvataggio');
      }

      setIsEditing(false);
      console.log('Profilo salvato con successo');
    } catch (error) {
      console.error('Errore salvataggio:', error);
      alert('Errore durante il salvataggio: ' + error.message);
    }
  };

  // Funzione per gestire i cambiamenti negli input
  const handleInputChange = (field, value) => {
    setUserInfo(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Funzione per confermare l'eliminazione (IMPLEMENTATA)
  const confirmDelete = async () => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch('http://localhost:3000/api/family-profile', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Errore nell\'eliminazione del profilo');
      }

      // Effettua il logout
      localStorage.removeItem('token');
      localStorage.removeItem('userType');
      localStorage.removeItem('userData');
      
      // Redirect alla home
      navigate('/');
    } catch (error) {
      console.error('Errore eliminazione:', error);
      alert('Errore durante l\'eliminazione: ' + error.message);
    }
    
    setShowDeleteConfirm(false);
  };

  // Funzione per annullare l'eliminazione
  const cancelDelete = () => {
    setShowDeleteConfirm(false);
  };

  // Funzione per mostrare la conferma di eliminazione
  const handleDeleteProfile = () => {
    setShowDeleteConfirm(true);
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
              Informazioni Famiglia
            </h2>
            <button onClick={handleEdit} className={styles.editBtn}>
              {isEditing ? 'Annulla' : 'Modifica'}
            </button>
          </div>

          <div className={styles.infoGrid}>
            {/* Riga Cognome Famiglia */}
            <div className={styles.singleRow}>
              <div className={styles.infoItem}>
                <label>Cognome Famiglia</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={userInfo.cognome_famiglia}
                    onChange={(e) => handleInputChange('cognome_famiglia', e.target.value)}
                    className={styles.inputField}
                  />
                ) : (
                  <div className={styles.infoValue}>{userInfo.cognome_famiglia}</div>
                )}
              </div>
            </div>

            {/* Riga Email (NON MODIFICABILE) */}
            <div className={styles.singleRow}>
              <div className={styles.infoItem}>
                <label>Email</label>
                <div className={styles.infoValue}>{userInfo.email}</div>
                {isEditing && (
                  <small className={styles.helpText}>L'email non può essere modificata</small>
                )}
              </div>
            </div>

            {/* Riga Telefono */}
            <div className={styles.singleRow}>
              <div className={styles.infoItem}>
                <label>Numero Telefono</label>
                {isEditing ? (
                  <input
                    type="tel"
                    value={userInfo.numero_telefono}
                    onChange={(e) => handleInputChange('numero_telefono', e.target.value)}
                    className={styles.inputField}
                  />
                ) : (
                  <div className={styles.infoValue}>{userInfo.numero_telefono}</div>
                )}
              </div>
            </div>

            {/* Riga Email Studente */}
            <div className={styles.singleRow}>
              <div className={styles.infoItem}>
                <label>Email Studente</label>
                {isEditing ? (
                  <input
                    type="email"
                    value={userInfo.email_studente}
                    onChange={(e) => handleInputChange('email_studente', e.target.value)}
                    className={styles.inputField}
                  />
                ) : (
                  <div className={styles.infoValue}>{userInfo.email_studente}</div>
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

export default FamilyPage;