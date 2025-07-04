const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");//comunicazione frontend backend
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");//crittorgafia della password
const multer = require("multer");
const path = require("path");
const fs = require("fs"); //operazioni sui file system

// Configurazioni base dell'applicazione
const app = express();
const port = 3000;
const JWT_SECRET = "balla"; // Chiave segreta per la firma dei token JWT

// Configurazione Database MySQL
const db = mysql.createConnection({
  host: "localhost", // Indirizzo del server MySQL
  user: "root",
  password: "",
  database: "step_by_step",
  port: 3306,
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

/*Abilita richieste cross-origin da qualsiasi dominio per permettere*/
app.use(
  cors({
    origin: "*", // Permette richieste da qualsiasi origine
    credentials: true, // Abilita l'invio di cookies e credenziali
  })
);

// Middleware per il parsing automatico del JSON nelle richieste
app.use(express.json());

// Servire file statici dalla cartella uploads per immagini e media
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Configurazione Multer per l'upload delle immagini
const storage = multer.diskStorage({
  //Definisce la cartella di destinazione per i file caricati
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, "uploads", "images");

    // Crea la cartella se non esiste
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }

    cb(null, uploadPath);
  },

  /**
   * Genera un nome file unico per evitare conflitti
   * Utilizza timestamp e numero casuale per garantire unicità
   */
  filename: function (req, file, cb) {
    // Genera nome file unico: timestamp + nome originale
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const extension = path.extname(file.originalname);
    cb(null, "img-" + uniqueSuffix + extension);
  },
});

/* Filtro per accettare solo file immagine che voglio io */
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true); // File accettato
  } else {
    cb(
      new Error("Tipo di file non supportato. Usa JPG, PNG, GIF o WebP"),
      false
    );
  }
};

//Configurazione completa di Multer
const upload = multer({
  storage: storage, // dove salvare i file
  fileFilter: fileFilter, //quali file accettare
  limits: {
    fileSize: 5 * 1024 * 1024, // Dimensione massima: 5MB
  },
});

//Route per l'upload di immagini
app.post("/api/upload-image", autentica, upload.single("image"), (req, res) => {
  //verifica che solo gli educatori possonocaricare le immagini
  if (req.utente.ruolo !== "E") {
    return res.status(403).json({
      error: "Accesso negato. Solo gli educatori possono caricare immagini.",
    });
  }

  try {
    // Verifica che sia stato caricato un file
    if (!req.file) {
      return res.status(400).json({ error: "Nessun file caricato" });
    }

    // Costruisce l'URL pubblico dell'immagine caricata
    const imageUrl = `http://localhost:${port}/uploads/images/${req.file.filename}`;

    console.log("Immagine caricata:", req.file.filename);

    // Restituisce l'URL dell'immagine per l'utilizzo nel frontend
    res.json({
      message: "Immagine caricata con successo",
      imageUrl: imageUrl,
      filename: req.file.filename,
    });
  } catch (error) {
    console.error("Errore upload immagine:", error);
    res
      .status(500)
      .json({ error: "Errore durante il caricamento dell'immagine" });
  }
});

/*creare un nuovo esercizio e assegnarlo a uno studente*/
app.post("/api/studenti/:idStudente/contenuti", autentica, (req, res) => {
  if (req.utente.ruolo !== "E") {
    return res.status(403).json({
      error: "Accesso negato. Solo gli educatori possono aggiungere contenuti.",
    });
  }

  const idEducatore = req.utente.id;
  const idStudente = req.params.idStudente;
  const { testo, immagine, idEsercizio } = req.body;

  console.log("=== AGGIUNTA CONTENUTO CON IMMAGINE ===");
  console.log("Educatore:", idEducatore);
  console.log("Studente:", idStudente);
  console.log("Dati:", { testo, immagine, idEsercizio });

  // Validazione dei dati obbligatori
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

  db.query(
    verificaAssegnazione,
    [idEducatore, idStudente],
    (err, assegnazione) => {
      if (err) {
        console.error("Errore verifica assegnazione:", err);
        return res.status(500).json({ error: "Errore database" });
      }

      if (assegnazione.length === 0) {
        return res.status(403).json({
          error: "Studente non assegnato a questo educatore",
        });
      }

      // Inserisce il nuovo esercizio assegnato con URL dell'immagine
      const insertQuery = `
      INSERT INTO esercizio_assegnato (idStudente, idEsercizio, idEducatore, data_assegnazione, testo, immagine) 
      VALUES (?, ?, ?, CURDATE(), ?, ?)
    `;

      db.query(
        insertQuery,
        [idStudente, idEsercizio, idEducatore, testo, immagine || null],
        (err, result) => {
          if (err) {
            console.error("Errore inserimento contenuto:", err);
            return res
              .status(500)
              .json({ error: "Errore inserimento contenuto" });
          }

          res.status(201).json({
            message: "Contenuto creato e assegnato con successo",
            idEsercizioAssegnato: result.insertId,
          });
        }
      );
    }
  );
});

/*Fornisce messaggi di errore specifici per problemi di upload*/
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ error: "File troppo grande. Massimo 5MB" });
    }
  }

  if (
    error.message === "Tipo di file non supportato. Usa JPG, PNG, GIF o WebP"
  ) {
    return res.status(400).json({ error: error.message });
  }

  next(error);
});

