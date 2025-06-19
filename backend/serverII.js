const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

// Configurazioni base
const app = express();
const port = 3000;
const JWT_SECRET = "balla";

// Middleware
app.use(
  cors({
    origin: "*", //permette di far collegare qualsiasi PC al server
    credentials: true,
  })
);
app.use(express.json());

// Configurazione Database
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "step_by_step",
  port: 3306,
});

function autentica(req, res, next) {
  const authHeader = req.headers["authorization"];
  if (!authHeader) {
    console.log("Token mancante nell'header");
    return res.status(401).json({ error: "Token mancante" });
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    console.log("Token non fornito");
    return res.status(401).json({ error: "Token mancante" });
  }
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.utente = payload;
    console.log(
      "Token verificato per utente:",
      payload.id,
      "ruolo:",
      payload.ruolo
    );
    next();
  } catch (err) {
    console.log("Token non valido:", err.message);
    return res.status(403).json({ error: "Token non valido" });
  }
}

// Route Autenticazione
app.post("/api/register", async (req, res) => {
  console.log("Dati ricevuti:", req.body);
  const {
    nome,
    cognome,
    email,
    password,
    ruolo,
    istituto,
    classe,
    anno_scolastico,
    numero_telefono,
    email_studente,
    cognome_famiglia,
  } = req.body;

  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    if (ruolo === "G") {
      console.log("Registrazione famiglia in corso...");

      // Prima verifichiamo che lo studente esista
      db.query(
        "SELECT idStudente FROM studente WHERE email = ?",
        [email_studente],
        (err, studentResult) => {
          if (err) {
            console.error("Errore verifica studente:", err);
            return res
              .status(500)
              .json({ error: "Errore durante la verifica dello studente" });
          }

          if (studentResult.length === 0) {
            return res
              .status(400)
              .json({ error: "Studente non trovato con l'email specificata" });
          }

          // Se lo studente esiste, procediamo con l'inserimento della famiglia
          const insertFamigliaQuery =
            "INSERT INTO famiglia (cognome_famiglia, email, password, numero_telefono, email_studente) VALUES (?, ?, ?, ?, ?)";
          const params = [
            cognome_famiglia,
            email,
            hashedPassword,
            numero_telefono,
            email_studente,
          ];

          db.query(query, params, (err, result) => {
            if (err) {
              console.error("Errore registrazione:", err);
              if (err.code === "ER_DUP_ENTRY") {
                return res.status(409).json({ error: "Email già registrata" });
              }
              return res
                .status(500)
                .json({ error: "Errore durante la registrazione" });
            }
            console.log("Registrazione completata per:", email);
            res
              .status(201)
              .json({ message: "Registrazione completata con successo" });
          });
        }
      );
    } else {
      // Gestione altri ruoli (studente, educatore)
      let query, params;

      if (ruolo === "S") {
        query =
          "INSERT INTO studente (nome, cognome, email, password, istituto, classe, anno_scolastico) VALUES (?, ?, ?, ?, ?, ?, ?)";
        params = [
          nome,
          cognome,
          email,
          hashedPassword,
          istituto,
          classe,
          anno_scolastico,
        ];
      } else if (ruolo === "E") {
        query =
          "INSERT INTO educatore (nome, cognome, email, password, istituto) VALUES (?, ?, ?, ?, ?)";
        params = [nome, cognome, email, hashedPassword, istituto];
      }

      db.query(query, params, (err, result) => {
        if (err) {
          console.error("Errore registrazione:", err);
          if (err.code === "ER_DUP_ENTRY") {
            return res.status(409).json({ error: "Email già registrata" });
          }
          return res
            .status(500)
            .json({ error: "Errore durante la registrazione" });
        }
        console.log("Registrazione completata per:", email);
        res
          .status(201)
          .json({ message: "Registrazione completata con successo" });
      });
    }
  } catch (error) {
    console.error("Errore nell'hashing della password:", error);
    return res.status(500).json({ error: "Errore interno del server" });
  }
});

