const express = require('express');
const mysql = require('mysql2/promise'); // Usiamo la versione promise-based
const cors = require('cors');

const app = express();
const port = 3008;

// Middleware
app.use(cors());
app.use(express.json());

// Configurazione database
const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: '', // CONSIGLIO: Usa variabili d'ambiente per le credenziali
    database: 'step by step', // Nota: gli spazi nel nome del database potrebbero causare problemi
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

// Creazione pool di connessioni
const pool = mysql.createPool(dbConfig);

// Test connessione database (versione migliorata)
async function testDatabaseConnection() {
    let connection;
    try {
        connection = await pool.getConnection();
        console.log('Connessione al database stabilita con successo!');
    } catch (err) {
        console.error('Errore di connessione al database:', err);
    } finally {
        if (connection) connection.release();
    }
}

// Esegui il test all'avvio
testDatabaseConnection();

// Endpoint di test migliorato
app.get('/test-db', async (req, res) => {
    try {
        const [results] = await pool.query('SELECT 1');
        res.json({ 
            status: 'success',
            message: 'Connessione al database funzionante',
            data: results 
        });
    } catch (err) {
        console.error('Database error:', err);
        res.status(500).json({ 
            status: 'error',
            message: 'Errore di connessione al database',
            error: err.message 
        });
    }
});

// Gestione errori globale migliorata
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        status: 'error',
        message: 'Qualcosa è andato storto!',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
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

