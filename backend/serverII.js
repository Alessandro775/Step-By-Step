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
  host: "172.29.3.5",
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
// Route per aggiornare i dati del profilo studente (SENZA email)
app.put("/api/student-profile", autentica, (req, res) => {
  if (req.utente.ruolo !== "S") {
    return res.status(403).json({
      error: "Accesso negato. Solo gli studenti possono modificare il profilo.",
    });
  }

  const idStudente = req.utente.id;
  const { nome, cognome, istituto, classe, anno_scolastico } = req.body;

  console.log("Aggiornamento profilo per studente ID:", idStudente);

  // Validazione input (EMAIL RIMOSSA)
  if (!nome || !cognome || !istituto || !classe || !anno_scolastico) {
    return res.status(400).json({ 
      error: "Tutti i campi (nome, cognome, istituto, classe, anno scolastico) sono obbligatori" 
    });
  }

  // Validazione specifica per la classe
  const classiValide = ['1', '2', '3', '4', '5'];
  if (!classiValide.includes(classe)) {
    return res.status(400).json({ 
      error: "La classe deve essere un valore tra 1 e 5" 
    });
  }

  // Aggiorna il profilo SENZA L'EMAIL
  const updateQuery = `
    UPDATE studente 
    SET nome = ?, cognome = ?, istituto = ?, classe = ?, anno_scolastico = ?
    WHERE idStudente = ?
  `;

  db.query(updateQuery, [nome, cognome, istituto, classe, anno_scolastico, idStudente], (err, result) => {
    if (err) {
      console.error("Errore aggiornamento profilo studente:", err);
      return res.status(500).json({ error: "Errore durante l'aggiornamento" });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Profilo non trovato" });
    }

    console.log("Profilo studente aggiornato con successo:", idStudente);
    res.json({ 
      message: "Profilo aggiornato con successo",
      note: "L'email non può essere modificata per motivi di sicurezza"
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
// Route per ottenere i dati del profilo studente
app.get("/api/student-profile", autentica, (req, res) => {
  if (req.utente.ruolo !== "S") {
    return res.status(403).json({
      error: "Accesso negato. Solo gli studenti possono accedere al profilo.",
    });
  }

  const idStudente = req.utente.id;
  console.log("Recupero profilo per studente ID:", idStudente);

  const query = `
    SELECT idStudente, nome, cognome, email, istituto, classe, anno_scolastico
    FROM studente 
    WHERE idStudente = ?
  `;

  db.query(query, [idStudente], (err, results) => {
    if (err) {
      console.error("Errore query profilo studente:", err);
      return res.status(500).json({ error: "Errore database" });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: "Profilo non trovato" });
    }

    console.log("Profilo trovato per studente:", idStudente);
    res.json(results[0]);
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
          error: "Studente non assegnato a questo educatore" 
        });
      }
  
      // Controlla se esistono esercizi assegnati (NUOVA QUERY)
      const checkQuery = `
        SELECT COUNT(*) as total FROM esercizio_assegnato 
        WHERE idStudente = ? AND idEducatore = ?
      `;
  
      db.query(checkQuery, [idStudente, idEducatore], (err, countResult) => {
        if (err) {
          console.error("Errore conteggio:", err);
          return res.status(500).json({ error: "Errore database" });
        }
  
        console.log("Esercizi assegnati trovati:", countResult[0].total);
  
        if (countResult[0].total === 0) {
          console.log("Nessun esercizio assegnato a questo studente");
          return res.json([]);
        }
  
        // NUOVA QUERY con la struttura aggiornata
        const query = `
          SELECT 
            c.idContenuto,
            c.testo as titolo,
            c.immagine,
            c.tipologia as descrizione,
            ea.data_assegnazione as data_inizio,
            ea.data_assegnazione as data_scadenza,
            CASE 
              WHEN r.idRisultato IS NOT NULL THEN 1 
              ELSE 0 
            END as completato
          FROM esercizio_assegnato ea
          JOIN contenuto c ON ea.idContenuto = c.idContenuto
          LEFT JOIN risultato r ON ea.idEsercizioAssegnato = r.idEsercizioAssegnato
          WHERE ea.idStudente = ? AND ea.idEducatore = ?
          ORDER BY ea.data_assegnazione DESC
        `;
  
        db.query(query, [idStudente, idEducatore], (err, results) => {
          if (err) {
            console.error("Errore query contenuti:", err);
            console.error("Query:", query);
            return res.status(500).json({ error: "Errore database" });
          }
          
          console.log("Contenuti query risultati:", results.length);
          console.log("Primo risultato:", results[0] || "Nessun risultato");
          res.json(results);
        });
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
  
    console.log("=== DEBUG CRONOLOGIA (NUOVA STRUTTURA) ===");
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
          error: "Studente non assegnato a questo educatore" 
        });
      }
  
      // Controlla se esistono risultati (NUOVA QUERY)
      const checkQuery = `
        SELECT COUNT(*) as total FROM risultato r
        JOIN esercizio_assegnato ea ON r.idEsercizioAssegnato = ea.idEsercizioAssegnato
        WHERE r.idStudente = ? AND ea.idEducatore = ?
      `;
  
      db.query(checkQuery, [idStudente, idEducatore], (err, countResult) => {
        if (err) {
          console.error("Errore conteggio cronologia:", err);
          return res.status(500).json({ error: "Errore database" });
        }
  
        console.log("Record cronologia trovati:", countResult[0].total);
  
        if (countResult[0].total === 0) {
          console.log("Nessun record di progresso per questo studente");
          return res.json([]);
        }
  
        // NUOVA QUERY con la struttura aggiornata
        const query = `
          SELECT 
            r.idRisultato,
            r.punteggio,
            r.numero_errori as numero_errori,
            r.tempo as tempo_impiegato,
            r.numero_tentativi as tentativi,
            r.traccia_audio,
            c.testo as titolo,
            c.tipologia as descrizione,
            e.descrizione as tipo_esercizio,
            ea.data_assegnazione as data_completamento
          FROM risultato r
          JOIN esercizio_assegnato ea ON r.idEsercizioAssegnato = ea.idEsercizioAssegnato
          JOIN contenuto c ON ea.idContenuto = c.idContenuto
          JOIN esercizio e ON ea.idEsercizio = e.idEsercizio
          WHERE r.idStudente = ? AND ea.idEducatore = ?
          ORDER BY ea.data_assegnazione DESC
        `;
  
        db.query(query, [idStudente, idEducatore], (err, results) => {
          if (err) {
            console.error("Errore query cronologia:", err);
            console.error("Query:", query);
            return res.status(500).json({ error: "Errore database" });
          }
          
          console.log("Cronologia query risultati:", results.length);
          console.log("Primo risultato:", results[0] || "Nessun risultato");
          res.json(results);
        });
      });
    });
  });
  
