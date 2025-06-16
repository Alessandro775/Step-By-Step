const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const mysql = require('mysql2');

const app = express();
const port = 3000;
const JWT_SECRET = 'il-tuo-secret-key';

app.use(cors());
app.use(express.json());

// Configurazione database
const db = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'step_by_step',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Test connessione database
db.getConnection((err, connection) => {
    if (err) {
        console.error('Errore connessione database:', err);
        return;
    }
    console.log('Database connesso con successo!');
    connection.release();
});

// Registrazione utente
app.post("/api/register", async (req, res) => {
    console.log('Ricevuta richiesta di registrazione:', req.body);
    
    try {
        const { nome, cognome, email, password, ruolo, istituto, classe, anno_scolastico, telefono, emailStudente } = req.body;

        if (!email || !password || !nome || !cognome || !ruolo) {
            return res.status(400).json({ error: "Campi obbligatori mancanti" });
        }

        // Verifica email esistente
        const [emailResults] = await db.promise().query(
            `SELECT email FROM studente WHERE email = ?
             UNION SELECT email FROM educatore WHERE email = ?
             UNION SELECT email FROM famiglia WHERE email = ?`,
            [email, email, email]
        );

        if (emailResults.length > 0) {
            return res.status(409).json({ error: "Email già registrata" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        let query, params;

        switch(ruolo) {
            case "S":
                query = "INSERT INTO studente (nome, cognome, email, password, istituto, classe, anno_scolastico) VALUES (?, ?, ?, ?, ?, ?, ?)";
                params = [nome, cognome, email, hashedPassword, istituto, classe, anno_scolastico];
                break;
            case "E":
                query = "INSERT INTO educatore (nome, cognome, email, password, istituto) VALUES (?, ?, ?, ?, ?)";
                params = [nome, cognome, email, hashedPassword, istituto];
                break;
                case "G":
                    const [studentResults] = await db.promise().query(
                        "SELECT idStudente FROM studente WHERE email = ?",
                        [emailStudente]
                    );
                
                    if (studentResults.length === 0) {
                        return res.status(404).json({ error: "Email studente non trovata" });
                    }
                
                    const idStudente = studentResults[0].idStudente;
                
                    query = "INSERT INTO famiglia (cognome_famiglia, email, password, numero_telefono) VALUES (?, ?, ?, ?)";
                    params = [cognome, email, hashedPassword, telefono];
                
                    const [famigliaResult] = await db.promise().execute(query, params);
                    const idFamiglia = famigliaResult.insertId;
                
                    await db.promise().execute(
                        "INSERT INTO monitora (idFamiglia, idStudente) VALUES (?, ?)",
                        [idFamiglia, idStudente]
                    );
                
                    console.log(`Relazione famiglia-studente creata: famiglia ${idFamiglia} monitora studente ${idStudente}`);
                
                    return res.status(201).json({ 
                        message: "Registrazione famiglia completata con successo",
                        famigliaId: idFamiglia,
                        studenteId: idStudente
                    });
            }
    
            const [result] = await db.promise().execute(query, params);
            res.status(201).json({ message: "Registrazione completata con successo" });
            

    
        } catch (error) {
            console.error('Errore dettagliato:', error);
            res.status(500).json({ error: `Errore durante la registrazione: ${error.message}` });
        }
    });
    

// Avvio server
app.listen(port, () => {
    console.log(`Server in esecuzione sulla porta ${port}`);
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