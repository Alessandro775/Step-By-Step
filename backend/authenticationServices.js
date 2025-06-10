const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

const createAuthenticationServices = (db) => ({
    async register(userData) {
        const { nome, cognome, email, password, istituto, classe, anno_scolastico } = userData;
        
        // Validazione dei campi numerici
        if (!Number.isInteger(classe) || !Number.isInteger(anno_scolastico)) {
            throw new Error('Classe e anno scolastico devono essere numeri interi');
        }

        return new Promise((resolve, reject) => {
            // Verifica se l'utente esiste già
            db.query('SELECT * FROM studente WHERE email = ?', [email], async (err, results) => {
                if (err) {
                    reject(err);
                    return;
                }
                
                if (results.length > 0) {
                    reject(new Error('Email già registrata'));
                    return;
                }

                // Hash della password
                const salt = await bcrypt.genSalt(10);
                const hashedPassword = await bcrypt.hash(password, salt);

                // Inserisci nuovo utente
                db.query(
                    'INSERT INTO studente (nome, cognome, email, password, istituto, classe, anno_scolastico) VALUES (?, ?, ?, ?, ?, ?, ?)',
                    [nome, cognome, email, hashedPassword, istituto, classe, anno_scolastico],
                    (err, result) => {
                        if (err) {
                            reject(err);
                            return;
                        }
                        resolve({ 
                            id: result.insertId, 
                            nome, 
                            cognome, 
                            email,
                            istituto,
                            classe,
                            anno_scolastico
                        });
                    }
                );
            });
        });
    },

    async login(email, password) {
    return new Promise((resolve, reject) => {
        console.log('Tentativo di login con email:', email);
        
        db.query('SELECT * FROM studente WHERE email = ?', [email], async (err, results) => {
            if (err) {
                console.error('Errore database:', err);
                reject(err);
                return;
            }

            console.log('Risultati query:', results);

            if (results.length === 0) {
                reject(new Error('User not found'));
                return;
            }

                const user = results[0];
                const validPassword = await bcrypt.compare(password, user.password);
                
                if (!validPassword) {
                    reject(new Error('Invalid password'));
                    return;
                }

                const token = jwt.sign({ id: user.id }, JWT_SECRET, {
                    expiresIn: '24h'
                });

                resolve({ 
                    token, 
                    user: { 
                        id: user.id, 
                        nome: user.nome,
                        cognome: user.cognome,
                        email: user.email,
                        istituto: user.istituto,
                        classe: user.classe,
                        anno_scolastico: user.anno_scolastico
                    } 
                });
            });
        });
    },

    verifyToken(token) {
        try {
            return jwt.verify(token, JWT_SECRET);
        } catch (error){
            throw new Error('Invalid token');
        }
    }
});

module.exports = createAuthenticationServices;