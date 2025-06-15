const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const jwt = require("jsonwebtoken");

// Configurazioni base
const app = express();
const port = 3000;
const JWT_SECRET = "balla";

// Middleware
app.use(cors({
    origin: "http://localhost:5173",
    credentials: true
}));
app.use(express.json());

// Configurazione Database
const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "step_by_step",
    port: 3306
});

// Route Autenticazione
app.post("/api/register", (req, res) => {
    const { nome, cognome, email, password, ruolo } = req.body;
    const query = "INSERT INTO utente (nome, cognome, email, password, ruolo) VALUES (?, ?, ?, ?, ?)";
    
    db.query(query, [nome, cognome, email, password, ruolo], (err, result) => {
        if (err) {
            console.error("Errore registrazione:", err);
            return res.status(500).json({ error: "Errore durante la registrazione" });
        }
        res.json({ message: "Registrazione completata con successo" });
    });
});

app.post("/api/login", (req, res) => {
    const { email, password } = req.body;
    const query = "SELECT * FROM utente WHERE email = ? AND password = ?";
    
    db.query(query, [email, password], (err, results) => {
        if (err) {
            return res.status(500).json({ error: "Errore login" });
        }
        if (results.length === 0) {
            return res.status(401).json({ error: "Credenziali non valide" });
        }
        
        const token = jwt.sign(
            { id: results[0].id, ruolo: results[0].ruolo },
            JWT_SECRET,
            { expiresIn: "1h" }
        );
        
        res.json({ token, ruolo: results[0].ruolo });
    });
});

// Route Studenti
app.get('/api/studenti', (req, res) => {
    const query = 'SELECT idStudente, nome, cognome, email FROM studente';
    db.query(query, (err, results) => {
        if (err) {
            console.error('Errore query:', err);
            return res.status(500).json({ error: 'Errore database' });
        }
        res.json(results);
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
app.get('/api/parole', (req, res) => {
    const query = 'SELECT * FROM contenuto';
    db.query(query, (err, results) => {
        if (err) {
            console.error('Errore query:', err);
            return res.status(500).json({ error: 'Errore database' });
        }
        console.log('Risultati query:', results); // Debug
        res.json(results);
    });
});