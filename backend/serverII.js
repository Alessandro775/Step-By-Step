const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const multer = require("multer"); // NUOVO
const path = require("path"); // NUOVO
const fs = require("fs"); // NUOVO

// Configurazioni base
const app = express();
const port = 3000;
const JWT_SECRET = "balla";

// Middleware esistenti
app.use(
  cors({
    origin: "*",
    credentials: true,
  })
);
app.use(express.json());

// NUOVO: Servire file statici dalla cartella uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// NUOVO: Configurazione Multer per upload immagini
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, 'uploads', 'images');
    
    // Crea la cartella se non esiste
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    // Genera nome file unico: timestamp + nome originale
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, 'img-' + uniqueSuffix + extension);
  }
});

// Filtro per accettare solo immagini
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Tipo di file non supportato. Usa JPG, PNG, GIF o WebP'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // Limite 5MB
  }
});

// NUOVA ROUTE: Upload immagine
app.post("/api/upload-image", autentica, upload.single('image'), (req, res) => {
  if (req.utente.ruolo !== "E") {
    return res.status(403).json({
      error: "Accesso negato. Solo gli educatori possono caricare immagini.",
    });
  }

  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Nessun file caricato' });
    }

    // Costruisci l'URL dell'immagine
    const imageUrl = `http://localhost:${port}/uploads/images/${req.file.filename}`;
    
    console.log('Immagine caricata:', req.file.filename);
    
    res.json({
      message: 'Immagine caricata con successo',
      imageUrl: imageUrl,
      filename: req.file.filename
    });
    
  } catch (error) {
    console.error('Errore upload immagine:', error);
    res.status(500).json({ error: 'Errore durante il caricamento dell\'immagine' });
  }
});

// MODIFICA la route esistente per creare contenuti
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

    // Inserisci in esercizio_assegnato con l'URL dell'immagine
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