app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;
  console.log("Tentativo login per:", email);

  // Funzione helper per promisificare le query  MySQL
  const queryAsync = (query, params) => {
    return new Promise((resolve, reject) => {
      db.query(query, params, (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });
  };

  try {
    let result;
    let ruolo;

    // Prima cerca nella tabella studenti
    result = await queryAsync(
      "SELECT *, 'S' as ruolo FROM studente WHERE email = ?",
      [email]
    );

    // Se non trovato, cerca tra gli educatori
    if (result.length === 0) {
      result = await queryAsync(
        "SELECT *, 'E' as ruolo FROM educatore WHERE email = ?",
        [email]
      );
    }

    // Se non trovato, cerca tra i genitori
    if (result.length === 0) {
      result = await queryAsync(
        "SELECT *, 'G' as ruolo FROM famiglia WHERE email = ?",
        [email]
      );
    }

    // Se non trovato in nessuna tabella
    if (result.length === 0) {
      console.log("Utente non trovato:", email);
      return res.status(401).json({ error: "Credenziali non valide" });
    }

    const user = result[0];

    // Verifica la password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      console.log("Password non valida per utente:", email);
      return res.status(401).json({ error: "Credenziali non valide" });
    }

    // Genera il token JWT
    const userId =
      user.ruolo === "E"
        ? user.idEducatore
        : user.ruolo === "S"
        ? user.idStudente
        : user.idFamiglia;

    const token = jwt.sign(
      {
        id: userId,
        ruolo: user.ruolo,
      },
      JWT_SECRET,
      {
        expiresIn: "1h",
      }
    );

    // Invia la risposta
    res.json({
      token,
      ruolo: user.ruolo,
      user: {
        id: user.id,
        nome: user.nome,
        cognome: user.cognome,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Errore durante il login:", error);
    res.status(500).json({ error: "Errore interno del server" });
  }
});

// Route per ottenere i dati del profilo educatore
app.get("/api/profile", autentica, (req, res) => {
  if (req.utente.ruolo !== "E") {
    return res.status(403).json({
      error: "Accesso negato. Solo gli educatori possono accedere al profilo.",
    });
  }

  const idEducatore = req.utente.id;
  console.log("Recupero profilo per educatore ID:", idEducatore);

  const query = `
    SELECT idEducatore, nome, cognome, email, istituto
    FROM educatore 
    WHERE idEducatore = ?
  `;

  db.query(query, [idEducatore], (err, results) => {
    if (err) {
      console.error("Errore query profilo:", err);
      return res.status(500).json({ error: "Errore database" });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: "Profilo non trovato" });
    }

    console.log("Profilo trovato per educatore:", idEducatore);
    res.json(results[0]);
  });
});

// Route per aggiornare i dati del profilo educatore
app.put("/api/profile", autentica, (req, res) => {
  if (req.utente.ruolo !== "E") {
    return res.status(403).json({
      error:
        "Accesso negato. Solo gli educatori possono modificare il profilo.",
    });
  }

  const idEducatore = req.utente.id;
  const { nome, cognome, email, istituto } = req.body;

  console.log("Aggiornamento profilo per educatore ID:", idEducatore);

  // Validazione input
  if (!nome || !cognome || !email || !istituto) {
    return res.status(400).json({
      error: "Tutti i campi (nome, cognome, email, istituto) sono obbligatori",
    });
  }

  // Verifica email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: "Formato email non valido" });
  }

  // Verifica se l'email è già in uso da un altro educatore
  const checkEmailQuery = `
    SELECT idEducatore FROM educatore 
    WHERE email = ? AND idEducatore != ?
  `;

  db.query(checkEmailQuery, [email, idEducatore], (err, emailResults) => {
    if (err) {
      console.error("Errore verifica email:", err);
      return res.status(500).json({ error: "Errore database" });
    }

    if (emailResults.length > 0) {
      return res.status(409).json({ error: "Email già in uso" });
    }

    // Aggiorna il profilo
    const updateQuery = `
      UPDATE educatore 
      SET nome = ?, cognome = ?, email = ?, istituto = ?
      WHERE idEducatore = ?
    `;

    db.query(
      updateQuery,
      [nome, cognome, email, istituto, idEducatore],
      (err, result) => {
        if (err) {
          console.error("Errore aggiornamento profilo:", err);
          if (err.code === "ER_DUP_ENTRY") {
            return res.status(409).json({ error: "Email già registrata" });
          }
          return res
            .status(500)
            .json({ error: "Errore durante l'aggiornamento" });
        }

        if (result.affectedRows === 0) {
          return res.status(404).json({ error: "Profilo non trovato" });
        }

        console.log(
          "Profilo aggiornato con successo per educatore:",
          idEducatore
        );
        res.json({ message: "Profilo aggiornato con successo" });
      }
    );
  });
});

