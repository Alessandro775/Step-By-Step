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
app.use(cors({
    origin: "*",//permette di far collegare qualsiasi PC al server
    credentials: true
}));
app.use(express.json());

// Configurazione Database
const db= mysql.createConnection({
    host: '172.29.13.94',
    user: 'alessandro',
    password: '123456',
    database: 'step_by_step',
    port: 3306
});

// Route Autenticazione
app.post("/api/register", async (req, res) => {
    console.log("Dati ricevuti:", req.body);
    const { nome, cognome, email, password, ruolo, istituto, classe, anno_scolastico, telefono, emailStudente } = req.body;
    
    try {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        
        let query, params;
        
        if (ruolo === "S") {
            // Studente
            query = "INSERT INTO studente (nome, cognome, email, password, istituto, classe, anno_scolastico) VALUES (?, ?, ?, ?, ?, ?, ?)";
            params = [nome, cognome, email, hashedPassword, istituto, classe, anno_scolastico];
        } else if (ruolo === "E") {
            // Educatore
            query = "INSERT INTO educatore (nome, cognome, email, password, istituto) VALUES (?, ?, ?, ?, ?)";
            params = [nome, cognome, email, hashedPassword, istituto];
        } else if (ruolo === "G") {
            // Genitore
            query = "INSERT INTO genitore (nome, cognome, email, password, telefono, email_studente) VALUES (?, ?, ?, ?, ?, ?)";
            params = [nome, cognome, email, hashedPassword, telefono, emailStudente];
        }
        
        db.query(query, params, (err, result) => {
            if (err) {
                console.error("Errore registrazione:", err);
                return res.status(500).json({ error: "Errore durante la registrazione" });
            }
            res.status(201).json({ message: "Registrazione completata con successo" });
        });
        
    } catch (error) {
        console.error('Errore nell\'hashing della password:', error);
        res.status(500).json({ error: 'Errore interno del server' });
    }
});



app.post("/api/login", async (req, res) => {
    const { email, password } = req.body;
    console.log("Tentativo login per:", email);

    // Funzione helper per promisificare le query MySQL
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
        result = await queryAsync("SELECT *, 'S' as ruolo FROM studente WHERE email = ?", [email]);
        
        // Se non trovato, cerca tra gli educatori
        if (result.length === 0) {
            result = await queryAsync("SELECT *, 'E' as ruolo FROM educatore WHERE email = ?", [email]);
        }

        // Se non trovato, cerca tra i genitori
        if (result.length === 0) {
            result = await queryAsync("SELECT *, 'G' as ruolo FROM genitore WHERE email = ?", [email]);
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
        const token = jwt.sign(
            { id: user.id, ruolo: user.ruolo },
            JWT_SECRET,
            { expiresIn: "1h" }
        );

        // Invia la risposta
        res.json({
            token,
            ruolo: user.ruolo,
            user: {
                id: user.id,
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
