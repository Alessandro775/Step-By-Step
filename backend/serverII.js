const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

const app = express();
const port = 3000;
const JWT_SECRET = "balla";

// Middleware
app.use(cors({
    origin: "*",
    credentials: true
}));
app.use(express.json());

// Configurazione Database
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'step_by_step',
    port: 3306
});

// Middleware per autenticazione JWT
function autentica(req, res, next) {
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
        console.log("Token mancante nell'header");
        return res.status(401).json({ error: 'Token mancante' });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
        console.log("Token non fornito");
        return res.status(401).json({ error: 'Token mancante' });
    }

    try {
        const payload = jwt.verify(token, JWT_SECRET);
        req.utente = payload;
        console.log("Token verificato per utente:", payload.id, "ruolo:", payload.ruolo);
        next();
    } catch (err) {
        console.log("Token non valido:", err.message);
        return res.status(403).json({ error: 'Token non valido' });
    }
}

// Route di registrazione
app.post("/api/register", async (req, res) => {
    console.log("Dati ricevuti per registrazione:", req.body);
    const { nome, cognome, email, password, ruolo, istituto, classe, anno_scolastico, telefono, emailStudente } = req.body;
    
    if (!nome || !cognome || !email || !password || !ruolo) {
        return res.status(400).json({ error: "Campi obbligatori mancanti" });
    }
    
    try {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        
        let query, params;
        
        if (ruolo === "S") {
            query = "INSERT INTO studente (nome, cognome, email, password, istituto, classe, anno_scolastico) VALUES (?, ?, ?, ?, ?, ?, ?)";
            params = [nome, cognome, email, hashedPassword, istituto, classe, anno_scolastico];
        } else if (ruolo === "E") {
            query = "INSERT INTO educatore (nome, cognome, email, password, istituto) VALUES (?, ?, ?, ?, ?)";
            params = [nome, cognome, email, hashedPassword, istituto];
        } else if (ruolo === "G") {
            query = "INSERT INTO genitore (nome, cognome, email, password, telefono, email_studente) VALUES (?, ?, ?, ?, ?, ?)";
            params = [nome, cognome, email, hashedPassword, telefono, emailStudente];
        } else {
            return res.status(400).json({ error: "Ruolo non valido" });
        }
        
        db.query(query, params, (err, result) => {
            if (err) {
                console.error("Errore registrazione:", err);
                if (err.code === 'ER_DUP_ENTRY') {
                    return res.status(409).json({ error: "Email già registrata" });
                }
                return res.status(500).json({ error: "Errore durante la registrazione" });
            }
            console.log("Registrazione completata per:", email);
            res.status(201).json({ message: "Registrazione completata con successo" });
        });
        
    } catch (error) {
        console.error('Errore nell\'hashing della password:', error);
        return res.status(500).json({ error: 'Errore interno del server' });
    }
});

// Route di login
app.post("/api/login", async (req, res) => {
    const { email, password } = req.body;
    console.log("Tentativo login per:", email);

    if (!email || !password) {
        return res.status(400).json({ error: "Email e password sono obbligatori" });
    }

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

        // Prima cerca nella tabella studenti
        result = await queryAsync("SELECT *, 'S' as ruolo FROM studente WHERE email = ?", [email]);
        
        // Se non trovato, cerca tra gli educatori
        if (result.length === 0) {
            result = await queryAsync("SELECT *, 'E' as ruolo FROM educatore WHERE email = ?", [email]);
        }

// Se non trovato, cerca tra i genitori
if (result.length === 0) {
    result = await queryAsync("SELECT *, 'G' as ruolo FROM famiglia WHERE email = ?", [email]);
}

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

        // Usa l'ID corretto per il tipo di utente
        const userId = user.idStudente || user.idEducatore || user.idFamiglia;

        // Genera il token JWT
        const token = jwt.sign(
            { id: userId, ruolo: user.ruolo },
            JWT_SECRET,
            { expiresIn: "24h" }
        );

        console.log("Login riuscito - Token generato per utente ID:", userId, "Ruolo:", user.ruolo);

        res.json({
            token,
            ruolo: user.ruolo,
            user: {
                id: userId,
                nome: user.nome,
                cognome: user.cognome,
                email: user.email
            }
        });

    } catch (error) {
        console.error("Errore durante il login:", error);
        res.status(500).json({ error: "Errore interno del server" });
    }
});

// Route per ottenere lista studenti (solo educatori)
app.get('/api/studenti', autentica, (req, res) => {
    if (req.utente.ruolo !== 'E') {
        console.log("Accesso negato - ruolo:", req.utente.ruolo);
        return res.status(403).json({ error: 'Accesso negato. Solo gli educatori possono vedere gli studenti.' });
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
            console.error('Errore query studenti:', err);
            return res.status(500).json({ error: 'Errore database' });
        }
        console.log("Studenti trovati:", results.length);
        res.json(results);
    });
});