// Route per eliminare il profilo educatore
app.delete("/api/profile", autentica, (req, res) => {
  if (req.utente.ruolo !== "E") {
    return res.status(403).json({
      error: "Accesso negato. Solo gli educatori possono eliminare il profilo.",
    });
  }

  const idEducatore = req.utente.id;
  console.log("Eliminazione profilo per educatore ID:", idEducatore);

  // Prima elimina le associazioni con gli studenti
  const deleteAssegnazioniQuery =
    "DELETE FROM assegnazione WHERE idEducatore = ?";

  db.query(deleteAssegnazioniQuery, [idEducatore], (err, result) => {
    if (err) {
      console.error("Errore eliminazione assegnazioni:", err);
      return res.status(500).json({ error: "Errore database" });
    }

    console.log("Assegnazioni eliminate:", result.affectedRows);

    // Poi elimina il profilo educatore
    const deleteEducatoreQuery = "DELETE FROM educatore WHERE idEducatore = ?";

    db.query(deleteEducatoreQuery, [idEducatore], (err, result) => {
      if (err) {
        console.error("Errore eliminazione educatore:", err);
        return res.status(500).json({ error: "Errore database" });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Profilo non trovato" });
      }

      console.log("Profilo educatore eliminato con successo");
      res.json({ message: "Profilo eliminato con successo" });
    });
  });
});

// Route Studenti
app.get("/api/studenti", autentica, (req, res) => {
  if (req.utente.ruolo !== "E") {
    console.log("Accesso negato - ruolo:", req.utente.ruolo);
    return res.status(403).json({
      error: "Accesso negato. Solo gli educatori possono vedere gli studenti.",
    });
  }

  const idEducatore = req.utente.id;
  console.log("Caricamento studenti per educatore ID:", idEducatore);

  const query = `
        SELECT s.idStudente, s.nome, s.cognome, s.email, a.data_assegnazione
        FROM assegnazione a
        JOIN studente s ON a.idStudente = s.idStudente
        WHERE a.idEducatore = ?
        ORDER BY s.cognome, s.nome
    `;

  db.query(query, [idEducatore], (err, results) => {
    if (err) {
      console.error("Errore query studenti:", err);
      return res.status(500).json({ error: "Errore database" });
    }
    console.log("Studenti trovati:", results.length);
    res.json(results);
  });
});

// Route per aggiungere studente (solo educatori)
app.post("/api/studenti", autentica, (req, res) => {
  if (req.utente.ruolo !== "E") {
    return res.status(403).json({
      error: "Accesso negato. Solo gli educatori possono aggiungere studenti.",
    });
  }

  const idEducatore = req.utente.id;
  const { email } = req.body;

  console.log(
    "Aggiunta studente - Educatore:",
    idEducatore,
    "Email studente:",
    email
  );

  if (!email || !email.trim()) {
    return res.status(400).json({ error: "Email mancante o non valida" });
  }

  // Verifica se lo studente esiste
  const cercaStudente = "SELECT idStudente FROM studente WHERE email = ?";
  db.query(cercaStudente, [email.trim()], (err, results) => {
    if (err) {
      console.error("[ERRORE cercaStudente]", err);
      return res.status(500).json({ error: "Errore database (cercaStudente)" });
    }

    if (results.length === 0) {
      console.warn("[STUDENTE NON TROVATO]", email);
      return res.status(404).json({
        error: "Studente non trovato. Verifica che sia registrato nel sistema.",
      });
    }

    const idStudente = results[0].idStudente;
    console.log("Studente trovato - ID:", idStudente);
    // Verifica se l'associazione esiste giàAdd commentMore actions
    const verificaAssociazione =
      "SELECT * FROM assegnazione WHERE idEducatore = ? AND idStudente = ?";
    db.query(
      verificaAssociazione,
      [idEducatore, idStudente],
      (err2, existing) => {
        if (err2) {
          console.error("[ERRORE verificaAssociazione]", err2);
          return res
            .status(500)
            .json({ error: "Errore database (verificaAssociazione)" });
        }

        if (existing.length > 0) {
          console.log("Associazione già esistente");
          return res
            .status(409)
            .json({ error: "Studente già assegnato a questo educatore" });
        }

        // Inserisci nuova associazione
        const inserisci =
          "INSERT INTO assegnazione (idEducatore, idStudente, data_assegnazione) VALUES (?, ?, CURDATE())";
        db.query(inserisci, [idEducatore, idStudente], (err3, result) => {
          if (err3) {
            console.error("[ERRORE INSERIMENTO assegnazione]", err3);
            return res
              .status(500)
              .json({ error: "Errore database (inserimento)" });
          }

          console.log("Studente assegnato correttamente");
          res.status(201).json({ message: "Studente assegnato correttamente" });
        });
      }
    );
  });
});

