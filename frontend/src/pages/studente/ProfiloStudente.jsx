import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from '../ProfilePage.module.css';

const profiloStudente = () => {
  const navigate = useNavigate();
  
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [userInfo, setUserInfo] = useState({
    nome: '',
    cognome: '',
    email: '',
    istituto: '',
    classe: '',
    anno_scolastico: ''
  });

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const token = localStorage.getItem('token');
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
  }, []);

  const handleEdit = () => {
    setIsEditing(!isEditing);
  };

  const handleSave = async () => {
    try {
      const token = localStorage.getItem('token');
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
      const response = await fetch('http://localhost:3000/api/student-profile', {
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
      localStorage.removeItem('studenteSelezionato');
      
      alert('Profilo studente eliminato con successo!');
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
            <h2 className={styles.blockTitle}>Profilo Studente</h2>
            <button onClick={handleEdit} className={styles.editBtn}>
              {isEditing ? 'Annulla' : 'Modifica'}
            </button>
          </div>

          <div className={styles.infoGrid}>
            {/* Nome e Cognome */}
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

            {/* Istituto */}
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

            {/* Classe e Anno Scolastico */}
            <div className={styles.nameRow}>
              <div className={styles.infoItem}>
                <label>Classe</label>
                {isEditing ? (
                  <select
                    value={userInfo.classe}
                    onChange={(e) => handleInputChange('classe', e.target.value)}
                    className={styles.inputField}
                  >
                    <option value="">Seleziona classe</option>
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
              
              <div className={styles.infoItem}>
                <label>Anno Scolastico</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={userInfo.anno_scolastico}
                    onChange={(e) => handleInputChange('anno_scolastico', e.target.value)}
                    className={styles.inputField}
                    placeholder="es. 2024/2025"
                  />
                ) : (
                  <div className={styles.infoValue}>{userInfo.anno_scolastico}</div>
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
            <p>Sei sicuro di voler eliminare il tuo profilo studente?</p>
            <div className={styles.warningBox}>
              <p><strong>ATTENZIONE:</strong></p>
              <ul>
                <li>Tutti i tuoi esercizi e risultati saranno eliminati</li>
                <li>Le assegnazioni con gli educatori saranno rimosse</li>
                <li>Questa operazione NON può essere annullata</li>
              </ul>
            </div>
            <div className={styles.confirmButtons}>
              <button 
                onClick={confirmDelete}
                className={styles.confirmBtn}
              >
                Sì, Elimina Tutto
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

export default profiloStudente;