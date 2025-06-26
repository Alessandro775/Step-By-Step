import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './ProfilePageFamiglia.module.css';
import Header from '../../components/Header/HeaderFamiglia';
import Footer from '../../components/footer/Footer';

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
      alert('Profilo famiglia salvato con successo!');
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

  const handleViewCronologia = () => {
    navigate('/cronologia-famiglia');
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
  };

  return (
    <>
      <Header />
      <div className={styles.profileContainer}>
        <div className={styles.profileContent}>
          {/* Blocco di Benvenuto */}
          <div className={styles.welcomeBlock}>
            <div className={styles.welcomeContent}>
              <div className={styles.welcomeIcon}>👨‍👩‍👧‍👦</div>
              <h1 className={styles.welcomeTitle}>
                Benvenuta Famiglia {userInfo.cognome_famiglia}!
              </h1>
              <p className={styles.welcomeText}>
                Gestisci le informazioni della tua famiglia.
              </p>
            </div>
          </div>

          {/* Blocco Informazioni Famiglia */}
          <div className={styles.infoBlock}>
            <div className={styles.blockHeader}>
              <h2 className={styles.blockTitle}>
                Informazioni Famiglia
              </h2>

              <button 
                className={styles.editBtn}
                onClick={handleEdit}
              >
                {isEditing ? 'Annulla' : 'Modifica'}
              </button>
            </div>

            <div className={styles.infoGrid}>
              <div className={styles.nameRow}>
                <div className={styles.infoItem}>
                  <label>
                    Cognome Famiglia
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      className={styles.inputField}
                      value={userInfo.cognome_famiglia}
                      onChange={(e) =>
                        handleInputChange("cognome_famiglia", e.target.value)
                      }
                      placeholder="Inserisci il cognome famiglia"
                    />
                  ) : (
                    <div className={styles.infoValue}>
                      {userInfo.cognome_famiglia || "Non specificato"}
                    </div>
                  )}
                </div>

                <div className={styles.fieldSpacer}></div>

                <div className={styles.infoItem}>
                  <label>
                    Numero Telefono
                  </label>
                  {isEditing ? (
                    <input
                      type="tel"
                      className={styles.inputField}
                      value={userInfo.numero_telefono}
                      onChange={(e) =>
                        handleInputChange("numero_telefono", e.target.value)
                      }
                      placeholder="Inserisci il numero telefono"
                    />
                  ) : (
                    <div className={styles.infoValue}>
                      {userInfo.numero_telefono || "Non specificato"}
                    </div>
                  )}
                </div>
              </div>

              <div className={styles.singleRow}>
                <div className={styles.infoItem}>
                  <label>
                    Email Famiglia
                  </label>
                  <div className={styles.infoValue}>
                    <span className={styles.readonlyBadge}>SOLA LETTURA</span>
                    {userInfo.email || "Non specificata"}
                  </div>
                  <div className={styles.emailNote}>
                    L'email famiglia non può essere modificata per motivi di sicurezza
                  </div>
                </div>
              </div>

              <div className={styles.singleRow}>
                <div className={styles.infoItem}>
                  <label>
                    Email Studente
                  </label>
                  {isEditing ? (
                    <input
                      type="email"
                      className={styles.inputField}
                      value={userInfo.email_studente}
                      onChange={(e) =>
                        handleInputChange("email_studente", e.target.value)
                      }
                      placeholder="Inserisci l'email studente"
                    />
                  ) : (
                    <div className={styles.infoValue}>
                      {userInfo.email_studente || "Non specificata"}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {isEditing && (
              <div className={styles.saveSection}>
                <button 
                  className={styles.saveBtn}
                  onClick={handleSave}
                >
                  Salva Modifiche
                </button>
              </div>
            )}
          </div>

          {/* Zona Pericolosa */}
          <div className={styles.dangerZone}>
            <div className={styles.dangerHeader}>
              <h3>Zona Pericolosa</h3>
              <p>Le azioni in questa sezione sono irreversibili</p>
            </div>

            <button 
              className={styles.deleteBtn}
              onClick={handleDeleteProfile}
            >
              Elimina Profilo
            </button>
          </div>
        </div>
      </div>

      {/* Finestra di Conferma Eliminazione */}
      {showDeleteConfirm && (
        <div className={styles.confirmOverlay}>
          <div className={styles.confirmDialog}>
            <div className={styles.warningIcon}>⚠️</div>
            <h3>Conferma Eliminazione</h3>
            <p>Sei sicuro di voler eliminare il profilo famiglia?</p>

            <div className={styles.warningBox}>
              <div className={styles.warningTitle}>ATTENZIONE:</div>
              <ul className={styles.warningList}>
                <li>• Tutti i dati della famiglia verranno eliminati permanentemente</li>
                <li>• Il collegamento con lo studente sarà perso</li>
                <li>• Non sarà possibile recuperare il profilo</li>
                <li>• Dovrai riregistrarti per utilizzare nuovamente l'applicazione</li>
              </ul>
            </div>

            <div className={styles.confirmButtons}>
              <button className={styles.confirmBtn} onClick={confirmDelete}>
                Sì, Elimina
              </button>

              <button 
                className={styles.cancelBtn}
                onClick={cancelDelete}
              >
                Annulla
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </>
  );
};

export default profiloFamilgia;