app.delete("/api/studenti/:idStudente", autentica, (req, res) => {
  if (req.utente.ruolo !== "E") {
    return res.status(403).json({
      error: "Accesso negato. Solo gli educatori possono rimuovere studenti.",
    });
  }

  const idEducatore = req.utente.id;
  const idStudente = req.params.idStudente;

  console.log(
    "Eliminazione studente - Educatore:",
    idEducatore,
    "Studente:",
    idStudente
  );

  if (!idStudente || isNaN(idStudente)) {
    return res.status(400).json({ error: "ID studente non valido" });
  }

  const elimina =
    "DELETE FROM assegnazione WHERE idEducatore = ? AND idStudente = ?";
  db.query(elimina, [idEducatore, parseInt(idStudente)], (err, result) => {
    if (err) {
      console.error("Errore eliminazione:", err);
      return res.status(500).json({ error: "Errore database" });
    }

    if (result.affectedRows === 0) {
      console.log("Associazione non trovata");
      return res.status(404).json({ error: "Associazione non trovata" });
    }

    console.log("Studente rimosso correttamente");
    res.json({ message: "Studente rimosso correttamente" });
  });
});

// Route per visualizzare i contenuti assegnati a uno studente
app.get("/api/studenti/:idStudente/contenuti", autentica, (req, res) => {
    if (req.utente.ruolo !== "E") {
      return res.status(403).json({
        error: "Accesso negato. Solo gli educatori possono visualizzare i contenuti.",
      });
    }
  
    const idEducatore = req.utente.id;
    const idStudente = req.params.idStudente;
  
    console.log("=== DEBUG CONTENUTI (NUOVA STRUTTURA) ===");
    console.log("ID Educatore:", idEducatore);
    console.log("ID Studente:", idStudente);
  
    // Verifica che lo studente sia assegnato all'educatore
    const verificaAssegnazione = `
      SELECT * FROM assegnazione 
      WHERE idEducatore = ? AND idStudente = ?
    `;
  
    db.query(verificaAssegnazione, [idEducatore, idStudente], (err, assegnazione) => {
      if (err) {
        console.error("Errore verifica assegnazione:", err);
        return res.status(500).json({ error: "Errore database" });
      }
  
      if (assegnazione.length === 0) {
        return res.status(403).json({
          error: "Studente non assegnato a questo educatore",
        });
      }
  
      // Query corretta per la nuova struttura
      const query = `
        SELECT 
          ea.idEsercizioAssegnato,
          ea.testo as titolo,
          ea.immagine,
          ea.data_assegnazione as data_inizio,
          e.tipologia as tipologia,
          e.descrizione as descrizione,
          CASE 
            WHEN r.idRisultato IS NOT NULL THEN 1 
            ELSE 0 
          END as completato
        FROM esercizio_assegnato ea
        JOIN esercizio e ON ea.idEsercizio = e.idEsercizio
        LEFT JOIN risultato r ON ea.idEsercizioAssegnato = r.idEsercizioAssegnato
        WHERE ea.idStudente = ? AND ea.idEducatore = ?
        ORDER BY ea.data_assegnazione DESC
      `;
  
      db.query(query, [idStudente, idEducatore], (err, results) => {
        if (err) {
          console.error("Errore query contenuti:", err);
          return res.status(500).json({ error: "Errore database" });
        }
  
        console.log("Contenuti trovati:", results.length);
        res.json(results);
      });
    });
  });