function autentica(req, res, next) {
  const authHeader = req.headers["authorization"];
  if (!authHeader) {
    console.log("Token mancante nell'header");
    return res.status(401).json({ error: "Token mancante" });
  }
//autenticazione dell'header per tutti gli utenti
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

/* Route per la registrazione di nuovi utenti */
app.post("/api/register", async (req, res) => {
  console.log("Dati ricevuti:", req.body);
  // Estrazione di tutti i campi possibili dalla richiesta
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
    // Hashing sicuro della password con bcrypt
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    /*Gestione  registrazione delle famiglie, validazione dell'esistenza dello studente collegato*/
    if (ruolo === "G") {
      console.log("Registrazione famiglia in corso...");

      // Verifica che lo studente esista nel sistema
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

          // Se lo studente non esiste, blocca la registrazione
          if (studentResult.length === 0) {
            return res
              .status(400)
              .json({ error: "Studente non trovato con l'email specificata" });
          }

          // Inserimento della famiglia nel database
          const insertFamigliaQuery =
            "INSERT INTO famiglia (cognome_famiglia, email, password, numero_telefono, email_studente) VALUES (?, ?, ?, ?, ?)";
          const params = [
            cognome_famiglia,
            email,
            hashedPassword,
            numero_telefono,
            email_studente,
          ];

          db.query(insertFamigliaQuery, params, (err, result) => {
            if (err) {
              console.error("Errore registrazione:", err);
              // Gestione specifica per email duplicate
              if (err.code === "ER_DUP_ENTRY") {
                return res.status(409).json({ error: "Email già registrata" });
              }
              return res
                .status(500)
                .json({ error: "Errore durante la registrazione" });
            }

            console.log("Registrazione famiglia completata per:", email);

            // Generazione automatica del token JWT per auto-login
            const newUserId = result.insertId;
            const token = jwt.sign(
              {
                id: newUserId,
                ruolo: "G",
              },
              JWT_SECRET,
              {
                expiresIn: "1h",
              }
            );

            // Risposta con token per login automatico
            res.status(201).json({
              message: "Registrazione completata con successo",
              token,
              ruolo: "G",
              user: {
                id: newUserId,
                cognome_famiglia,
                email,
              },
            });
          });
        }
      );
    } else {
      /**
       * Gestione per studenti (ruolo "S") ed educatori (ruolo "E")
       * Costruisce query e parametri specifici per ogni tipo di utente
       */
      let query, params;

      if (ruolo === "S") {
        // Query per inserimento studente
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
        // Query per inserimento educatore
        query =
          "INSERT INTO educatore (nome, cognome, email, password, istituto) VALUES (?, ?, ?, ?, ?)";
        params = [nome, cognome, email, hashedPassword, istituto];
      }

      // Esecuzione dell'inserimento nel databas
      db.query(query, params, (err, result) => {
        if (err) {
          console.error("Errore registrazione:", err);
          // Gestione email duplicate
          if (err.code === "ER_DUP_ENTRY") {
            return res.status(409).json({ error: "Email già registrata" });
          }
          return res
            .status(500)
            .json({ error: "Errore durante la registrazione" });
        }

        console.log("Registrazione completata per:", email);

        // Generazione token per auto-login
        const newUserId = result.insertId;
        const token = jwt.sign(
          {
            id: newUserId,
            ruolo: ruolo,
          },
          JWT_SECRET,
          {
            expiresIn: "1h",
          }
        );

        // RESTITUISCI TOKEN E DATI UTENTE
        res.status(201).json({
          message: "Registrazione completata con successo",
          token,
          ruolo: ruolo,
          user: {
            id: newUserId,
            nome,
            cognome,
            email,
          },
        });
      });
    }
  } catch (error) {
    console.error("Errore nell'hashing della password:", error);
    return res.status(500).json({ error: "Errore interno del server" });
  }
});

/*login degli utenti */
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;
  console.log("Tentativo login per:", email);
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

    /**
     * Ricerca sequenziale dell'utente nelle diverse tabelle
     * Prima cerca tra gli studenti, poi educatori, infine famiglie
     */
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

    // Verifica la password con bcrypt
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      console.log("Password non valida per utente:", email);
      return res.status(401).json({ error: "Credenziali non valide" });
    }

    /**
     * Estrazione dell'ID utente specifico per ogni tipo
     * Ogni tabella ha un nome diverso per la chiave primaria
     */
    const userId =
      user.ruolo === "E"
        ? user.idEducatore
        : user.ruolo === "S"
        ? user.idStudente
        : user.idFamiglia;

    // Generazione del token JWT dei profili per la sessione
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

    // Risposta con token e dati utente
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
  const { nome, cognome, istituto } = req.body;

  console.log("Aggiornamento profilo per educatore ID:", idEducatore);

  // Validazione input (EMAIL ESCLUSA per sicurezza)
  if (!nome || !cognome || !istituto) {
    return res.status(400).json({
      error: "Tutti i campi (nome, cognome, istituto) sono obbligatori",
    });
  }

  // Aggiorna il profilo SENZA L'EMAIL
  const updateQuery = `
    UPDATE educatore 
    SET nome = ?, cognome = ?, istituto = ?
    WHERE idEducatore = ?
  `;

  db.query(
    updateQuery,
    [nome, cognome, istituto, idEducatore],
    (err, result) => {
      if (err) {
        console.error("Errore aggiornamento profilo educatore:", err);
        return res
          .status(500)
          .json({ error: "Errore durante l'aggiornamento" });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Profilo non trovato" });
      }

      console.log("Profilo educatore aggiornato con successo:", idEducatore);
      res.json({
        message: "Profilo aggiornato con successo",
        note: "L'email non può essere modificata per motivi di sicurezza",
      });
    }
  );
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
      error:
        "Tutti i campi (nome, cognome, istituto, classe, anno scolastico) sono obbligatori",
    });
  }

  // Validazione specifica per la classe
  const classiValide = ["1", "2", "3", "4", "5"];
  if (!classiValide.includes(classe)) {
    return res.status(400).json({
      error: "La classe deve essere un valore tra 1 e 5",
    });
  }

  // Aggiorna il profilo SENZA L'EMAIL
  const updateQuery = `
    UPDATE studente 
    SET nome = ?, cognome = ?, istituto = ?, classe = ?, anno_scolastico = ?
    WHERE idStudente = ?
  `;

  db.query(
    updateQuery,
    [nome, cognome, istituto, classe, anno_scolastico, idStudente],
    (err, result) => {
      if (err) {
        console.error("Errore aggiornamento profilo studente:", err);
        return res
          .status(500)
          .json({ error: "Errore durante l'aggiornamento" });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Profilo non trovato" });
      }

      console.log("Profilo studente aggiornato con successo:", idStudente);
      res.json({
        message: "Profilo aggiornato con successo",
        note: "L'email non può essere modificata per motivi di sicurezza",
      });
    }
  );
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

