import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./ProfiloStudente.module.css";
import Header from "../../components/Header/HeaderStudente";
import Footer from "../../components/footer/Footer";
import ContainerNotifiche from "../../components/condivisi/Layout/ContainerNotifiche";
import DialogoConferma from "../../components/condivisi/Layout/DialogoConferma";
import { useFeedback } from "../../hooks/useFeedback";
import { usaDialogoConferma } from "../../hooks/usaDialogoConferma";

const ProfiloStudente = () => {
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [userInfo, setUserInfo] = useState({
    nome: "",
    cognome: "",
    email: "",
    istituto: "",
    classe: "",
    anno_scolastico: "",
  });
  const [statistiche, setStatistiche] = useState({
    esercizi_completati: 0,
    esercizi_non_completati: 0,
    loading: true,
  });

  // Integrazione sistema feedback
  const { notifiche, successo, errore, avviso } = useFeedback();
  
  // Integrazione sistema conferma
  const { 
    statoDialogo, 
    mostraConferma, 
    gestisciConferma, 
    gestisciAnnulla 
  } = usaDialogoConferma();

  const loadStatistiche = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:3000/api/student-stats", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Errore nel caricamento delle statistiche");
      }

      const statsData = await response.json();

      setStatistiche({
        esercizi_completati: statsData.esercizi_completati,
        esercizi_non_completati: statsData.esercizi_non_completati,
        loading: false,
      });
    } catch (error) {
      console.error("Errore caricamento statistiche:", error);
      errore("Errore nel caricamento delle statistiche", { durata: 6000 });
      setStatistiche({
        esercizi_completati: 0,
        esercizi_non_completati: 0,
        loading: false,
      });
    }
  };

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(
          "http://localhost:3000/api/student-profile",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error("Errore nel caricamento del profilo");
        }

        const profileData = await response.json();
        setUserInfo(profileData);
      } catch (error) {
        console.error("Errore caricamento profilo:", error);
        errore("Errore nel caricamento del profilo", { durata: 6000 });
      }
    };

    const loadData = async () => {
      await loadProfile();
      await loadStatistiche();
    };

    loadData();
  }, [errore]);

  const handleEdit = () => {
    setIsEditing(!isEditing);
  };

  const handleSave = async () => {
    try {
      const token = localStorage.getItem("token");
      const updateData = {
        nome: userInfo.nome,
        cognome: userInfo.cognome,
        istituto: userInfo.istituto,
        classe: userInfo.classe,
        anno_scolastico: userInfo.anno_scolastico,
      };

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

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Errore nel salvataggio");
      }

      setIsEditing(false);
      successo("Profilo salvato con successo!", { durata: 4000 });
    } catch (error) {
      console.error("Errore salvataggio:", error);
      errore(`Errore nel salvataggio: ${error.message}`, { durata: 6000 });
    }
  };

  const handleInputChange = (field, value) => {
    setUserInfo((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleDeleteProfile = async () => {
    const conferma = await mostraConferma({
      titolo: "Conferma Eliminazione",
      messaggio: "Sei sicuro di voler eliminare il tuo profilo studente? Tutti i dati verranno eliminati permanentemente e non sarà possibile recuperare il profilo.",
      testoConferma: "Sì, Elimina",
      testoAnnulla: "Annulla",
      variante: "pericolo"
    });

    if (conferma) {
      await confirmDelete();
    }
  };

  const confirmDelete = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        "http://localhost:3000/api/student-profile",
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Errore dal server:", errorData);
        throw new Error(errorData.error || "Errore nell'eliminazione");
      }

      const result = await response.json();
      console.log("Eliminazione completata:", result);

      // Logout completo
      localStorage.removeItem("token");
      localStorage.removeItem("ruolo");
      localStorage.removeItem("studenteSelezionato");

      successo("Profilo studente eliminato con successo!", { durata: 4000 });
      
      // Ritarda la navigazione per mostrare il messaggio
      setTimeout(() => {
        navigate("/");
      }, 2000);
    } catch (error) {
      console.error("Errore eliminazione profilo:", error);
      errore(`Errore nell'eliminazione del profilo: ${error.message}`, { durata: 8000 });
    }
  };

  const handleViewCronologia = () => {
    navigate("/cronologia-studente");
  };

  return (
    <>
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
              <h2 className={styles.blockTitle}>
                Informazioni Personali
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
                <button 
                  className={styles.saveBtn}
                  onClick={handleSave}
                >
                  Salva Modifiche
                </button>
              </div>
            )}
          </div>

          {/* Blocco Cronologia */}
          <div className={styles.cronologiaBlock}>
            <div className={styles.cronologiaIcon}>📊</div>
            <h2 className={styles.cronologiaTitle}>
              Cronologia Prestazioni
            </h2>
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

      {/* Sistema di notifiche integrato */}
      <ContainerNotifiche notifiche={notifiche} />

      {/* Dialogo di conferma integrato */}
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