// Route per visualizzare la cronologia di uno studente
app.get("/api/studenti/:idStudente/cronologia", autentica, (req, res) => {
    if (req.utente.ruolo !== "E") {
      return res.status(403).json({
        error: "Accesso negato. Solo gli educatori possono visualizzare la cronologia.",
      });
    }
  
    const idEducatore = req.utente.id;
    const idStudente = req.params.idStudente;
  
    console.log("=== DEBUG CRONOLOGIA ===");
    console.log("ID Educatore:", idEducatore);
    console.log("ID Studente:", idStudente);
  
    // Verifica che lo studente sia assegnato all'educatore
    const verificaAssegnazione = `
      SELECT * FROM assegnazione 
      WHERE idEducatore = ? AND idStudente = ?
    `;
  
    db.query(verificaAssegnazione, [idEducatore, idStudente], (err, assegnazione) => {
      if (err) {
        console.error("Errore verifica assegnazione:", err);
        return res.status(500).json({ error: "Errore database" });
      }
  
      if (assegnazione.length === 0) {
        return res.status(403).json({
          error: "Studente non assegnato a questo educatore",
        });
      }
  
      // Query semplificata che funziona con la struttura attuale
      const query = `
       SELECT 
      r.idRisultato,
      r.punteggio,
      r.numero_errori as numero_errori,
      r.tempo as tempo_impiegato,
      r.numero_tentativi as tentativi,
      r.traccia_audio as traccia_audio,
      ea.testo as titolo,
      e.descrizione as tipo_esercizio,
      e.tipologia as descrizione,
      r.data_esecuzione as data_completamento,
      r.idStudente
    FROM risultato r
    JOIN esercizio_assegnato ea ON r.idEsercizioAssegnato = ea.idEsercizioAssegnato
    JOIN esercizio e ON ea.idEsercizio = e.idEsercizio
    WHERE r.idStudente = ? AND ea.idEducatore = ?
    ORDER BY r.data_esecuzione DESC  
  `;
  
      db.query(query, [idStudente, idEducatore], (err, results) => {
        if (err) {
          console.error("Errore query cronologia:", err);
          return res.status(500).json({ error: "Errore database" });
        }
  
        console.log("Record cronologia trovati:", results.length);
        res.json(results);
      });
    });
  });

// Route per eliminare un contenuto assegnato
app.delete("/api/studenti/:idStudente/contenuti/:idEsercizioAssegnato", autentica, (req, res) => {
    if (req.utente.ruolo !== "E") {
      return res.status(403).json({
        error: "Accesso negato. Solo gli educatori possono eliminare contenuti.",
      });
    }
  
    const idEducatore = req.utente.id;
    const idStudente = req.params.idStudente;
    const idEsercizioAssegnato = req.params.idEsercizioAssegnato;
  
    console.log("=== ELIMINAZIONE CONTENUTO (NUOVA STRUTTURA) ===");
    console.log("Educatore:", idEducatore);
    console.log("Studente:", idStudente);
    console.log("EsercizioAssegnato:", idEsercizioAssegnato);
  
    // Verifica che lo studente sia assegnato all'educatore
    const verificaAssegnazione = `
      SELECT * FROM assegnazione 
      WHERE idEducatore = ? AND idStudente = ?
    `;
  
    db.query(verificaAssegnazione, [idEducatore, idStudente], (err, assegnazione) => {
      if (err) {
        console.error("Errore verifica assegnazione:", err);
        return res.status(500).json({ error: "Errore database" });
      }
  
      if (assegnazione.length === 0) {
        return res.status(403).json({
          error: "Studente non assegnato a questo educatore",
        });
      }
  
      // Prima elimina eventuali risultati collegati
      const eliminaRisultati = `
        DELETE FROM risultato 
        WHERE idEsercizioAssegnato = ?
      `;
  
      db.query(eliminaRisultati, [idEsercizioAssegnato], (err, result) => {
        if (err) {
          console.error("Errore eliminazione risultati:", err);
          return res.status(500).json({ error: "Errore eliminazione risultati" });
        }
  
        // Poi elimina l'esercizio assegnato
        const eliminaEsercizio = `
          DELETE FROM esercizio_assegnato 
          WHERE idEsercizioAssegnato = ? AND idStudente = ? AND idEducatore = ?
        `;
  
        db.query(eliminaEsercizio, [idEsercizioAssegnato, idStudente, idEducatore], (err, result) => {
          if (err) {
            console.error("Errore eliminazione esercizio:", err);
            return res.status(500).json({ error: "Errore eliminazione esercizio" });
          }
  
          if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Contenuto non trovato o non assegnato" });
          }
  
          console.log("Contenuto eliminato con successo");
          res.json({ message: "Contenuto eliminato con successo" });
        });
      });
    });
  });

