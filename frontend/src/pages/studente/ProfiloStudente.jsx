import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./ProfiloStudente.module.css";
import Header from "../../components/header/HeaderStudente";
import Footer from "../../components/footer/Footer";
import ContainerNotifiche from "../../components/condivisi/Layout/ContainerNotifiche";
import DialogoConferma from "../../components/condivisi/Layout/DialogoConferma";
import { useFeedback } from "../../hooks/useFeedback";
import { usaDialogoConferma } from "../../hooks/usaDialogoConferma";

//Componente ProfiloStudente - Gestisce la visualizzazione e modifica del profilo
const ProfiloStudente = () => {
  // Hook per la navigazione tra le pagine
  const navigate = useNavigate();
  // State per controllare se si è in modalità modifica
  const [isEditing, setIsEditing] = useState(false);
  // State per memorizzare le informazioni dello studente
  const [userInfo, setUserInfo] = useState({
    nome: "",
    cognome: "",
    email: "",
    istituto: "",
    classe: "",
    anno_scolastico: "",
  });
  // State per memorizzare le statistiche scolastiche dello studente
  const [statistiche, setStatistiche] = useState({
    esercizi_completati: 0,
    esercizi_non_completati: 0,
    loading: true,
  });

  // Integrazione sistema feedback
  const { notifiche, successo, errore, avviso } = useFeedback();

  // Integrazione sistema conferma
  const { statoDialogo, mostraConferma, gestisciConferma, gestisciAnnulla } =
    usaDialogoConferma();

  //Funzione per caricare le statistiche accademiche dello studente
  const loadStatistiche = async () => {
    try {
      // Recupera il token di autenticazione dal localStorage
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:3000/api/student-stats", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      // Verifica se la risposta è stata successful
      if (!response.ok) {
        throw new Error("Errore nel caricamento delle statistiche");
      }

      const statsData = await response.json();
      // Converte la risposta in JSON e aggiorna lo state delle statistiche
      setStatistiche({
        esercizi_completati: statsData.esercizi_completati,
        esercizi_non_completati: statsData.esercizi_non_completati,
        loading: false,
      });
    } catch (error) {
      // Gestisce gli errori mostrando una notifica e impostando valori di default
      console.error("Errore caricamento statistiche:", error);
      errore("Errore nel caricamento delle statistiche", { durata: 6000 });
      setStatistiche({
        esercizi_completati: 0,
        esercizi_non_completati: 0,
        loading: false,
      });
    }
  };
  //useEffect per caricare il profilo e le statistiche dello studente
  useEffect(() => {
    const loadProfile = async () => {
      try {
        // Recupera il token di autenticazione dal localStorage
        const token = localStorage.getItem("token");
        // Effettua la chiamata API per ottenere i dati del profilo studente
        const response = await fetch(
          "http://localhost:3000/api/student-profile",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        // Verifica se la risposta è stata stata confermata
        if (!response.ok) {
          throw new Error("Errore nel caricamento del profilo");
        }
        // Converte la risposta in JSON e aggiorna lo state
        const profileData = await response.json();
        setUserInfo(profileData);
      } catch (error) {
        console.error("Errore caricamento profilo:", error);
        errore("Errore nel caricamento del profilo", { durata: 6000 });
      }
    };
    //Funzione per coordinare il caricamento di tutti i dati necessari
    const loadData = async () => {
      await loadProfile();
      await loadStatistiche();
    };
    // Esegue il caricamento completo dei dati
    loadData();
  }, [errore]); // Dipendenza: errore (funzione di notifica)

  //Funzione per attivare/disattivare la modalità di modifica
  const handleEdit = () => {
    setIsEditing(!isEditing);
  };
  //Funzione per salvare le modifiche al profilo studente
  const handleSave = async () => {
    try {
      // Recupera il token di autenticazione
      const token = localStorage.getItem("token");
      // Prepara i dati da inviare (esclude l'email che non è modificabile)
      const updateData = {
        nome: userInfo.nome,
        cognome: userInfo.cognome,
        istituto: userInfo.istituto,
        classe: userInfo.classe,
        anno_scolastico: userInfo.anno_scolastico,
      };
      // Effettua la chiamata API per aggiornare il profilo studente
      const response = await fetch(
        "http://localhost:3000/api/student-profile",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(updateData),
        }
      );
      // Verifica se l'aggiornamento è andato a buon fine
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Errore nel salvataggio");
      }
      // Disattiva la modalità modifica e mostra messaggio di successo
      setIsEditing(false);
      successo("Profilo salvato con successo!", { durata: 4000 });
    } catch (error) {
      // Gestisce gli errori di salvataggio
      console.error("Errore salvataggio:", error);
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
  // Funzione per gestire l'eliminazione del profilo studente
  const handleDeleteProfile = async () => {
    // Mostra il dialogo di conferma per l'eliminazione con messaggio dettagliato
    const conferma = await mostraConferma({
      titolo: "Conferma Eliminazione",
      messaggio:
        "Sei sicuro di voler eliminare il tuo profilo studente? Tutti i dati verranno eliminati permanentemente e non sarà possibile recuperare il profilo.",
      testoConferma: "Sì, Elimina",
      testoAnnulla: "Annulla",
      variante: "pericolo",
    });
    // Se l'utente conferma, procede con l'eliminazione
    if (conferma) {
      await confirmDelete();
    }
  };
  //Funzione per confermare ed eseguire l'eliminazione del profilo studente
  const confirmDelete = async () => {
    try {
      // Recupera il token di autenticazione
      const token = localStorage.getItem("token");
       // Effettua la chiamata API per eliminare il profilo studente
      const response = await fetch(
        "http://localhost:3000/api/student-profile",
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      // Verifica se l'eliminazione è andata a buon fine
      if (!response.ok) {
        const errorData = await response.json();
        console.error("Errore dal server:", errorData);
        throw new Error(errorData.error || "Errore nell'eliminazione");
      }

      const result = await response.json();
      console.log("Eliminazione completata:", result);

      // Effettua il logout completo rimuovendo tutti i dati dal localStorage
      localStorage.removeItem("token");
      localStorage.removeItem("ruolo");
      localStorage.removeItem("studenteSelezionato");
      // Mostra messaggio di successo
      successo("Profilo studente eliminato con successo!", { durata: 4000 });

      // Ritarda la navigazione per mostrare il messaggio
      setTimeout(() => {
        navigate("/");
      }, 2000);
    } catch (error) {
      console.error("Errore eliminazione profilo:", error);
      errore(`Errore nell'eliminazione del profilo: ${error.message}`, {
        durata: 8000,
      });
    }
  };
   //Funzione per navigare alla cronologia dello studente
  const handleViewCronologia = () => {
    navigate("/cronologia-studente");
  };
  // Renderizza del profilo studente
  return (
    <>
     {/* Header specifico per lo studente */}
      <Header />
      <div className={styles.profileContainer}>
        <div className={styles.profileContent}>
          {/* Blocco di Benvenuto */}
          <div className={styles.welcomeBlock}>
            <div className={styles.welcomeContent}>
              <div className={styles.welcomeIcon}>👋</div>
              <h1 className={styles.welcomeTitle}>
                Benvenuto nel tuo Profilo!
              </h1>
              <p className={styles.welcomeText}>
                Gestisci le tue informazioni personali e monitora i tuoi
                progressi accademici.
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

            <div className={styles.infoGrid}>
               {/* Form per la visualizzazione/modifica del profilo studente */}
              <div className={styles.nameRow}>
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
                  {/* L'email non è modificabile per sicurezza */}
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

              <div className={styles.nameRow}>
                <div className={styles.infoItem}>
                  <label>Classe</label>
                  {isEditing ? (
                    <input
                      type="text"
                      className={styles.inputField}
                      value={userInfo.classe}
                      onChange={(e) =>
                        handleInputChange("classe", e.target.value)
                      }
                      placeholder="es. 3A, 5B"
                    />
                  ) : (
                    <div className={styles.infoValue}>
                      {userInfo.classe || "Non specificata"}
                    </div>
                  )}
                </div>

                <div className={styles.fieldSpacer}></div>

                <div className={styles.infoItem}>
                  <label>Anno Scolastico</label>
                  {isEditing ? (
                    <select
                      className={styles.inputField}
                      value={userInfo.anno_scolastico}
                      onChange={(e) =>
                        handleInputChange("anno_scolastico", e.target.value)
                      }
                    >
                      <option value="">Seleziona anno</option>
                      <option value="2024-2025">2024-2025</option>
                      <option value="2023-2024">2023-2024</option>
                      <option value="2022-2023">2022-2023</option>
                    </select>
                  ) : (
                    <div className={styles.infoValue}>
                      {userInfo.anno_scolastico || "Non specificato"}
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

            {/* Sezione statistiche scolastiche */}
          <div className={styles.cronologiaBlock}>
            <div className={styles.cronologiaIcon}>📊</div>
            <h2 className={styles.cronologiaTitle}>Cronologia Prestazioni</h2>
            <p className={styles.cronologiaDescription}>
              Visualizza i tuoi progressi, e gli esercizi.
            </p>

            <div className={styles.cronologiaStats}>
              <div className={styles.statItem}>
                <div className={styles.statNumber}>
                  {statistiche.loading
                    ? "..."
                    : statistiche.esercizi_completati}
                </div>
                <div className={styles.statLabel}>Esercizi Completati</div>
              </div>
              <div className={styles.statItem}>
                <div className={styles.statNumber}>
                  {statistiche.loading
                    ? "..."
                    : statistiche.esercizi_non_completati}
                </div>
                <div className={styles.statLabel}>Esercizi Non Completati</div>
              </div>
            </div>

            <div className={styles.cronologiaButtonContainer}>
              <button
                className={styles.cronologiaBtn}
                onClick={handleViewCronologia}
              >
                Visualizza Cronologia
              </button>
            </div>
          </div>

          {/* Zona per l'eliminazione del profilo */}
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

      {/*  Dialogo di conferma per azioni critiche */}
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

export default ProfiloStudente;
