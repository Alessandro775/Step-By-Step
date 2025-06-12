const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const app= express();
const port = 3000;
const jwt = require('jsonwebtoken');
app.use(cors());
app.use(express.json());
const JWT_SECRET = 'balla'; // In produzione, usa le variabili d'ambiente

const db= mysql.createConnection({
    host: '172.29.0.201',
    user: 'alessandro',
    password: '123456',
    database: 'step_by_step',
    port: 3306
});
app.listen(port, () => {
    console.log(`Server in ascolto sulla porta ${port}`);
});
db.connect((err) => {
    if (err) {
        console.error('Errore di connessione al database:', err);
        return;
    }
    console.log('Connessione al database stabilita con successo!');
});

app.post('/api/register', (req, res) => {
    console.log(req.body); 
    const { nome, cognome, email, password, istituto, classe, anno_scolastico } = req.body;
    db.query(
        'INSERT INTO studente (nome, cognome, email, password, istituto, classe, anno_scolastico) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [nome, cognome, email, password, istituto, classe, anno_scolastico],
        (err, results) => {
            if (err) {
                console.error('Errore durante la registrazione:', err);
                return res.status(500).json({ error: 'Errore durante la registrazione' });
            }
            res.status(201).json({ message: 'Registrazione avvenuta con successo' });
        }
    );});

app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    console.log('Dati di login ricevuti:', req.body);

    db.query('SELECT * FROM studente WHERE email = ?', [email], (err, results) => {
        if (err) {
            console.error('Errore database:', err);
            return res.status(500).json({ error: 'Errore di connessione al database' });
        }

        if (results.length === 0) {
            return res.status(401).json({ error: 'Utente non trovato' });
        }

        const user = results[0];
        
        // Verifica della password
        if (user.PASSWORD !== password) { // Nota: PASSWORD in maiuscolo come nel DB
            return res.status(401).json({ error: 'Password errata' });
        }

        try {
            const token = jwt.sign(
                { id: user.idStudente }, 
                JWT_SECRET, 
                { expiresIn: '24h' }
            );

            res.json({ 
                token, 
                user: { 
                    id: user.idStudente, 
                    nome: user.nome, 
                    cognome: user.cognome, 
                    email: user.email 
                } 
            });
        } catch (error) {
            console.error('Errore nella generazione del token:', error);
            res.status(500).json({ error: 'Errore interno del server' });
        }
    });
});