// Route per ottenere tutti gli esercizi disponibili
app.get("/api/esercizi", autentica, (req, res) => {
  if (req.utente.ruolo !== "E") {
    return res.status(403).json({
      error: "Accesso negato. Solo gli educatori possono vedere gli esercizi.",
    });
  }

  const query = "SELECT * FROM esercizio ORDER BY tipologia";

  db.query(query, (err, results) => {
    if (err) {
      console.error("Errore query esercizi:", err);
      return res.status(500).json({ error: "Errore database" });
    }
    res.json(results);
  });
});

// Route per creare un nuovo contenuto e assegnarlo a uno studente
// Route per creare un nuovo contenuto e assegnarlo a uno studente
app.post("/api/studenti/:idStudente/contenuti", autentica, (req, res) => {
    if (req.utente.ruolo !== "E") {
      return res.status(403).json({
        error: "Accesso negato. Solo gli educatori possono aggiungere contenuti.",
      });
    }
  
    const idEducatore = req.utente.id;
    const idStudente = req.params.idStudente;
    const { testo, immagine, idEsercizio } = req.body;
  
    console.log("=== AGGIUNTA CONTENUTO (NUOVA STRUTTURA) ===");
    console.log("Educatore:", idEducatore);
    console.log("Studente:", idStudente);
    console.log("Dati:", { testo, immagine, idEsercizio });
  
    // Validazione dati
    if (!testo || !idEsercizio) {
      return res.status(400).json({
        error: "Campi obbligatori mancanti: testo, idEsercizio",
      });
    }
  
    // Verifica che lo studente sia assegnato all'educatore
    const verificaAssegnazione = `
      SELECT * FROM assegnazione 
      WHERE idEducatore = ? AND idStudente = ?
    `;
  
    db.query(verificaAssegnazione, [idEducatore, idStudente], (err, assegnazione) => {
      if (err) {
        console.error("Errore verifica assegnazione:", err);
        return res.status(500).json({ error: "Errore database" });
      }
  
      if (assegnazione.length === 0) {
        return res.status(403).json({
          error: "Studente non assegnato a questo educatore",
        });
      }
  
      // Inserisci direttamente in esercizioassegnato
      const insertQuery = `
        INSERT INTO esercizio_assegnato (idStudente, idEsercizio, idEducatore, data_assegnazione, testo, immagine) 
        VALUES (?, ?, ?, CURDATE(), ?, ?)
      `;
  
      db.query(insertQuery, [idStudente, idEsercizio, idEducatore, testo, immagine || null], (err, result) => {
        if (err) {
          console.error("Errore inserimento contenuto:", err);
          return res.status(500).json({ error: "Errore inserimento contenuto" });
        }
  
        res.status(201).json({
          message: "Contenuto creato e assegnato con successo",
          idEsercizioAssegnato: result.insertId,
        });
      });
    });
  });
  

// Connessione DB e Avvio Server
db.connect((err) => {
  if (err) {
    console.error("Errore di connessione al database:", err);
    process.exit(1);
  }
  console.log("Connessione al database stabilita con successo!");

  app.listen(port, () => {
    console.log(`Server in ascolto sulla porta ${port}`);
  });
});

// Gestione errori generica
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Errore interno del server" });
});