// Route per aggiungere studente (solo educatori)
app.post('/api/studenti', autentica, (req, res) => {
    if (req.utente.ruolo !== 'E') {
        return res.status(403).json({ error: 'Accesso negato. Solo gli educatori possono aggiungere studenti.' });
    }

    const idEducatore = req.utente.id;
    const { email } = req.body;

    console.log("Aggiunta studente - Educatore:", idEducatore, "Email studente:", email);

    if (!email || !email.trim()) {
        return res.status(400).json({ error: 'Email mancante o non valida' });
    }

    // Verifica se lo studente esiste
    const cercaStudente = 'SELECT idStudente FROM studente WHERE email = ?';
    db.query(cercaStudente, [email.trim()], (err, results) => {
        if (err) {
            console.error('[ERRORE cercaStudente]', err);
            return res.status(500).json({ error: 'Errore database (cercaStudente)' });
        }

        if (results.length === 0) {
            console.warn('[STUDENTE NON TROVATO]', email);
            return res.status(404).json({ error: 'Studente non trovato. Verifica che sia registrato nel sistema.' });
        }

        const idStudente = results[0].idStudente;
        console.log("Studente trovato - ID:", idStudente);

        // Verifica se l'associazione esiste già
        const verificaAssociazione = 'SELECT * FROM assegnazione WHERE idEducatore = ? AND idStudente = ?';
        db.query(verificaAssociazione, [idEducatore, idStudente], (err2, existing) => {
            if (err2) {
                console.error('[ERRORE verificaAssociazione]', err2);
                return res.status(500).json({ error: 'Errore database (verificaAssociazione)' });
            }

            if (existing.length > 0) {
                console.log("Associazione già esistente");
                return res.status(409).json({ error: 'Studente già assegnato a questo educatore' });
            }

            // Inserisci nuova associazione
            const inserisci = 'INSERT INTO assegnazione (idEducatore, idStudente, data_assegnazione) VALUES (?, ?, CURDATE())';
            db.query(inserisci, [idEducatore, idStudente], (err3, result) => {
                if (err3) {
                    console.error('[ERRORE INSERIMENTO assegnazione]', err3);
                    return res.status(500).json({ error: 'Errore database (inserimento)' });
                }

                console.log("Studente assegnato correttamente");
                res.status(201).json({ message: 'Studente assegnato correttamente' });
            });
        });
    });
});

// Route per eliminare studente (solo educatori)
app.delete('/api/studenti/:idStudente', autentica, (req, res) => {
    if (req.utente.ruolo !== 'E') {
        return res.status(403).json({ error: 'Accesso negato. Solo gli educatori possono rimuovere studenti.' });
    }

    const idEducatore = req.utente.id;
    const idStudente = req.params.idStudente;

    console.log("Eliminazione studente - Educatore:", idEducatore, "Studente:", idStudente);

    if (!idStudente || isNaN(idStudente)) {
        return res.status(400).json({ error: 'ID studente non valido' });
    }

    const elimina = 'DELETE FROM assegnazione WHERE idEducatore = ? AND idStudente = ?';
    db.query(elimina, [idEducatore, parseInt(idStudente)], (err, result) => {
        if (err) {
            console.error('Errore eliminazione:', err);
            return res.status(500).json({ error: 'Errore database' });
        }

        if (result.affectedRows === 0) {
            console.log("Associazione non trovata");
            return res.status(404).json({ error: 'Associazione non trovata' });
        }

        console.log("Studente rimosso correttamente");
        res.json({ message: 'Studente rimosso correttamente' });
    });
});

// Route per le parole/contenuti
app.get('/api/parole', (req, res) => {
    const query = 'SELECT * FROM contenuto ORDER BY parola';
    db.query(query, (err, results) => {
        if (err) {
            console.error('Errore query parole:', err);
            return res.status(500).json({ error: 'Errore database' });
        }
        console.log('Parole caricate:', results.length);
        res.json(results);
    });
});

// Route di test per verificare connessione
app.get('/api/test', (req, res) => {
    res.json({ message: 'Server funzionante', timestamp: new Date().toISOString() });
});

// Gestione errori generica
app.use((err, req, res, next) => {
    console.error('Errore non gestito:', err.stack);
    res.status(500).json({ error: "Errore interno del server" });
});

// Route 404
app.use('*', (req, res) => {
    console.log('Route non trovata:', req.method, req.originalUrl);
    res.status(404).json({ error: 'Route non trovata' });
});

// Connessione al database e avvio server
db.connect((err) => {
    if (err) {
        console.error("Errore di connessione al database:", err);
        process.exit(1);
    }
    console.log("Connessione al database stabilita con successo!");
    
    app.listen(port, () => {
        console.log(`Server in ascolto sulla porta ${port}`);
        console.log(`URL di test: http://localhost:${port}/api/test`);
    });
});

// Gestione chiusura graceful
process.on('SIGINT', () => {
    console.log('Chiusura server...');
    db.end();
    process.exit(0);
});
