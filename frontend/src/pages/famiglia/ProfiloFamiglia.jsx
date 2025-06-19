import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from '../ProfilePage.module.css';

const profiloFamilgia = () => {
  const navigate = useNavigate();
  
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [userInfo, setUserInfo] = useState({
    cognome_famiglia: '',
    email: '',
    numero_telefono: '',
    email_studente: ''
  });

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const token = localStorage.getItem('token');
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
      }
    };

    loadProfile();
  }, []);

  const handleEdit = () => {
    setIsEditing(!isEditing);
  };

  const handleSave = async () => {
    try {
      const token = localStorage.getItem('token');
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
      alert('Profilo salvato con successo!');
    } catch (error) {
      console.error('Errore salvataggio:', error);
      alert(`Errore nel salvataggio: ${error.message}`);
    }
  };

  const handleInputChange = (field, value) => {
    setUserInfo(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleDeleteProfile = () => {
    setShowDeleteConfirm(true);
  };

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
        const errorData = await response.json();
        console.error('Errore dal server:', errorData);
        throw new Error(errorData.error || 'Errore nell\'eliminazione');
      }

      const result = await response.json();
      console.log('Eliminazione completata:', result);

      setShowDeleteConfirm(false);
      
      // Logout completo
      localStorage.removeItem('token');
      localStorage.removeItem('ruolo');
      
      alert('Profilo famiglia eliminato con successo!');
      navigate('/');
    } catch (error) {
      console.error('Errore eliminazione profilo:', error);
      alert(`Errore nell'eliminazione del profilo: ${error.message}`);
      setShowDeleteConfirm(false);
    }
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
  };

  return (
    <div className={styles.profileContainer}>
      <div className={styles.profileContent}>
        <div className={styles.infoBlock}>
          <div className={styles.blockHeader}>
            <h2 className={styles.blockTitle}>Profilo Famiglia</h2>
            <button onClick={handleEdit} className={styles.editBtn}>
              {isEditing ? 'Annulla' : 'Modifica'}
            </button>
          </div>

          <div className={styles.infoGrid}>
            {/* Cognome Famiglia */}
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

            {/* Email - SEMPRE READONLY */}
            <div className={styles.singleRow}>
              <div className={styles.infoItem}>
                <label>Email</label>
                <div className={styles.infoValue}>{userInfo.email}</div>
                {isEditing && (
                  <small className={styles.emailNote}>L'email non può essere modificata</small>
                )}
              </div>
            </div>

            {/* Numero Telefono */}
            <div className={styles.singleRow}>
              <div className={styles.infoItem}>
                <label>Numero di Telefono</label>
                {isEditing ? (
                  <input
                    type="tel"
                    value={userInfo.numero_telefono}
                    onChange={(e) => handleInputChange('numero_telefono', e.target.value)}
                    className={styles.inputField}
                    placeholder="es. 333 123 4567"
                  />
                ) : (
                  <div className={styles.infoValue}>{userInfo.numero_telefono}</div>
                )}
              </div>
            </div>

            {/* Email Studente */}
            <div className={styles.singleRow}>
              <div className={styles.infoItem}>
                <label>Email Studente</label>
                {isEditing ? (
                  <input
                    type="email"
                    value={userInfo.email_studente}
                    onChange={(e) => handleInputChange('email_studente', e.target.value)}
                    className={styles.inputField}
                    placeholder="es. studente@email.com"
                  />
                ) : (
                  <div className={styles.infoValue}>{userInfo.email_studente}</div>
                )}
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
        </div>
      </div>

      {/* Finestra di conferma eliminazione */}
      {showDeleteConfirm && (
        <div className={styles.confirmOverlay}>
          <div className={styles.confirmDialog}>
            <h3>⚠️ Conferma Eliminazione</h3>
            <p>Sei sicuro di voler eliminare il profilo famiglia?</p>
            <div className={styles.warningBox}>
              <p><strong>ATTENZIONE:</strong></p>
              <p>Questa operazione è <strong>irreversibile</strong>.</p>
            </div>
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
    </div>
  );
};

export default profiloFamilgia;
