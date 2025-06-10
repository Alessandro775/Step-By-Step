const express = require('express');
require('dotenv').config();
const mysql = require('mysql2');
const cors = require('cors');

const app = express();
const port = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Configurazione database
const db = mysql.createPool({
    host: process.env.DB_HOST,     // usa l'IP dell'altro computer
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Test connessione
db.getConnection((err, connection) => {
    if (err) {
        console.error('Errore di connessione al database:', err);
        return;
    }
    console.log('Database connesso con successo!');
    connection.release();
});

// Gestione errori globale
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Qualcosa è andato storto!');
});

// Avvio server
const server = app.listen(port, () => {
    console.log(`Server in esecuzione sulla porta ${port}`);
});

process.on('uncaughtException', (error) => {
    console.error('Errore non gestito:', error);
    server.close(() => {
        process.exit(1);
    });
});

// Gestione errori non catturati
process.on('unhandledRejection', (err) => {
    console.error('Errore non gestito:', err);
});

// ...existing code...
const createAuthenticationServices = require('./authenticationServices');
const authenticationServices = createAuthenticationServices(db);

// Route per la registrazione
app.post('/api/register', async (req, res) => {
    try {
        const result = await authenticationServices.register(req.body);
        res.json(result);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Route per il login
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const result = await authenticationServices.login(email, password);
        res.json(result);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

