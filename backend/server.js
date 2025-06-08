const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();
const port = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Configurazione database
const db = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'step-by-step',
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
app.listen(port, () => {
    console.log(`Server in esecuzione sulla porta ${port}`);
});

// Gestione errori non catturati
process.on('unhandledRejection', (err) => {
    console.error('Errore non gestito:', err);
});

module.exports = app;