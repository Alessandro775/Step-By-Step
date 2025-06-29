
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './ProfiloEducatore.module.css';
import Header from '../../components/header/HeaderEducatore';
import Footer from '../../components/footer/Footer';
import ContainerNotifiche from '../../components/condivisi/Layout/ContainerNotifiche';
import DialogoConferma from '../../components/condivisi/Layout/DialogoConferma';
import { useFeedback } from '../../hooks/useFeedback';
import { usaDialogoConferma } from '../../hooks/usaDialogoConferma';


const ProfiloEducatore = () => {
  // Hook per la navigazione tra le pagine
  const navigate = useNavigate();
   // State per controllare se si è in modalità modifica
  const [isEditing, setIsEditing] = useState(false);
    // State per memorizzare le informazioni dell'utente
  const [userInfo, setUserInfo] = useState({
    nome: "",
    cognome: "",
    email: "",
    istituto: "",
  });

   // Hook personalizzato per gestire le notifiche di feedback (successo, errore, avviso)
  const { notifiche, successo, errore, avviso } = useFeedback();
  
  // Integrazione sistema conferma
  const { 
    statoDialogo, 
    mostraConferma, 
    gestisciConferma, 
    gestisciAnnulla 
  } = usaDialogoConferma();

  // Effettua una chiamata API per caricare le informazioni del profilo al montaggio del componente
  useEffect(() => {
    const loadProfile = async () => {
      try {
         // Recupera il token di autenticazione dal localStorage
        const token = localStorage.getItem("token");
         // Effettua la chiamata API per ottenere i dati del profilo
        const response = await fetch("http://localhost:3000/api/profile", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
         // Verifica se la risposta è stata confermata con successo
        if (!response.ok) {
          throw new Error("Errore nel caricamento del profilo");
        }
         // Converte la risposta in JSON e aggiorna lo state
        const profileData = await response.json();
        setUserInfo(profileData);
      } catch (error) {
        // Gestisce gli errori mostrando una notifica di errore
        console.error('Errore caricamento profilo:', error);
        errore('Errore nel caricamento del profilo', { durata: 6000 });

      }
    };
    // Esegue il caricamento del profilo
    loadProfile();
  }, [errore]);

  //Funzione per attivare/disattivare la modalità di modifica
  const handleEdit = () => {
    setIsEditing(!isEditing);
  };
  // Funzione per salvare le modifiche al profilo
  const handleSave = async () => {
    try {
      // Recupera il token di autenticazione
      const token = localStorage.getItem("token");

      const updateData = {
        nome: userInfo.nome,
        cognome: userInfo.cognome,
        istituto: userInfo.istituto,
      };
      // Effettua una chiamata API per aggiornare le informazioni del profilo
      const response = await fetch("http://localhost:3000/api/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updateData),
      });
    // Verifica se l'aggiornamento è andato a buon fine
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Errore nel salvataggio");
      }

      // Disattiva la modalità modifica e mostra messaggio di successo
      setIsEditing(false);
      successo('Profilo educatore salvato con successo!', { durata: 4000 });
    } catch (error) {
      // Gestisce gli errori di salvataggio
      console.error('Errore salvataggio:', error);
      errore(`Errore nel salvataggio: ${error.message}`, { durata: 6000 });

    }
  };
  // Funzione per gestire le modifiche ai campi di input
  const handleInputChange = (field, value) => {
    setUserInfo((prev) => ({
      ...prev,
      [field]: value,
    }));
  };
  // Funzione per gestire l'eliminazione del profilo
  const handleDeleteProfile = async () => {
    // Mostra un dialogo di conferma prima di procedere con l'eliminazione
    const conferma = await mostraConferma({
      titolo: "Conferma Eliminazione",
      messaggio: "Sei sicuro di voler eliminare il tuo profilo educatore?",
      testoConferma: "Sì, Elimina",
      testoAnnulla: "Annulla",
      variante: "pericolo"
    });
    // Se l'utente conferma, procede con l'eliminazione
    if (conferma) {
      await confirmDelete();
    }
  };
  // Funzione per confermare ed eseguire l'eliminazione del profilo
  const confirmDelete = async () => {
    try {
       // Recupera il token di autenticazione
      const token = localStorage.getItem("token");
      // Effettua una chiamata API per eliminare il profilo
      const response = await fetch("http://localhost:3000/api/profile", {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      // Verifica se l'eliminazione è andata a buon fine
      if (!response.ok) {
        const errorData = await response.json();
        console.error("Errore dal server:", errorData);
        throw new Error(errorData.error || "Errore nell'eliminazione");
      }

      const result = await response.json();

      console.log('Eliminazione completata:', result);

      //Effettua il logout completo rimuovendo i dati dal localStorage
      localStorage.removeItem("token");
      localStorage.removeItem("ruolo");

       // Mostra messaggio di successo
      successo('Profilo educatore eliminato con successo!', { durata: 4000 });
      
      // Ritarda la navigazione per mostrare il messaggio
      setTimeout(() => {
        navigate('/');
      }, 2000);
    } catch (error) {
        // Gestisce gli errori di eliminazione
      console.error('Errore eliminazione profilo:', error);
      errore(`Errore nell'eliminazione del profilo: ${error.message}`, { durata: 8000 });

    }
  };
  // Renderizza il profilo educatore
  return (
    <>
      <Header />
      <div className={styles.profileContainer}>
        <div className={styles.profileContent}>
          {/* Blocco di Benvenuto */}
          <div className={styles.welcomeBlock}>
            <div className={styles.welcomeContent}>
              <div className={styles.welcomeIcon}>👨‍🏫</div>
              <h1 className={styles.welcomeTitle}>
                Benvenuto nel tuo Profilo!
              </h1>
              <p className={styles.welcomeText}>
                Gestisci le tue informazioni personali.
              </p>
            </div>
          </div>

          {/* Blocco Informazioni Personali */}
          <div className={styles.infoBlock}>
            <div className={styles.blockHeader}>
              <h2 className={styles.blockTitle}>Informazioni Personali</h2>
              <button className={styles.editBtn} onClick={handleEdit}>
                {isEditing ? "Annulla" : "Modifica"}
              </button>
            </div>

            <div className={styles.avatarSection}></div>

            <div className={styles.infoGrid}>
              <div className={styles.nameRow}>
                {/* Form per la visualizzazione/modifica del profilo */}
                <div className={styles.infoItem}>
                  <label>Nome</label>
                  {isEditing ? (
                    <input
                      type="text"
                      className={styles.inputField}
                      value={userInfo.nome}
                      onChange={(e) =>
                        handleInputChange("nome", e.target.value)
                      }
                      placeholder="Inserisci il nome"
                    />
                  ) : (
                    <div className={styles.infoValue}>
                      {userInfo.nome || "Non specificato"}
                    </div>
                  )}
                </div>

                <div className={styles.fieldSpacer}></div>

                <div className={styles.infoItem}>
                  <label>Cognome</label>
                  {isEditing ? (
                    <input
                      type="text"
                      className={styles.inputField}
                      value={userInfo.cognome}
                      onChange={(e) =>
                        handleInputChange("cognome", e.target.value)
                      }
                      placeholder="Inserisci il cognome"
                    />
                  ) : (
                    <div className={styles.infoValue}>
                      {userInfo.cognome || "Non specificato"}
                    </div>
                  )}
                </div>
              </div>

              <div className={styles.singleRow}>
                    {/* L'email non è modificabile */}
                <div className={styles.infoItem}>
                  <label>Email</label>
                  <div className={styles.infoValue}>
                    <span className={styles.readonlyBadge}>SOLA LETTURA</span>
                    {userInfo.email || "Non specificata"}
                  </div>
                  <div className={styles.emailNote}>
                    L'email non può essere modificata per motivi di sicurezza
                  </div>
                </div>
              </div>

              <div className={styles.singleRow}>
                <div className={styles.infoItem}>
                  <label>Istituto</label>
                  {isEditing ? (
                    <input
                      type="text"
                      className={styles.inputField}
                      value={userInfo.istituto}
                      onChange={(e) =>
                        handleInputChange("istituto", e.target.value)
                      }
                      placeholder="Inserisci l'istituto"
                    />
                  ) : (
                    <div className={styles.infoValue}>
                      {userInfo.istituto || "Non specificato"}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {isEditing && (
              <div className={styles.saveSection}>
                <button className={styles.saveBtn} onClick={handleSave}>
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
            <button className={styles.deleteBtn} onClick={handleDeleteProfile}>
              Elimina Profilo
            </button>
          </div>
        </div>
      </div>

      {/* Contenitore per le notifiche di feedback */}
      <ContainerNotifiche notifiche={notifiche} />

      {/* Dialogo di conferma per  azioni critiche */}
      <DialogoConferma
        aperto={statoDialogo.aperto}
        titolo={statoDialogo.titolo}
        messaggio={statoDialogo.messaggio}
        testoConferma={statoDialogo.testoConferma}
        testoAnnulla={statoDialogo.testoAnnulla}
        variante={statoDialogo.variante}
        onConferma={gestisciConferma}
        onAnnulla={gestisciAnnulla}
        onChiudi={gestisciAnnulla}
      />
      {/* Footer della pagina */}
      <Footer />
    </>
  );
};

export default ProfiloEducatore;
