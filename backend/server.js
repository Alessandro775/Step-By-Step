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

// Avvio server (ho rimosso la chiamata duplicata)
const server = app.listen(port, () => {
    console.log(`Server in ascolto sulla porta ${port}`);
});

// Gestione graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM ricevuto. Chiudo il server...');
    server.close(() => {
        console.log('Server chiuso');
        pool.end(); // Chiude tutte le connessioni nel pool
    });
});

process.on('SIGINT', () => {
    console.log('SIGINT ricevuto. Chiudo il server...');
    server.close(() => {
        console.log('Server chiuso');
        pool.end();
    });
});

module.exports = { app, pool };