// Route per ottenere i dati del profilo famiglia
app.get("/api/family-profile", autentica, (req, res) => {
  if (req.utente.ruolo !== "G") {
    return res.status(403).json({
      error: "Accesso negato. Solo le famiglie possono accedere al profilo.",
    });
  }

  const idFamiglia = req.utente.id;
  console.log("Recupero profilo per famiglia ID:", idFamiglia);

  const query = `
    SELECT idFamiglia, cognome_famiglia, email, numero_telefono, email_studente
    FROM famiglia 
    WHERE idFamiglia = ?
  `;

  db.query(query, [idFamiglia], (err, results) => {
    if (err) {
      console.error("Errore query profilo famiglia:", err);
      return res.status(500).json({ error: "Errore database" });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: "Profilo non trovato" });
    }

    console.log("Profilo trovato per famiglia:", idFamiglia);
    res.json(results[0]);
  });
});

  // Route per aggiornare i dati del profilo famiglia (SENZA email)
app.put("/api/family-profile", autentica, (req, res) => {
  if (req.utente.ruolo !== "G") {
    return res.status(403).json({
      error: "Accesso negato. Solo le famiglie possono modificare il profilo.",
    });
  }

  const idFamiglia = req.utente.id;
  const { cognome_famiglia, numero_telefono, email_studente } = req.body;

  console.log("Aggiornamento profilo per famiglia ID:", idFamiglia);

  // Validazione input (EMAIL RIMOSSA per sicurezza)
  if (!cognome_famiglia || !numero_telefono || !email_studente) {
    return res.status(400).json({ 
      error: "Tutti i campi (cognome famiglia, telefono, email studente) sono obbligatori" 
    });
  }

  // Validazione formato telefono (opzionale)
  const phoneRegex = /^[\+]?[0-9\s\-\(\)]{10,}$/;
  if (!phoneRegex.test(numero_telefono)) {
    return res.status(400).json({ 
      error: "Formato numero di telefono non valido" 
    });
  }

  // Validazione formato email studente
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email_studente)) {
    return res.status(400).json({ error: "Formato email studente non valido" });
  }

  // Verifica che lo studente esista
  const checkStudenteQuery = "SELECT idStudente FROM studente WHERE email = ?";
  
  db.query(checkStudenteQuery, [email_studente], (err, studentResults) => {
    if (err) {
      console.error("Errore verifica studente:", err);
      return res.status(500).json({ error: "Errore database" });
    }

    if (studentResults.length === 0) {
      return res.status(400).json({ 
        error: "Studente non trovato con l'email specificata" 
      });
    }

    // Aggiorna il profilo SENZA L'EMAIL
    const updateQuery = `
      UPDATE famiglia 
      SET cognome_famiglia = ?, numero_telefono = ?, email_studente = ?
      WHERE idFamiglia = ?
    `;

    db.query(updateQuery, [cognome_famiglia, numero_telefono, email_studente, idFamiglia], (err, result) => {
      if (err) {
        console.error("Errore aggiornamento profilo famiglia:", err);
        return res.status(500).json({ error: "Errore durante l'aggiornamento" });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Profilo non trovato" });
      }

      console.log("Profilo famiglia aggiornato con successo:", idFamiglia);
      res.json({ 
        message: "Profilo aggiornato con successo",
        note: "L'email non può essere modificata per motivi di sicurezza"
      });
    });
  });
});

// Route per eliminare il profilo famiglia
app.delete("/api/family-profile", autentica, (req, res) => {
  if (req.utente.ruolo !== "G") {
    return res.status(403).json({
      error: "Accesso negato. Solo le famiglie possono eliminare il profilo.",
    });
  }

  const idFamiglia = req.utente.id;
  console.log("Eliminazione profilo per famiglia ID:", idFamiglia);

  // Elimina direttamente il profilo famiglia
  const deleteFamigliaQuery = "DELETE FROM famiglia WHERE idFamiglia = ?";
  
  db.query(deleteFamigliaQuery, [idFamiglia], (err, result) => {
    if (err) {
      console.error("Errore eliminazione famiglia:", err);
      return res.status(500).json({ error: "Errore database" });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Profilo non trovato" });
    }

    console.log("Profilo famiglia eliminato con successo");
    res.json({ message: "Profilo eliminato con successo" });
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