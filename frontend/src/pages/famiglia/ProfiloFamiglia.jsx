import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './ProfiloFamiglia.module.css';
import Header from '../../components/header/HeaderFamiglia';
import Footer from '../../components/footer/Footer';
import ContainerNotifiche from '../../components/condivisi/Layout/ContainerNotifiche';
import DialogoConferma from '../../components/condivisi/Layout/DialogoConferma';
import { useFeedback } from '../../hooks/useFeedback';
import { usaDialogoConferma } from '../../hooks/usaDialogoConferma';

const ProfiloFamilgia = () => {
  // Hook per la navigazione tra le pagine
  const navigate = useNavigate();
   // State per controllare se si è in modalità modifica
  const [isEditing, setIsEditing] = useState(false);
    // State per memorizzare le informazioni della famiglia
  const [userInfo, setUserInfo] = useState({
    cognome_famiglia: "",
    email: "",
    numero_telefono: "",
    email_studente: "",
  });

  // Integrazione sistema feedback
  const { notifiche, successo, errore, avviso } = useFeedback();
  
    // Hook personalizzato per gestire i dialoghi di conferma
  const { 
    statoDialogo, 
    mostraConferma, 
    gestisciConferma, 
    gestisciAnnulla 
  } = usaDialogoConferma();

  // Effettua il caricamento del profilo famiglia al montaggio del componente
  useEffect(() => {
    const loadProfile = async () => {
      try {
        // Recupera il token di autenticazione dal localStorage
        const token = localStorage.getItem("token");
        // Effettua la chiamata API per ottenere i dati del profilo famiglia
        const response = await fetch(
          "http://localhost:3000/api/family-profile",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error("Errore nel caricamento del profilo");
        }
        // Converte la risposta in JSON e aggiorna lo stato con i dati del profilo
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
  }, [errore]); // Dipendenza: errore (funzione di notifica)

  //Funzione per attivare/disattivare la modalità di modifica
  const handleEdit = () => {
    setIsEditing(!isEditing);
  };
  //Funzione per salvare le modifiche al profilo famiglia
  const handleSave = async () => {
    try {
        // Recupera il token di autenticazione
      const token = localStorage.getItem("token");
      // Prepara i dati da inviare (esclude l'email che non è modificabile)
      const updateData = {
        cognome_famiglia: userInfo.cognome_famiglia,
        numero_telefono: userInfo.numero_telefono,
        email_studente: userInfo.email_studente,
      };

       // Effettua la chiamata API per aggiornare il profilo famiglia
      const response = await fetch("http://localhost:3000/api/family-profile", {
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

      successo('Profilo famiglia salvato con successo!', { durata: 4000 });
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
  // Funzione per gestire l'eliminazione del profilo famiglia
  const handleDeleteProfile = async () => {
    const conferma = await mostraConferma({
       // Mostra il dialogo di conferma per l'eliminazione
      titolo: "Conferma Eliminazione",
      messaggio: "Sei sicuro di voler eliminare il profilo famiglia?",
      testoConferma: "Sì, Elimina",
      testoAnnulla: "Annulla",
      variante: "pericolo"
    });
     // Se l'utente conferma, procede con l'eliminazione
    if (conferma) {
      await confirmDelete();
    }
  };
  //Funzione per confermare ed eseguire l'eliminazione del profilo famiglia
  const confirmDelete = async () => {
    try {
      // Recupera il token di autenticazione
      const token = localStorage.getItem("token");
       // Effettua la chiamata API per eliminare il profilo famiglia
      const response = await fetch("http://localhost:3000/api/family-profile", {
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

      // Effettua il logout completo rimuovendo i dati dal localStorage
      localStorage.removeItem('token');
      localStorage.removeItem('ruolo');

      // Mostra messaggio di successo
      successo('Profilo famiglia eliminato con successo!', { durata: 4000 });
      
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
  //Funzione per navigare alla cronologia dello studente
  const handleViewCronologia = () => {
    navigate("/cronologia-famiglia");
  };
    //Renderizzazione del componente
  return (
    <>
    {/* Header specifico per la famiglia */}
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
            {/* Form per la visualizzazione/modifica del profilo famiglia */}
            <div className={styles.infoGrid}>
              <div className={styles.nameRow}>
                <div className={styles.infoItem}>
                  <label>Cognome Famiglia</label>
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
                  <label>Numero Telefono</label>
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
                {/* L'email non è modificabile */}
                <div className={styles.infoItem}>
                  <label>Email Famiglia</label>
                  <div className={styles.infoValue}>
                    <span className={styles.readonlyBadge}>SOLA LETTURA</span>
                    {userInfo.email || "Non specificata"}
                  </div>
                  <div className={styles.emailNote}>
                    L'email famiglia non può essere modificata per motivi di
                    sicurezza
                  </div>
                </div>
              </div>

              <div className={styles.singleRow}>
                <div className={styles.infoItem}>
                  <label>Email Studente</label>
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


      {/* Sistema di notifiche integrato */}
      <ContainerNotifiche notifiche={notifiche} />

      {/* Dialogo di conferma per azioni critiche */}
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
      <Footer />
    </>
  );
};

export default ProfiloFamilgia;