// Gestione errori Multer
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File troppo grande. Massimo 5MB' });
    }
  }
  
  if (error.message === 'Tipo di file non supportato. Usa JPG, PNG, GIF o WebP') {
    return res.status(400).json({ error: error.message });
  }
  
  next(error);
});

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

          db.query(insertFamigliaQuery, params, (err, result) => {
            if (err) {
              console.error("Errore registrazione:", err);
              if (err.code === "ER_DUP_ENTRY") {
                return res.status(409).json({ error: "Email già registrata" });
              }
              return res
                .status(500)
                .json({ error: "Errore durante la registrazione" });
            }
            
            console.log("Registrazione famiglia completata per:", email);
            
            // ✅ GENERA TOKEN DOPO REGISTRAZIONE FAMIGLIA
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

            // ✅ RESTITUISCI TOKEN E DATI UTENTE
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
        
        // ✅ GENERA TOKEN DOPO REGISTRAZIONE STUDENTE/EDUCATORE
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

        // ✅ RESTITUISCI TOKEN E DATI UTENTE
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
  const { nome, cognome, istituto } = req.body;

  console.log("Aggiornamento profilo per educatore ID:", idEducatore);

  // Validazione input (EMAIL ESCLUSA per sicurezza)
  if (!nome || !cognome || !istituto) {
    return res.status(400).json({ 
      error: "Tutti i campi (nome, cognome, istituto) sono obbligatori" 

    });
  }

  // Aggiorna il profilo SENZA L'EMAIL
  const updateQuery = `
    UPDATE educatore 
    SET nome = ?, cognome = ?, istituto = ?
    WHERE idEducatore = ?
  `;

  db.query(updateQuery, [nome, cognome, istituto, idEducatore], (err, result) => {
    if (err) {
      console.error("Errore aggiornamento profilo educatore:", err);
      return res.status(500).json({ error: "Errore durante l'aggiornamento" });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Profilo non trovato" });
    }

    console.log("Profilo educatore aggiornato con successo:", idEducatore);
    res.json({ 
      message: "Profilo aggiornato con successo",
      note: "L'email non può essere modificata per motivi di sicurezza"
    });
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
app.get('/api/studenti', autentica, (req, res) => {
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
      console.error('Errore query studenti:', err);
      return res.status(500).json({ error: 'Errore nel caricamento studenti' });
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

// Route per cronologia studente (per lo studente stesso)
app.get("/api/student-cronologia", autentica, (req, res) => {
  if (req.utente.ruolo !== "S") {
    return res.status(403).json({
      error: "Accesso negato. Solo gli studenti possono accedere alla propria cronologia.",
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
      r.traccia_audio as traccia_audio,
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
      error: "Accesso negato. Solo le famiglie possono accedere alla cronologia.",
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
      return res.status(404).json({ error: "Studente non trovato per questa famiglia" });
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
        r.traccia_audio as traccia_audio,
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
        cronologia: results
      });
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
  console.log("Dati ricevuti:", { cognome_famiglia, numero_telefono, email_studente }); // DEBUG

  // Validazione input
  if (!cognome_famiglia || !numero_telefono || !email_studente) {
    return res.status(400).json({ 
      error: "Tutti i campi (cognome famiglia, telefono, email studente) sono obbligatori" 
    });
  }

  // VALIDAZIONE TELEFONO PIÙ FLESSIBILE
  const cleanPhone = numero_telefono.replace(/\s+/g, ''); // Rimuovi spazi
  if (cleanPhone.length < 8 || !/^[\+]?[0-9\s\-\(\)\.]{8,}$/.test(numero_telefono)) {
    console.log("Telefono non valido:", numero_telefono); // DEBUG
    return res.status(400).json({ 
      error: "Numero di telefono non valido (minimo 8 cifre)" 
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
        error: "Studente non trovato con l'email specificata" 
      });
    }

    console.log("Studente verificato, procedo con l'aggiornamento"); // DEBUG

    // Aggiorna il profilo
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
        console.log("Nessuna riga aggiornata - profilo non trovato"); // DEBUG
        return res.status(404).json({ error: "Profilo non trovato" });
      }

      console.log("Profilo famiglia aggiornato con successo:", idFamiglia);
      console.log("Righe modificate:", result.affectedRows); // DEBUG
      res.json({ 
        message: "Profilo aggiornato con successo",
        note: "L'email non può essere modificata per motivi di sicurezza"
      });
    });
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
    const deleteEserciziAssegnatiQuery = "DELETE FROM esercizio_assegnato WHERE idStudente = ?";

    db.query(deleteEserciziAssegnatiQuery, [idStudente], (err, result2) => {
      if (err) {
        console.error("Errore eliminazione esercizi assegnati studente:", err);
        return res.status(500).json({ error: "Errore eliminazione esercizi assegnati" });
      }

      console.log("Esercizi assegnati studente eliminati:", result2.affectedRows);

      // STEP 3: Elimina le assegnazioni studente-educatori
      const deleteAssegnazioniQuery = "DELETE FROM assegnazione WHERE idStudente = ?";

      db.query(deleteAssegnazioniQuery, [idStudente], (err, result3) => {
        if (err) {
          console.error("Errore eliminazione assegnazioni studente:", err);
          return res.status(500).json({ error: "Errore eliminazione assegnazioni" });
        }

        console.log("Assegnazioni studente eliminate:", result3.affectedRows);

        // STEP 4: Elimina il profilo studente
        const deleteStudenteQuery = "DELETE FROM studente WHERE idStudente = ?";

        db.query(deleteStudenteQuery, [idStudente], (err, result4) => {
          if (err) {
            console.error("Errore eliminazione studente:", err);
            return res.status(500).json({ error: "Errore eliminazione studente" });
          }

          if (result4.affectedRows === 0) {
            return res.status(404).json({ error: "Profilo studente non trovato" });
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
              studente: result4.affectedRows
            }
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
        famiglia: result.affectedRows
      }
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
    const deleteEserciziAssegnatiQuery = "DELETE FROM esercizio_assegnato WHERE idEducatore = ?";

    db.query(deleteEserciziAssegnatiQuery, [idEducatore], (err, result2) => {
      if (err) {
        console.error("Errore eliminazione esercizi assegnati:", err);
        return res.status(500).json({ error: "Errore eliminazione esercizi assegnati" });
      }
      console.log("Esercizi assegnati eliminati:", result2.affectedRows);

      // STEP 3: Elimina le assegnazioni studenti-educatore
      const deleteAssegnazioniQuery = "DELETE FROM assegnazione WHERE idEducatore = ?";

      db.query(deleteAssegnazioniQuery, [idEducatore], (err, result3) => {
        if (err) {
          console.error("Errore eliminazione assegnazioni:", err);
          return res.status(500).json({ error: "Errore eliminazione assegnazioni" });
        }
        console.log("Assegnazioni eliminate:", result3.affectedRows);

        // STEP 4: Elimina il profilo educatore
        const deleteEducatoreQuery = "DELETE FROM educatore WHERE idEducatore = ?";

        db.query(deleteEducatoreQuery, [idEducatore], (err, result4) => {
          if (err) {
            console.error("Errore eliminazione educatore:", err);
            return res.status(500).json({ error: "Errore eliminazione educatore" });
          }

          if (result4.affectedRows === 0) {
            return res.status(404).json({ error: "Profilo educatore non trovato" });
          }

          console.log("=== EDUCATORE ELIMINATO CON SUCCESSO ===");
          res.json({ 
            message: "Profilo eliminato con successo",
            dettagli: {
              risultati: result1.affectedRows,
              esercizi_assegnati: result2.affectedRows,
              assegnazioni: result3.affectedRows,
              educatore: result4.affectedRows
            }
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
    const deleteEserciziAssegnatiQuery = "DELETE FROM esercizio_assegnato WHERE idStudente = ?";

    db.query(deleteEserciziAssegnatiQuery, [idStudente], (err, result2) => {
      if (err) {
        console.error("Errore eliminazione esercizi assegnati studente:", err);
        return res.status(500).json({ error: "Errore eliminazione esercizi assegnati" });
      }
      console.log("Esercizi assegnati studente eliminati:", result2.affectedRows);

      // STEP 3: Elimina le assegnazioni studente-educatori
      const deleteAssegnazioniQuery = "DELETE FROM assegnazione WHERE idStudente = ?";

      db.query(deleteAssegnazioniQuery, [idStudente], (err, result3) => {
        if (err) {
          console.error("Errore eliminazione assegnazioni studente:", err);
          return res.status(500).json({ error: "Errore eliminazione assegnazioni" });
        }
        console.log("Assegnazioni studente eliminate:", result3.affectedRows);

        // STEP 4: Elimina il profilo studente
        const deleteStudenteQuery = "DELETE FROM studente WHERE idStudente = ?";

        db.query(deleteStudenteQuery, [idStudente], (err, result4) => {
          if (err) {
            console.error("Errore eliminazione studente:", err);
            return res.status(500).json({ error: "Errore eliminazione studente" });
          }

          if (result4.affectedRows === 0) {
            return res.status(404).json({ error: "Profilo studente non trovato" });
          }

          console.log("=== STUDENTE ELIMINATO CON SUCCESSO ===");
          res.json({ 
            message: "Profilo eliminato con successo",
            dettagli: {
              risultati: result1.affectedRows,
              esercizi_assegnati: result2.affectedRows,
              assegnazioni: result3.affectedRows,
              studente: result4.affectedRows
            }
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
        famiglia: result.affectedRows
      }
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