// Route per ottenere studenti dell'educatore
app.get("/api/studenti", autentica, (req, res) => {
  if (req.utente.ruolo !== "E") {
    return res.status(403).json({
      error: "Accesso negato. Solo gli educatori possono vedere gli studenti.",
    });
  }

  const idEducatore = req.utente.id;

  console.log("=== FETCH STUDENTI BACKEND ===");
  console.log("ID Educatore:", idEducatore);

  const query = `
    SELECT 
      s.idStudente, 
      s.nome, 
      s.cognome, 
      s.email, 
      s.istituto, 
      s.classe, 
      s.anno_scolastico,
      a.data_assegnazione
    FROM studente s
    JOIN assegnazione a ON s.idStudente = a.idStudente
    WHERE a.idEducatore = ?
    ORDER BY s.cognome, s.nome
  `;

  db.query(query, [idEducatore], (err, results) => {
    if (err) {
      console.error("Errore query studenti:", err);
      return res.status(500).json({ error: "Errore nel caricamento studenti" });
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
      error:
        "Accesso negato. Solo gli educatori possono visualizzare i contenuti.",
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

  db.query(
    verificaAssegnazione,
    [idEducatore, idStudente],
    (err, assegnazione) => {
      if (err) {
        console.error("Errore verifica assegnazione:", err);
        return res.status(500).json({ error: "Errore database" });
      }

      if (assegnazione.length === 0) {
        return res.status(403).json({
          error: "Studente non assegnato a questo educatore",
        });
      }

      // Query  per la nuova struttura
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
      WHERE ea.idStudente = ? 
        AND ea.idEducatore = ? 
        AND (ea.attivo IS NULL OR ea.attivo = TRUE)
      ORDER BY ea.data_assegnazione DESC
    `;

      db.query(query, [idStudente, idEducatore], (err, results) => {
        if (err) {
          console.error("Errore query contenuti:", err);
          return res.status(500).json({ error: "Errore database" });
        }

        console.log("Contenuti attivi trovati:", results.length);
        res.json(results);
      });
    }
  );
});

// Route per visualizzare la cronologia di uno studente
app.get("/api/studenti/:idStudente/cronologia", autentica, (req, res) => {
  if (req.utente.ruolo !== "E") {
    return res.status(403).json({
      error:
        "Accesso negato. Solo gli educatori possono visualizzare la cronologia.",
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

  db.query(
    verificaAssegnazione,
    [idEducatore, idStudente],
    (err, assegnazione) => {
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
    }
  );
});

// Route per cronologia studente (per lo studente stesso)
app.get("/api/student-cronologia", autentica, (req, res) => {
  if (req.utente.ruolo !== "S") {
    return res.status(403).json({
      error:
        "Accesso negato. Solo gli studenti possono accedere alla propria cronologia.",
    });
  }

  const idStudente = req.utente.id;
  console.log("=== CRONOLOGIA STUDENTE PERSONALE ===");
  console.log("ID Studente:", idStudente);

  const query = `
    SELECT 
      r.idRisultato,
      r.punteggio,
      r.numero_errori as numero_errori,
      r.tempo as tempo_impiegato,
      r.numero_tentativi as tentativi,
      ea.testo as titolo,
      e.descrizione as tipo_esercizio,
      e.tipologia as descrizione,
      r.data_esecuzione as data_completamento,
      r.idStudente
    FROM risultato r
    JOIN esercizio_assegnato ea ON r.idEsercizioAssegnato = ea.idEsercizioAssegnato
    JOIN esercizio e ON ea.idEsercizio = e.idEsercizio
    WHERE r.idStudente = ?
    ORDER BY r.data_esecuzione DESC  
  `;

  db.query(query, [idStudente], (err, results) => {
    if (err) {
      console.error("Errore query cronologia studente:", err);
      return res.status(500).json({ error: "Errore database" });
    }

    console.log("Record cronologia studente trovati:", results.length);
    res.json(results);
  });
});

// Route per cronologia famiglia (per vedere cronologia del figlio)
app.get("/api/family-cronologia", autentica, (req, res) => {
  if (req.utente.ruolo !== "G") {
    return res.status(403).json({
      error:
        "Accesso negato. Solo le famiglie possono accedere alla cronologia.",
    });
  }

  const idFamiglia = req.utente.id;
  console.log("=== CRONOLOGIA FAMIGLIA ===");
  console.log("ID Famiglia:", idFamiglia);

  // Prima trova lo studente collegato alla famiglia
  const findStudentQuery = `
    SELECT s.idStudente, s.nome, s.cognome
    FROM famiglia f
    JOIN studente s ON f.email_studente = s.email
    WHERE f.idFamiglia = ?
  `;

  db.query(findStudentQuery, [idFamiglia], (err, studentResults) => {
    if (err) {
      console.error("Errore ricerca studente:", err);
      return res.status(500).json({ error: "Errore database" });
    }

    if (studentResults.length === 0) {
      return res
        .status(404)
        .json({ error: "Studente non trovato per questa famiglia" });
    }

    const studente = studentResults[0];
    console.log("Studente trovato:", studente);

    // Poi recupera la cronologia dello studente
    const cronologiaQuery = `
      SELECT 
        r.idRisultato,
        r.punteggio,
        r.numero_errori as numero_errori,
        r.tempo as tempo_impiegato,
        r.numero_tentativi as tentativi,
        ea.testo as titolo,
        e.descrizione as tipo_esercizio,
        e.tipologia as descrizione,
        r.data_esecuzione as data_completamento,
        r.idStudente
      FROM risultato r
      JOIN esercizio_assegnato ea ON r.idEsercizioAssegnato = ea.idEsercizioAssegnato
      JOIN esercizio e ON ea.idEsercizio = e.idEsercizio
      WHERE r.idStudente = ?
      ORDER BY r.data_esecuzione DESC  
    `;

    db.query(cronologiaQuery, [studente.idStudente], (err, results) => {
      if (err) {
        console.error("Errore query cronologia famiglia:", err);
        return res.status(500).json({ error: "Errore database" });
      }

      console.log("Record cronologia famiglia trovati:", results.length);
      res.json({
        studente: studente,
        cronologia: results,
      });
    });
  });
});

// Route per "eliminare" un contenuto (SOFT DELETE)
app.delete(
  "/api/studenti/:idStudente/contenuti/:idEsercizioAssegnato",
  autentica,
  (req, res) => {
    if (req.utente.ruolo !== "E") {
      return res.status(403).json({
        error:
          "Accesso negato. Solo gli educatori possono eliminare contenuti.",
      });
    }

    const idEducatore = req.utente.id;
    const idStudente = req.params.idStudente;
    const idEsercizioAssegnato = req.params.idEsercizioAssegnato;

    console.log("=== SOFT DELETE CONTENUTO ===");
    console.log("Educatore:", idEducatore);
    console.log("Studente:", idStudente);
    console.log("EsercizioAssegnato:", idEsercizioAssegnato);

    // STEP 1: Verifica che lo studente sia assegnato all'educatore
    const verificaAssegnazione = `
      SELECT * FROM assegnazione 
      WHERE idEducatore = ? AND idStudente = ?
    `;

    db.query(
      verificaAssegnazione,
      [idEducatore, idStudente],
      (err, assegnazione) => {
        if (err) {
          console.error("Errore verifica assegnazione:", err);
          return res.status(500).json({ error: "Errore database" });
        }

        if (assegnazione.length === 0) {
          return res.status(403).json({
            error: "Studente non assegnato a questo educatore",
          });
        }

        // STEP 2: Verifica se il campo 'attivo' esiste, altrimenti lo aggiunge
        const checkColumnQuery = `
          SELECT COLUMN_NAME 
          FROM INFORMATION_SCHEMA.COLUMNS 
          WHERE TABLE_SCHEMA = 'step_by_step' 
            AND TABLE_NAME = 'esercizio_assegnato' 
            AND COLUMN_NAME = 'attivo'
        `;

        db.query(checkColumnQuery, (err, columnExists) => {
          if (err) {
            console.error("Errore verifica colonna:", err);
            return res.status(500).json({ error: "Errore database" });
          }

          // Se la colonna non esiste, la aggiunge
          if (columnExists.length === 0) {
            console.log("⚠️ Campo 'attivo' non trovato, lo aggiungo...");

            const addColumnQuery = `
              ALTER TABLE esercizio_assegnato 
              ADD COLUMN attivo BOOLEAN DEFAULT TRUE
            `;

            db.query(addColumnQuery, (err) => {
              if (err) {
                console.error("Errore aggiunta colonna attivo:", err);
                return res.status(500).json({
                  error: "Errore nell'aggiunta del campo attivo",
                });
              }

              console.log("✅ Campo 'attivo' aggiunto con successo");

              // Imposta tutti gli esercizi esistenti come attivi
              const updateExistingQuery = `
                UPDATE esercizio_assegnato 
                SET attivo = TRUE 
                WHERE attivo IS NULL
              `;

              db.query(updateExistingQuery, (err) => {
                if (err) {
                  console.error(
                    "Errore aggiornamento esercizi esistenti:",
                    err
                  );
                }
                console.log("✅ Esercizi esistenti impostati come attivi");

                // Procedi con il soft delete
                performSoftDelete();
              });
            });
          } else {
            console.log("✅ Campo 'attivo' già presente");
            // Procedi direttamente con il soft delete
            performSoftDelete();
          }
        });

        // STEP 3: Funzione per eseguire il soft delete
        function performSoftDelete() {
          // Prima conta i risultati esistenti per debug
          const contaRisultati = `
            SELECT COUNT(*) as totale FROM risultato 
            WHERE idEsercizioAssegnato = ?
          `;

          db.query(
            contaRisultati,
            [idEsercizioAssegnato],
            (err, conteggioRisultati) => {
              if (err) {
                console.error("Errore conteggio risultati:", err);
                return res.status(500).json({ error: "Errore database" });
              }

              const numeroRisultati = conteggioRisultati[0].totale;
              console.log(
                `📊 Esercizio ha ${numeroRisultati} risultati collegati`
              );

              // ✅ SOFT DELETE: Marca come non attivo SENZA toccare i risultati
              const disattivaEsercizio = `
              UPDATE esercizio_assegnato 
              SET attivo = FALSE 
              WHERE idEsercizioAssegnato = ? AND idStudente = ? AND idEducatore = ?
            `;

              db.query(
                disattivaEsercizio,
                [idEsercizioAssegnato, idStudente, idEducatore],
                (err, result) => {
                  if (err) {
                    console.error("Errore disattivazione esercizio:", err);
                    return res.status(500).json({
                      error: "Errore disattivazione esercizio",
                    });
                  }

                  if (result.affectedRows === 0) {
                    return res.status(404).json({
                      error: "Contenuto non trovato o già eliminato",
                    });
                  }

                  // ✅ VERIFICA POST-ELIMINAZIONE: I risultati sono ancora lì?
                  const verificaRisultatiPostEliminazione = `
                  SELECT COUNT(*) as totale FROM risultato 
                  WHERE idEsercizioAssegnato = ?
                `;

                  db.query(
                    verificaRisultatiPostEliminazione,
                    [idEsercizioAssegnato],
                    (err, verificaFinale) => {
                      if (err) {
                        console.error("Errore verifica finale:", err);
                      } else {
                        const risultatiFinali = verificaFinale[0].totale;
                        console.log(
                          `✅ Dopo soft delete: ${risultatiFinali} risultati ancora presenti`
                        );

                        if (risultatiFinali !== numeroRisultati) {
                          console.error(
                            `❌ PROBLEMA: Risultati persi! Prima: ${numeroRisultati}, Dopo: ${risultatiFinali}`
                          );
                        } else {
                          console.log(
                            `🎉 SUCCESSO: Tutti i ${numeroRisultati} risultati sono stati preservati!`
                          );
                        }
                      }

                      console.log(
                        "✅ Contenuto disattivato con successo - RISULTATI PRESERVATI"
                      );
                      res.json({
                        message: "Contenuto rimosso con successo",
                        note: "I risultati dello studente sono stati preservati completamente",
                        preservaRisultati: true,
                        debug: {
                          risultatiPreservati: numeroRisultati,
                          risultatiFinali:
                            verificaFinale?.[0]?.totale || numeroRisultati,
                          esercizioDisattivato: true,
                        },
                      });
                    }
                  );
                }
              );
            }
          );
        }
      }
    );
  }
);

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

// Route per riassegnare un esercizio
app.post(
  "/api/studenti/:idStudente/contenuti/:idEsercizioAssegnato/riassegna",
  autentica,
  (req, res) => {
    if (req.utente.ruolo !== "E") {
      return res.status(403).json({
        error:
          "Accesso negato. Solo gli educatori possono riassegnare esercizi.",
      });
    }

    const idEducatore = req.utente.id;
    const idStudente = req.params.idStudente;
    const idEsercizioAssegnato = req.params.idEsercizioAssegnato;

    console.log("=== RIASSEGNAZIONE ESERCIZIO ===");
    console.log("Educatore:", idEducatore);
    console.log("Studente:", idStudente);
    console.log("EsercizioAssegnato:", idEsercizioAssegnato);

    // Verifica che lo studente sia assegnato all'educatore
    const verificaAssegnazione = `
    SELECT * FROM assegnazione 
    WHERE idEducatore = ? AND idStudente = ?
  `;

    db.query(
      verificaAssegnazione,
      [idEducatore, idStudente],
      (err, assegnazione) => {
        if (err) {
          console.error("Errore verifica assegnazione:", err);
          return res.status(500).json({ error: "Errore database" });
        }

        if (assegnazione.length === 0) {
          return res.status(403).json({
            error: "Studente non assegnato a questo educatore",
          });
        }

        // Ottieni i dati dell'esercizio originale
        const getEsercizioQuery = `
      SELECT ea.*, e.tipologia, e.descrizione
      FROM esercizio_assegnato ea
      JOIN esercizio e ON ea.idEsercizio = e.idEsercizio
      WHERE ea.idEsercizioAssegnato = ? AND ea.idStudente = ? AND ea.idEducatore = ?
    `;

        db.query(
          getEsercizioQuery,
          [idEsercizioAssegnato, idStudente, idEducatore],
          (err, esercizioData) => {
            if (err) {
              console.error("Errore recupero esercizio:", err);
              return res.status(500).json({ error: "Errore database" });
            }

            if (esercizioData.length === 0) {
              return res.status(404).json({ error: "Esercizio non trovato" });
            }

            const esercizio = esercizioData[0];

            // Crea una nuova copia dell'esercizio
            const riassegnaQuery = `
        INSERT INTO esercizio_assegnato (idStudente, idEsercizio, idEducatore, data_assegnazione, testo, immagine)
        VALUES (?, ?, ?, CURDATE(), ?, ?)
      `;

            db.query(
              riassegnaQuery,
              [
                idStudente,
                esercizio.idEsercizio,
                idEducatore,
                esercizio.testo,
                esercizio.immagine,
              ],
              (err, result) => {
                if (err) {
                  console.error("Errore riassegnazione esercizio:", err);
                  return res
                    .status(500)
                    .json({ error: "Errore nella riassegnazione" });
                }

                console.log("Esercizio riassegnato con successo");
                res.json({
                  message: "Esercizio riassegnato con successo",
                  nuovoIdEsercizioAssegnato: result.insertId,
                });
              }
            );
          }
        );
      }
    );
  }
);

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

  db.query(
    verificaAssegnazione,
    [idEducatore, idStudente],
    (err, assegnazione) => {
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

      db.query(
        insertQuery,
        [idStudente, idEsercizio, idEducatore, testo, immagine || null],
        (err, result) => {
          if (err) {
            console.error("Errore inserimento contenuto:", err);
            return res
              .status(500)
              .json({ error: "Errore inserimento contenuto" });
          }

          res.status(201).json({
            message: "Contenuto creato e assegnato con successo",
            idEsercizioAssegnato: result.insertId,
          });
        }
      );
    }
  );
});

// Route per ottenere i dati del profilo famiglia// Route per statistiche studente
app.get("/api/student-stats", autentica, (req, res) => {
  if (req.utente.ruolo !== "S") {
    return res.status(403).json({
      error:
        "Accesso negato. Solo gli studenti possono accedere alle statistiche.",
    });
  }

  const idStudente = req.utente.id;
  console.log("=== STATISTICHE STUDENTE ===");
  console.log("ID Studente:", idStudente);

  // Query per contare esercizi completati
  const queryCompletati = `
    SELECT COUNT(DISTINCT r.idEsercizioAssegnato) as completati
    FROM risultato r
    JOIN esercizio_assegnato ea ON r.idEsercizioAssegnato = ea.idEsercizioAssegnato
    WHERE ea.idStudente = ?
  `;

  // Query per contare esercizi assegnati ma non completati
  const queryNonCompletati = `
    SELECT COUNT(*) as non_completati
    FROM esercizio_assegnato ea
    LEFT JOIN risultato r ON ea.idEsercizioAssegnato = r.idEsercizioAssegnato
    WHERE ea.idStudente = ? AND r.idRisultato IS NULL
  `;

  // Esegui entrambe le query
  db.query(queryCompletati, [idStudente], (err, risultatiCompletati) => {
    if (err) {
      console.error("Errore query esercizi completati:", err);
      return res.status(500).json({ error: "Errore database" });
    }

    db.query(
      queryNonCompletati,
      [idStudente],
      (err, risultatiNonCompletati) => {
        if (err) {
          console.error("Errore query esercizi non completati:", err);
          return res.status(500).json({ error: "Errore database" });
        }

        const stats = {
          esercizi_completati: risultatiCompletati[0].completati || 0,
          esercizi_non_completati:
            risultatiNonCompletati[0].non_completati || 0,
        };

        console.log("Statistiche calcolate:", stats);
        res.json(stats);
      }
    );
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
  console.log("Dati ricevuti:", {
    cognome_famiglia,
    numero_telefono,
    email_studente,
  }); // DEBUG

  // Validazione input
  if (!cognome_famiglia || !numero_telefono || !email_studente) {
    return res.status(400).json({
      error:
        "Tutti i campi (cognome famiglia, telefono, email studente) sono obbligatori",
    });
  }

  // validazione telefono
  const cleanPhone = numero_telefono.replace(/\s+/g, ""); // Rimuovi spazi
  if (
    cleanPhone.length < 8 ||
    !/^[\+]?[0-9\s\-\(\)\.]{8,}$/.test(numero_telefono)
  ) {
    console.log("Telefono non valido:", numero_telefono); // DEBUG
    return res.status(400).json({
      error: "Numero di telefono non valido (minimo 8 cifre)",
    });
  }

  // Validazione formato email studente
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email_studente)) {
    console.log("Email studente non valida:", email_studente); // DEBUG
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
      console.log("Studente non trovato:", email_studente); // DEBUG
      return res.status(400).json({
        error: "Studente non trovato con l'email specificata",
      });
    }

    console.log("Studente verificato, procedo con l'aggiornamento"); // DEBUG

    // Aggiorna il profilo
    const updateQuery = `
      UPDATE famiglia 
      SET cognome_famiglia = ?, numero_telefono = ?, email_studente = ?
      WHERE idFamiglia = ?
    `;

    db.query(
      updateQuery,
      [cognome_famiglia, numero_telefono, email_studente, idFamiglia],
      (err, result) => {
        if (err) {
          console.error("Errore aggiornamento profilo famiglia:", err);
          return res
            .status(500)
            .json({ error: "Errore durante l'aggiornamento" });
        }

        if (result.affectedRows === 0) {
          console.log("Nessuna riga aggiornata - profilo non trovato"); // DEBUG
          return res.status(404).json({ error: "Profilo non trovato" });
        }

        console.log("Profilo famiglia aggiornato con successo:", idFamiglia);
        console.log("Righe modificate:", result.affectedRows); // DEBUG
        res.json({
          message: "Profilo aggiornato con successo",
          note: "L'email non può essere modificata per motivi di sicurezza",
        });
      }
    );
  });
});

// Route per eliminare il profilo studente
app.delete("/api/student-profile", autentica, (req, res) => {
  if (req.utente.ruolo !== "S") {
    return res.status(403).json({
      error: "Accesso negato. Solo gli studenti possono eliminare il profilo.",
    });
  }

  const idStudente = req.utente.id;
  console.log("Eliminazione profilo per studente ID:", idStudente);

  // STEP 1: Elimina tutti i risultati degli esercizi dello studente
  const deleteRisultatiQuery = `
    DELETE r FROM risultato r
    JOIN esercizio_assegnato ea ON r.idEsercizioAssegnato = ea.idEsercizioAssegnato
    WHERE ea.idStudente = ?
  `;

  db.query(deleteRisultatiQuery, [idStudente], (err, result1) => {
    if (err) {
      console.error("Errore eliminazione risultati studente:", err);
      return res.status(500).json({ error: "Errore eliminazione risultati" });
    }

    console.log("Risultati studente eliminati:", result1.affectedRows);

    // STEP 2: Elimina tutti gli esercizi assegnati allo studente
    const deleteEserciziAssegnatiQuery =
      "DELETE FROM esercizio_assegnato WHERE idStudente = ?";

    db.query(deleteEserciziAssegnatiQuery, [idStudente], (err, result2) => {
      if (err) {
        console.error("Errore eliminazione esercizi assegnati studente:", err);
        return res
          .status(500)
          .json({ error: "Errore eliminazione esercizi assegnati" });
      }

      console.log(
        "Esercizi assegnati studente eliminati:",
        result2.affectedRows
      );

      // STEP 3: Elimina le assegnazioni studente-educatori
      const deleteAssegnazioniQuery =
        "DELETE FROM assegnazione WHERE idStudente = ?";

      db.query(deleteAssegnazioniQuery, [idStudente], (err, result3) => {
        if (err) {
          console.error("Errore eliminazione assegnazioni studente:", err);
          return res
            .status(500)
            .json({ error: "Errore eliminazione assegnazioni" });
        }

        console.log("Assegnazioni studente eliminate:", result3.affectedRows);

        // STEP 4: Elimina il profilo studente
        const deleteStudenteQuery = "DELETE FROM studente WHERE idStudente = ?";

        db.query(deleteStudenteQuery, [idStudente], (err, result4) => {
          if (err) {
            console.error("Errore eliminazione studente:", err);
            return res
              .status(500)
              .json({ error: "Errore eliminazione studente" });
          }

          if (result4.affectedRows === 0) {
            return res
              .status(404)
              .json({ error: "Profilo studente non trovato" });
          }

          console.log("Profilo studente eliminato con successo");
          console.log("Riepilogo eliminazione studente:");
          console.log("- Risultati eliminati:", result1.affectedRows);
          console.log("- Esercizi assegnati eliminati:", result2.affectedRows);
          console.log("- Assegnazioni eliminate:", result3.affectedRows);
          console.log("- Studente eliminato:", result4.affectedRows);

          res.json({
            message: "Profilo eliminato con successo",
            dettagli: {
              risultati: result1.affectedRows,
              esercizi_assegnati: result2.affectedRows,
              assegnazioni: result3.affectedRows,
              studente: result4.affectedRows,
            },
          });
        });
      });
    });
  });
});

// Route per eliminare il profilo famiglia (già esistente, ma migliorata)
app.delete("/api/family-profile", autentica, (req, res) => {
  if (req.utente.ruolo !== "G") {
    return res.status(403).json({
      error: "Accesso negato. Solo le famiglie possono eliminare il profilo.",
    });
  }

  const idFamiglia = req.utente.id;
  console.log("Eliminazione profilo per famiglia ID:", idFamiglia);

  // Elimina direttamente il profilo famiglia (non ha dipendenze)
  const deleteFamigliaQuery = "DELETE FROM famiglia WHERE idFamiglia = ?";

  db.query(deleteFamigliaQuery, [idFamiglia], (err, result) => {
    if (err) {
      console.error("Errore eliminazione famiglia:", err);
      return res.status(500).json({ error: "Errore database" });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Profilo famiglia non trovato" });
    }

    console.log("Profilo famiglia eliminato con successo");
    console.log("Riepilogo eliminazione famiglia:");
    console.log("- Famiglia eliminata:", result.affectedRows);

    res.json({
      message: "Profilo eliminato con successo",
      dettagli: {
        famiglia: result.affectedRows,
      },
    });
  });
});

// ==================== ELIMINAZIONE PROFILO EDUCATORE ====================
app.delete("/api/profile", autentica, (req, res) => {
  if (req.utente.ruolo !== "E") {
    return res.status(403).json({
      error: "Accesso negato. Solo gli educatori possono eliminare il profilo.",
    });
  }

  const idEducatore = req.utente.id;
  console.log("=== ELIMINAZIONE EDUCATORE ===");
  console.log("ID Educatore:", idEducatore);

  // STEP 1: Elimina tutti i risultati degli esercizi assegnati dall'educatore
  const deleteRisultatiQuery = `
    DELETE r FROM risultato r
    JOIN esercizio_assegnato ea ON r.idEsercizioAssegnato = ea.idEsercizioAssegnato
    WHERE ea.idEducatore = ?
  `;

  db.query(deleteRisultatiQuery, [idEducatore], (err, result1) => {
    if (err) {
      console.error("Errore eliminazione risultati:", err);
      return res.status(500).json({ error: "Errore eliminazione risultati" });
    }
    console.log("Risultati eliminati:", result1.affectedRows);

    // STEP 2: Elimina tutti gli esercizi assegnati dall'educatore
    const deleteEserciziAssegnatiQuery =
      "DELETE FROM esercizio_assegnato WHERE idEducatore = ?";

    db.query(deleteEserciziAssegnatiQuery, [idEducatore], (err, result2) => {
      if (err) {
        console.error("Errore eliminazione esercizi assegnati:", err);
        return res
          .status(500)
          .json({ error: "Errore eliminazione esercizi assegnati" });
      }
      console.log("Esercizi assegnati eliminati:", result2.affectedRows);

      // STEP 3: Elimina le assegnazioni studenti-educatore
      const deleteAssegnazioniQuery =
        "DELETE FROM assegnazione WHERE idEducatore = ?";

      db.query(deleteAssegnazioniQuery, [idEducatore], (err, result3) => {
        if (err) {
          console.error("Errore eliminazione assegnazioni:", err);
          return res
            .status(500)
            .json({ error: "Errore eliminazione assegnazioni" });
        }
        console.log("Assegnazioni eliminate:", result3.affectedRows);

        // STEP 4: Elimina il profilo educatore
        const deleteEducatoreQuery =
          "DELETE FROM educatore WHERE idEducatore = ?";

        db.query(deleteEducatoreQuery, [idEducatore], (err, result4) => {
          if (err) {
            console.error("Errore eliminazione educatore:", err);
            return res
              .status(500)
              .json({ error: "Errore eliminazione educatore" });
          }

          if (result4.affectedRows === 0) {
            return res
              .status(404)
              .json({ error: "Profilo educatore non trovato" });
          }

          console.log("=== EDUCATORE ELIMINATO CON SUCCESSO ===");
          res.json({
            message: "Profilo eliminato con successo",
            dettagli: {
              risultati: result1.affectedRows,
              esercizi_assegnati: result2.affectedRows,
              assegnazioni: result3.affectedRows,
              educatore: result4.affectedRows,
            },
          });
        });
      });
    });
  });
});

// ==================== ELIMINAZIONE PROFILO STUDENTE ====================
app.delete("/api/student-profile", autentica, (req, res) => {
  if (req.utente.ruolo !== "S") {
    return res.status(403).json({
      error: "Accesso negato. Solo gli studenti possono eliminare il profilo.",
    });
  }

  const idStudente = req.utente.id;
  console.log("=== ELIMINAZIONE STUDENTE ===");
  console.log("ID Studente:", idStudente);

  // STEP 1: Elimina tutti i risultati degli esercizi dello studente
  const deleteRisultatiQuery = `
    DELETE r FROM risultato r
    JOIN esercizio_assegnato ea ON r.idEsercizioAssegnato = ea.idEsercizioAssegnato
    WHERE ea.idStudente = ? OR r.idStudente = ?
  `;

  db.query(deleteRisultatiQuery, [idStudente, idStudente], (err, result1) => {
    if (err) {
      console.error("Errore eliminazione risultati studente:", err);
      return res.status(500).json({ error: "Errore eliminazione risultati" });
    }
    console.log("Risultati studente eliminati:", result1.affectedRows);

    // STEP 2: Elimina tutti gli esercizi assegnati allo studente
    const deleteEserciziAssegnatiQuery =
      "DELETE FROM esercizio_assegnato WHERE idStudente = ?";

    db.query(deleteEserciziAssegnatiQuery, [idStudente], (err, result2) => {
      if (err) {
        console.error("Errore eliminazione esercizi assegnati studente:", err);
        return res
          .status(500)
          .json({ error: "Errore eliminazione esercizi assegnati" });
      }
      console.log(
        "Esercizi assegnati studente eliminati:",
        result2.affectedRows
      );

      // STEP 3: Elimina le assegnazioni studente-educatori
      const deleteAssegnazioniQuery =
        "DELETE FROM assegnazione WHERE idStudente = ?";

      db.query(deleteAssegnazioniQuery, [idStudente], (err, result3) => {
        if (err) {
          console.error("Errore eliminazione assegnazioni studente:", err);
          return res
            .status(500)
            .json({ error: "Errore eliminazione assegnazioni" });
        }
        console.log("Assegnazioni studente eliminate:", result3.affectedRows);

        // STEP 4: Elimina il profilo studente
        const deleteStudenteQuery = "DELETE FROM studente WHERE idStudente = ?";

        db.query(deleteStudenteQuery, [idStudente], (err, result4) => {
          if (err) {
            console.error("Errore eliminazione studente:", err);
            return res
              .status(500)
              .json({ error: "Errore eliminazione studente" });
          }

          if (result4.affectedRows === 0) {
            return res
              .status(404)
              .json({ error: "Profilo studente non trovato" });
          }

          console.log("=== STUDENTE ELIMINATO CON SUCCESSO ===");
          res.json({
            message: "Profilo eliminato con successo",
            dettagli: {
              risultati: result1.affectedRows,
              esercizi_assegnati: result2.affectedRows,
              assegnazioni: result3.affectedRows,
              studente: result4.affectedRows,
            },
          });
        });
      });
    });
  });
});

// ==================== ELIMINAZIONE PROFILO FAMIGLIA ====================
app.delete("/api/family-profile", autentica, (req, res) => {
  if (req.utente.ruolo !== "G") {
    return res.status(403).json({
      error: "Accesso negato. Solo le famiglie possono eliminare il profilo.",
    });
  }

  const idFamiglia = req.utente.id;
  console.log("=== ELIMINAZIONE FAMIGLIA ===");
  console.log("ID Famiglia:", idFamiglia);

  // La famiglia non ha dipendenze dirette nel database, elimina direttamente
  const deleteFamigliaQuery = "DELETE FROM famiglia WHERE idFamiglia = ?";

  db.query(deleteFamigliaQuery, [idFamiglia], (err, result) => {
    if (err) {
      console.error("Errore eliminazione famiglia:", err);
      return res.status(500).json({ error: "Errore database" });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Profilo famiglia non trovato" });
    }

    console.log("=== FAMIGLIA ELIMINATA CON SUCCESSO ===");
    res.json({
      message: "Profilo eliminato con successo",
      dettagli: {
        famiglia: result.affectedRows,
      },
    });
  });
});

// Gestione errori generica
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Errore interno del server" });
});