import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from '../ProfilePage.module.css';
import Header from '../../components/Header/HeaderStudente';
import Footer from '../../components/footer/Footer';

const ProfilePage = () => {
  const navigate = useNavigate();
  
  // State per gestire la modalità di modifica
  const [isEditing, setIsEditing] = useState(false);
  
  // State per la finestra di conferma eliminazione
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // State per memorizzare le informazioni dello studente
  const [userInfo, setUserInfo] = useState({
    nome: '',
    cognome: '',
    email: '',
    istituto: '',
    classe: '',
    anno_scolastico: ''
  });

  // useEffect per caricare i dati del profilo
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }

        const response = await fetch('http://localhost:3000/api/student-profile', {
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
      }
    };

    loadProfile();
  }, [navigate]);

  // Funzione per attivare/disattivare la modalità modifica
  const handleEdit = () => {
    setIsEditing(!isEditing);
  };

// Funzione per gestire i cambiamenti negli input
const handleInputChange = (field, value) => {
  // Previeni la modifica dell'email
  if (field === 'email') {
    console.warn('L\'email non può essere modificata');
    return;
  }
  
  setUserInfo(prev => ({
    ...prev,
    [field]: value
  }));
};

  // Funzione per salvare le modifiche
// Funzione per salvare le modifiche
const handleSave = async () => {
  try {
    // Validazione locale prima dell'invio
    if (!userInfo.nome || !userInfo.cognome || !userInfo.istituto || 
        !userInfo.classe || !userInfo.anno_scolastico) {
      alert('Tutti i campi sono obbligatori');
      return;
    }

    // Validazione specifica per la classe
    const classiValide = ['1', '2', '3', '4', '5'];
    if (!classiValide.includes(userInfo.classe)) {
      alert('Seleziona una classe valida (1-5)');
      return;
    }

    const token = localStorage.getItem('token');
    
    // Invia solo i campi modificabili (ESCLUDI L'EMAIL)
    const updateData = {
      nome: userInfo.nome,
      cognome: userInfo.cognome,
      istituto: userInfo.istituto,
      classe: userInfo.classe,
      anno_scolastico: userInfo.anno_scolastico
    };

    const response = await fetch('http://localhost:3000/api/student-profile', {
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


  // Funzione per gestire il click sulla cronologia
  const handleCronologia = () => {
    console.log('Apertura cronologia utente');
  };

  // Funzione per mostrare la conferma di eliminazione
  const handleDeleteProfile = () => {
    setShowDeleteConfirm(true);
  };

// Funzione per confermare l'eliminazione
const confirmDelete = async () => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch('http://localhost:3000/api/student-profile', {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Errore nell\'eliminazione');
    }

    setShowDeleteConfirm(false);
    
    // Effettua il logout
    localStorage.removeItem('token');
    localStorage.removeItem('ruolo');
    
    // Redirect alla home
    navigate('/');
  } catch (error) {
    console.error('Errore eliminazione profilo:', error);
    alert('Errore durante l\'eliminazione: ' + error.message);
  }
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

            {/* Riga Email - SEMPRE IN SOLA LETTURA */}
<div className={styles.singleRow}>
  <div className={styles.infoItem}>
    <label>Email</label>
    <div className={styles.infoValue}>{userInfo.email}</div>
    {isEditing && (
      <small className={styles.emailNote}>
        L'email non può essere modificata per motivi di sicurezza
      </small>
    )}
  </div>
</div>


            {/* Riga Istituto e Classe */}
            <div className={styles.contactRow}>
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
              
              <div className={styles.fieldSpacer}></div>
  
  <div className={styles.infoItem}>
    <label>Classe</label>
    {isEditing ? (
      <select
        value={userInfo.classe}
        onChange={(e) => handleInputChange('classe', e.target.value)}
        className={styles.inputField}
      >
        <option value="">Seleziona una classe</option>
        <option value="1">1</option>
        <option value="2">2</option>
        <option value="3">3</option>
        <option value="4">4</option>
        <option value="5">5</option>
      </select>
    ) : (
      <div className={styles.infoValue}>{userInfo.classe}</div>
    )}
  </div>
  </div>

            {/* Riga Anno Scolastico - CORREZIONE */}
<div className={styles.singleRow}>
  <div className={styles.infoItem}>
    <label>Anno Scolastico</label>
    {isEditing ? (
      <input
        type="text"
        value={userInfo.anno_scolastico}
        onChange={(e) => handleInputChange('anno_scolastico', e.target.value)}
        className={styles.inputField}
        placeholder="es: 2024"
      />
    ) : (
      <div className={styles.infoValue}>{userInfo.anno_scolastico}</div>
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
            Visualizza tutti gli esercizi che hai completato durante il tuo percorso di apprendimento.
          </p>
          <div className={styles.cronologiaButtonContainer}
           onClick={() => navigate('/cronologia-studente')}>
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

export default ProfilePage;
