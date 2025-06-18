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
  host: "172.29.8.207",
  user: "alessandro",
  password: "123456",
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
      error: "Accesso negato. Solo gli educatori possono modificare il profilo.",
    });
  }

  const idEducatore = req.utente.id;
  const { nome, cognome, email, istituto } = req.body;

  console.log("Aggiornamento profilo per educatore ID:", idEducatore);

  // Validazione input
  if (!nome || !cognome || !email || !istituto) {
    return res.status(400).json({ 
      error: "Tutti i campi (nome, cognome, email, istituto) sono obbligatori" 
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

    db.query(updateQuery, [nome, cognome, email, istituto, idEducatore], (err, result) => {
      if (err) {
        console.error("Errore aggiornamento profilo:", err);
        if (err.code === "ER_DUP_ENTRY") {
          return res.status(409).json({ error: "Email già registrata" });
        }
        return res.status(500).json({ error: "Errore durante l'aggiornamento" });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Profilo non trovato" });
      }

      console.log("Profilo aggiornato con successo per educatore:", idEducatore);
      res.json({ message: "Profilo aggiornato con successo" });
    });
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
  const deleteAssegnazioniQuery = "DELETE FROM assegnazione WHERE idEducatore = ?";
  
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
  
    console.log("Recupero contenuti per studente:", idStudente, "da educatore:", idEducatore);
  
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
          error: "Studente non assegnato a questo educatore" 
        });
      }
  
      // Recupera i contenuti assegnati allo studente
      const query = `
        SELECT c.*, a.data_inizio, a.data_scadenza, a.completato
        FROM assegna a
        JOIN contenuto c ON a.idEsercizio = c.idContenuto
        WHERE a.idStudente = ? AND a.idEducatore = ?
        ORDER BY a.data_inizio DESC
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
  
    console.log("Recupero cronologia per studente:", idStudente, "da educatore:", idEducatore);
  
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
          error: "Studente non assegnato a questo educatore" 
        });
      }
  
      // Recupera la cronologia dello studente
      const query = `
        SELECT p.*, c.titolo, c.descrizione
        FROM progresso_studente p
        JOIN contenuto c ON p.idEsercizio = c.idContenuto
        WHERE p.idStudente = ?
        ORDER BY p.data_completamento DESC, p.timestamp DESC
      `;
  
      db.query(query, [idStudente], (err, results) => {
        if (err) {
          console.error("Errore query cronologia:", err);
          return res.status(500).json({ error: "Errore database" });
        }
        
        console.log("Record cronologia trovati:", results.length);
        res.json(results);
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

// Aggiungi route per le parole
app.get("/api/parole", (req, res) => {
  const query = "SELECT * FROM contenuto";
  db.query(query, (err, results) => {
    if (err) {
      console.error("Errore query:", err);
      return res.status(500).json({ error: "Errore database" });
    }
    console.log("Risultati query:", results); // Debug
    res.json(results);
  });
});
