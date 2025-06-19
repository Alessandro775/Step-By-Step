from flask import Flask, request, jsonify
from flask_cors import CORS
import whisper
import io
import tempfile
import os
from ollama import chat
import base64
import difflib
import ffmpeg
import random
import mysql.connector
from mysql.connector import Error
import requests

app = Flask(__name__)

# Configurazione CORS espansa
CORS(app, origins=["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:3001"],
     methods=['GET', 'POST', 'OPTIONS'],
     allow_headers=['Content-Type'])

# Configurazione Database
DB_CONFIG = {
    'host': '192.168.1.174',
    'user': 'alessandro',
    'password': '123456',
    'database': 'step_by_step',
    'port': 3306
}

def get_db_connection():
    """Crea una connessione al database"""
    try:
        connection = mysql.connector.connect(**DB_CONFIG)
        return connection
    except Error as e:
        print(f"Errore connessione database: {e}")
        return None

def get_parole_per_studente(id_studente):
    """Recupera le parole assegnate a uno studente specifico"""
    connection = get_db_connection()
    if not connection:
        return []
    
    try:
        cursor = connection.cursor()
        query = """
        SELECT ea.idEsercizioAssegnato, ea.testo, ea.immagine 
        FROM esercizio_assegnato ea
        JOIN esercizio e ON ea.idEsercizio = e.idEsercizio
        WHERE e.tipologia = 'pronuncia' 
        AND ea.idStudente = %s
        AND ea.testo IS NOT NULL 
        AND ea.testo != ''
        """
        cursor.execute(query, (id_studente,))
        results = cursor.fetchall()
        
        parole_studente = []
        for row in results:
            id_esercizio_assegnato = row[0]
            testo = row[1]
            immagine = row[2]
            
            # Gestione migliorata delle immagini
            if immagine and isinstance(immagine, str) and immagine.strip():
                immagine = immagine.strip()
                
                # Se inizia con 'http://localhost:3000/uploads', è un file locale del backend Node.js
                if immagine.startswith('http://localhost:3000/uploads'):
                    # Mantieni l'URL così com'è
                    pass
                # Se inizia con '/', è un file locale - aggiungi il dominio del frontend
                elif immagine.startswith('/'):
                    immagine = f'http://localhost:3000{immagine}'
                # Se non inizia con http, aggiungilo
                elif not immagine.startswith(('http://', 'https://')):
                    if immagine.startswith('//'):
                        immagine = 'https:' + immagine
                    else:
                        immagine = 'https://' + immagine
                
                parole_studente.append({
                    'idEsercizioAssegnato': id_esercizio_assegnato,
                    'testo': testo,
                    'immagine': immagine
                })
            else:
                parole_studente.append({
                    'idEsercizioAssegnato': id_esercizio_assegnato,
                    'testo': testo,
                    'immagine': None
                })
        
        print(f"✅ Caricate {len(parole_studente)} parole per studente {id_studente}")
        return parole_studente
        
    except Error as e:
        print(f"Errore query parole studente: {e}")
        return []
    finally:
        if connection.is_connected():
            cursor.close()
            connection.close()


def get_parole_italiane_from_db():
    """Recupera tutte le parole italiane dal database (per compatibilità)"""
    connection = get_db_connection()
    if not connection:
        return []
    
    try:
        cursor = connection.cursor()
        query = """
        SELECT DISTINCT ea.testo, ea.immagine 
        FROM esercizio_assegnato ea
        JOIN esercizio e ON ea.idEsercizio = e.idEsercizio
        WHERE e.tipologia = 'pronuncia' 
        AND ea.testo IS NOT NULL 
        AND ea.testo != ''
        """
        cursor.execute(query)
        results = cursor.fetchall()
        
        parole_con_immagini = []
        for row in results:
            testo = row[0]
            immagine = row[1]
            
            # Validazione e correzione del link dell'immagine
            if immagine and isinstance(immagine, str) and immagine.strip():
                immagine = immagine.strip()
                if not immagine.startswith(('http://', 'https://')):
                    if immagine.startswith('//'):
                        immagine = 'https:' + immagine
                    else:
                        immagine = 'https://' + immagine
                
                parole_con_immagini.append({
                    'testo': testo,
                    'immagine': immagine
                })
            else:
                parole_con_immagini.append({
                    'testo': testo,
                    'immagine': None
                })
        
        print(f"✅ Caricate {len(parole_con_immagini)} parole totali dal database")
        return parole_con_immagini
        
    except Error as e:
        print(f"Errore query database: {e}")
        return []
    finally:
        if connection.is_connected():
            cursor.close()
            connection.close()

def salva_risultato_pronuncia(id_studente, id_esercizio_assegnato, feedback, similarity, parola_pronunciata, tempo_impiegato, numero_tentativi):
    """Salva il risultato dell'esercizio di pronuncia nel database"""
    connection = get_db_connection()
    if not connection:
        return False
    
    try:
        cursor = connection.cursor()
        
        # Calcola il punteggio basato sul feedback
        if feedback == "BRAVO":
            punteggio = 100
            numero_errori = max(0, numero_tentativi - 1)  # L'ultimo tentativo è quello giusto
        elif feedback == "PROVA A FARE DI MEGLIO":
            punteggio = max(50, int(similarity * 100))
            numero_errori = numero_tentativi - 1
        else:  # SBAGLIATO
            punteggio = min(30, int(similarity * 100))
            numero_errori = numero_tentativi
        
        query = """
        INSERT INTO risultato 
        (idStudente, idEsercizioAssegnato, punteggio, numero_errori, tempo, 
         numero_tentativi, data_esecuzione) 
        VALUES (%s, %s, %s, %s, %s, %s, NOW())
        """
        
        cursor.execute(query, (
            id_studente,
            id_esercizio_assegnato,
            punteggio,
            numero_errori,
            tempo_impiegato,
            numero_tentativi
        ))
        
        connection.commit()
        print(f"✅ Risultato salvato per studente {id_studente}: {punteggio} punti, {numero_tentativi} tentativi, {tempo_impiegato}s")
        return True
        
    except Error as e:
        print(f"Errore salvataggio risultato: {e}")
        return False
    finally:
        if connection.is_connected():
            cursor.close()
            connection.close()


# Carica le parole dal database all'avvio (per compatibilità)
PAROLE_ITALIANE = get_parole_italiane_from_db()

# Carica il modello Whisper
try:
    whisper_model = whisper.load_model("base")
    print("✅ Modello Whisper caricato correttamente")
except Exception as e:
    print(f"❌ Errore caricamento Whisper: {e}")
    whisper_model = None

@app.route('/health', methods=['GET'])
def health_check():
    """Endpoint per verificare lo stato del server"""
    parole_aggiornate = get_parole_italiane_from_db()
    
    return jsonify({
        'status': 'healthy',
        'message': 'Server Flask funzionante',
        'available_words': len(parole_aggiornate),
        'whisper_loaded': whisper_model is not None,
        'database_connected': get_db_connection() is not None
    })

@app.route('/get_esercizi_studente', methods=['GET'])
def get_esercizi_studente():
    """Ottieni tutti gli esercizi assegnati a uno studente specifico"""
    try:
        id_studente = request.args.get('idStudente')
        
        if not id_studente:
            return jsonify({
                'error': 'ID studente mancante',
                'status': 'error'
            }), 400

        connection = get_db_connection()
        if not connection:
            return jsonify({
                'error': 'Errore connessione database', 
                'status': 'error'
            }), 500
        
        cursor = connection.cursor()
        
        # Query per ottenere tutti gli esercizi assegnati allo studente
        query = """
        SELECT ea.idEsercizioAssegnato, ea.testo, ea.immagine, 
               ea.data_assegnazione, e.tipologia, e.descrizione,
               r.idRisultato
        FROM esercizio_assegnato ea
        JOIN esercizio e ON ea.idEsercizio = e.idEsercizio
        LEFT JOIN risultato r ON ea.idEsercizioAssegnato = r.idEsercizioAssegnato
        WHERE ea.idStudente = %s 
        AND e.tipologia = 'pronuncia'
        AND ea.testo IS NOT NULL 
        AND ea.testo != ''
        ORDER BY ea.data_assegnazione DESC
        """
        
        cursor.execute(query, (id_studente,))
        results = cursor.fetchall()
        
        esercizi_assegnati = []
        for row in results:
            id_esercizio_assegnato = row[0]
            testo = row[1]
            immagine = row[2]
            data_assegnazione = row[3]
            tipologia = row[4]
            descrizione = row[5]
            completato = row[6] is not None  # Se c'è un risultato, è completato
            
            # Gestione immagine
            if immagine and isinstance(immagine, str) and immagine.strip():
                immagine = immagine.strip()
                if not immagine.startswith(('http://', 'https://')):
                    if immagine.startswith('//'):
                        immagine = 'https:' + immagine
                    else:
                        immagine = 'https://' + immagine
            
            esercizi_assegnati.append({
                'idEsercizioAssegnato': id_esercizio_assegnato,
                'testo': testo,
                'immagine': immagine,
                'data_assegnazione': data_assegnazione.strftime('%Y-%m-%d') if data_assegnazione else None,
                'tipologia': tipologia,
                'descrizione': descrizione,
                'completato': completato
            })
        
        print(f"✅ Trovati {len(esercizi_assegnati)} esercizi per studente {id_studente}")
        
        return jsonify({
            'esercizi': esercizi_assegnati,
            'totali': len(esercizi_assegnati),
            'completati': len([e for e in esercizi_assegnati if e['completato']]),
            'rimanenti': len([e for e in esercizi_assegnati if not e['completato']]),
            'status': 'success'
        })
        
    except Exception as e:
        print(f"❌ Errore nel recupero degli esercizi: {str(e)}")
        return jsonify({
            'error': f'Errore nel recupero degli esercizi: {str(e)}',
            'status': 'error'
        }), 500
    finally:
        if connection and connection.is_connected():
            cursor.close()
            connection.close()



@app.route('/get_esercizio_specifico', methods=['GET'])
def get_esercizio_specifico():
    """Ottieni un esercizio specifico per ID"""
    try:
        id_esercizio_assegnato = request.args.get('idEsercizioAssegnato')
        id_studente = request.args.get('idStudente')
        
        if not id_esercizio_assegnato or not id_studente:
            return jsonify({
                'error': 'Parametri mancanti',
                'status': 'error'
            }), 400

        connection = get_db_connection()
        if not connection:
            return jsonify({'error': 'Errore connessione database', 'status': 'error'}), 500
        
        cursor = connection.cursor()
        
        # Verifica che l'esercizio sia assegnato allo studente e non sia già completato
        query = """
        SELECT ea.idEsercizioAssegnato, ea.testo, ea.immagine, 
               ea.data_assegnazione, e.tipologia, e.descrizione,
               r.idRisultato
        FROM esercizio_assegnato ea
        JOIN esercizio e ON ea.idEsercizio = e.idEsercizio
        LEFT JOIN risultato r ON ea.idEsercizioAssegnato = r.idEsercizioAssegnato
        WHERE ea.idEsercizioAssegnato = %s 
        AND ea.idStudente = %s
        """
        
        cursor.execute(query, (id_esercizio_assegnato, id_studente))
        result = cursor.fetchone()
        
        if not result:
            return jsonify({
                'error': 'Esercizio non trovato o non assegnato a questo studente',
                'status': 'error'
            }), 404
        
        if result[6] is not None:  # Se c'è già un risultato
            return jsonify({
                'error': 'Esercizio già completato',
                'status': 'error'
            }), 400
        
        # Gestione immagine
        immagine = result[2]
        if immagine and isinstance(immagine, str) and immagine.strip():
            immagine = immagine.strip()
            if immagine.startswith('http://localhost:3000/uploads'):
                pass
            elif immagine.startswith('/'):
                immagine = f'http://localhost:3000{immagine}'
            elif not immagine.startswith(('http://', 'https://')):
                if immagine.startswith('//'):
                    immagine = 'https:' + immagine
                else:
                    immagine = 'https://' + immagine
        
        return jsonify({
            'idEsercizioAssegnato': result[0],
            'testo': result[1],
            'immagine': immagine,
            'tipologia': result[4],
            'descrizione': result[5],
            'status': 'success'
        })
        
    except Exception as e:
        return jsonify({
            'error': f'Errore nel recupero dell\'esercizio: {str(e)}',
            'status': 'error'
        }), 500
    finally:
        if connection and connection.is_connected():
            cursor.close()
            connection.close()

@app.route('/get_random_text', methods=['GET'])
def get_random_text():
    try:
        # Ottieni l'ID studente dai parametri della query
        id_studente = request.args.get('idStudente')
        
        if not id_studente:
            return jsonify({
                'error': 'ID studente mancante. Aggiungi ?idStudente=X alla richiesta',
                'status': 'error'
            }), 400

        # Query per ottenere solo le parole assegnate a quello studente specifico
        parole_studente = get_parole_per_studente(id_studente)
        
        if not parole_studente:
            return jsonify({
                'error': 'Nessuna parola assegnata a questo studente',
                'status': 'error'
            }), 404

        parola_casuale = random.choice(parole_studente)
        word_id = parola_casuale['idEsercizioAssegnato']

        return jsonify({
            'text': parola_casuale['testo'],
            'image': parola_casuale['immagine'],
            'id': word_id,
            'idEsercizioAssegnato': word_id,
            'status': 'success'
        })

    except Exception as e:
        print(f"Errore dettagliato: {str(e)}")
        return jsonify({
            'error': f'Errore nel recupero della parola: {str(e)}',
            'status': 'error'
        }), 500

@app.route('/get_all_words', methods=['GET'])
def get_all_words():
    """Ottieni tutte le parole italiane disponibili dal database"""
    try:
        parole_correnti = get_parole_italiane_from_db()
        
        parole_con_id = [
            {
                'id': i + 1, 
                'parola': parola['testo'],
                'immagine': parola['immagine']
            }
            for i, parola in enumerate(parole_correnti)
        ]

        return jsonify({
            'parole': parole_con_id,
            'count': len(parole_correnti),
            'status': 'success'
        })

    except Exception as e:
        return jsonify({
            'error': f'Errore nel recupero delle parole: {str(e)}',
            'status': 'error'
        })

@app.route('/test_images', methods=['GET'])
def test_images():
    """Testa la validità dei link delle immagini"""
    try:
        parole_correnti = get_parole_italiane_from_db()
        
        risultati_test = []
        for parola in parole_correnti:
            if parola['immagine']:
                try:
                    response = requests.head(parola['immagine'], timeout=5)
                    status = "✅ OK" if response.status_code == 200 else f"❌ Error {response.status_code}"
                except Exception as e:
                    status = f"❌ Errore: {str(e)}"
                
                risultati_test.append({
                    'parola': parola['testo'],
                    'link': parola['immagine'],
                    'status': status
                })
            else:
                risultati_test.append({
                    'parola': parola['testo'],
                    'link': 'Nessuna immagine',
                    'status': '⚠️ Mancante'
                })
        
        return jsonify({
            'test_results': risultati_test,
            'status': 'success'
        })
        
    except Exception as e:
        return jsonify({
            'error': f'Errore nel test: {str(e)}',
            'status': 'error'
        })

@app.route('/check_pronunciation', methods=['POST'])
def check_pronunciation():
    try:
        if whisper_model is None:
            return jsonify({
                'error': 'Modello Whisper non disponibile',
                'status': 'error'
            })

        audio_data = request.files['audio']
        parola_riferimento = request.form.get('reference_text', '').strip()
        id_studente = request.form.get('idStudente')
        id_esercizio_assegnato = request.form.get('idEsercizioAssegnato')
        tempo_impiegato = float(request.form.get('tempoImpiegato', 0))
        numero_tentativi = int(request.form.get('numeroTentativi', 1))

        if not parola_riferimento or not id_studente or not id_esercizio_assegnato:
            return jsonify({
                'error': 'Parametri mancanti',
                'status': 'error'
            })

        with tempfile.NamedTemporaryFile(delete=False, suffix='.wav') as temp_audio:
            audio_data.save(temp_audio.name)

            try:
                result = whisper_model.transcribe(temp_audio.name, language='it')
                testo_trascritto = result["text"].strip()

                if not testo_trascritto:
                    return jsonify({
                        'error': 'Nessun audio rilevato',
                        'status': 'error'
                    })

            except Exception as whisper_error:
                return jsonify({
                    'error': f'Errore Whisper: {str(whisper_error)}',
                    'status': 'error'
                })
            finally:
                try:
                    os.unlink(temp_audio.name)
                except:
                    pass

        parola_pronunciata = testo_trascritto.split()[0].lower() if testo_trascritto.split() else ""
        parola_riferimento_pulita = parola_riferimento.lower()
        similarity = difflib.SequenceMatcher(None, parola_riferimento_pulita, parola_pronunciata).ratio()

        # Valutazione con Ollama (codice esistente...)
        try:
            evaluation_prompt = f"""
            Valuta la pronuncia italiana:
            PAROLA DA PRONUNCIARE: "{parola_riferimento}"
            PAROLA PRONUNCIATA: "{parola_pronunciata}"
            
            Rispondi SOLO con: "BRAVO", "PROVA A FARE DI MEGLIO" o "SBAGLIATO"
            """
            
            response = chat(
                model='gemma3',
                messages=[
                    {'role': 'system', 'content': 'Rispondi SOLO con "BRAVO", "PROVA A FARE DI MEGLIO" o "SBAGLIATO".'},
                    {'role': 'user', 'content': evaluation_prompt}
                ],
            )
            feedback = response.message.content.strip().upper()
        except:
            # Fallback
            if similarity >= 0.8:
                feedback = "BRAVO"
            elif similarity >= 0.5:
                feedback = "PROVA A FARE DI MEGLIO"
            else:
                feedback = "SBAGLIATO"

        if "BRAVO" in feedback:
            feedback = "BRAVO"
        elif "PROVA A FARE DI MEGLIO" in feedback:
            feedback = "PROVA A FARE DI MEGLIO"
        else:
            feedback = "SBAGLIATO"

        corrections = []
        esercizio_completato = False
        
        # ✅ ESERCIZIO COMPLETATO: BRAVO O 10 TENTATIVI
        if feedback == "BRAVO" or numero_tentativi >= 10:
            esercizio_completato = True
            
            # Salva il risultato nel database
            salva_risultato_pronuncia(
                id_studente=id_studente,
                id_esercizio_assegnato=id_esercizio_assegnato,
                feedback=feedback,
                similarity=similarity,
                parola_pronunciata=parola_pronunciata,
                tempo_impiegato=tempo_impiegato,
                numero_tentativi=numero_tentativi
            )
        else:
            corrections = generate_italian_pronunciation_tips(parola_riferimento, parola_pronunciata, similarity)

        return jsonify({
            'transcribed_text': parola_pronunciata,
            'reference_text': parola_riferimento,
            'feedback': feedback,
            'similarity_score': round(similarity * 100, 1),
            'corrections': corrections,
            'esercizio_completato': esercizio_completato,
            'tempo_impiegato': tempo_impiegato,
            'numero_tentativi': numero_tentativi,
            'tentativi_rimanenti': max(0, 10 - numero_tentativi),
            'status': 'success'
        })

    except Exception as e:
        return jsonify({
            'error': f'Errore generale: {str(e)}',
            'status': 'error'
        })

def generate_italian_pronunciation_tips(parola_riferimento, parola_pronunciata, similarity):
    """Genera suggerimenti specifici per pronuncia italiana"""
    tips = []
    ref_lower = parola_riferimento.lower()
    spoken_lower = parola_pronunciata.lower()

    if similarity < 0.3:
        tips.append(f"🎯 Concentrati sui suoni italiani della parola '{parola_riferimento}'")
        tips.append("🔊 Parla più chiaramente, pronuncia ogni sillaba")
    elif similarity < 0.6:
        tips.append(f"📢 Migliora la pronuncia italiana di '{parola_riferimento}'")

    if 'gli' in ref_lower and 'gli' not in spoken_lower:
        tips.append("🗣️ Il suono 'GLI' si pronuncia come 'LI' con la lingua sul palato")
    elif 'gn' in ref_lower and 'gn' not in spoken_lower:
        tips.append("🔤 Il suono 'GN' è come 'NI' in spagnolo (come in 'bagno')")
    elif 'sc' in ref_lower and 'sc' not in spoken_lower:
        tips.append("📝 'SC' davanti a E/I si pronuncia 'SH' (come in 'pesce')")
    elif 'ch' in ref_lower and 'ch' not in spoken_lower:
        tips.append("🎵 'CH' in italiano si pronuncia 'K' (come in 'che')")
    elif 'r' in ref_lower and ('l' in spoken_lower or 'r' not in spoken_lower):
        tips.append("🔄 La 'R' italiana è vibrante, fai vibrare la lingua")
    elif ref_lower.endswith('e') and not spoken_lower.endswith('e'):
        tips.append("⏰ Non dimenticare la 'E' finale italiana")

    if len(parola_riferimento) > 3:
        tips.append(f"🎵 Controlla l'accento italiano della parola '{parola_riferimento}'")

    return tips[:3]

@app.route('/add_word', methods=['POST'])
def add_word():
    """Aggiungi una nuova parola al database"""
    try:
        data = request.get_json()
        parola = data.get('parola', '').strip().lower()
        immagine = data.get('immagine', '').strip()
        
        if not parola:
            return jsonify({'error': 'Parola mancante', 'status': 'error'}), 400
        
        connection = get_db_connection()
        if not connection:
            return jsonify({'error': 'Errore connessione database', 'status': 'error'}), 500
        
        cursor = connection.cursor()
        
        query = """
        INSERT INTO esercizio_assegnato (idStudente, idEsercizio, idEducatore, data_assegnazione, testo, immagine)
        SELECT 1, 3, 1, CURDATE(), %s, %s
        WHERE NOT EXISTS (
            SELECT 1 FROM esercizio_assegnato 
            WHERE testo = %s AND idEsercizio = 3
        )
        """
        
        cursor.execute(query, (parola, immagine, parola))
        connection.commit()
        
        if cursor.rowcount > 0:
            global PAROLE_ITALIANE
            PAROLE_ITALIANE = get_parole_italiane_from_db()
            
            return jsonify({
                'message': f'Parola "{parola}" aggiunta con successo',
                'status': 'success'
            })
        else:
            return jsonify({
                'message': f'Parola "{parola}" già esistente',
                'status': 'info'
            })
            
    except Exception as e:
        return jsonify({
            'error': f'Errore nell\'aggiunta della parola: {str(e)}',
            'status': 'error'
        }), 500
    finally:
        if connection and connection.is_connected():
            cursor.close()
            connection.close()

@app.route('/refresh_words', methods=['POST'])
def refresh_words():
    """Ricarica le parole dal database"""
    try:
        global PAROLE_ITALIANE
        PAROLE_ITALIANE = get_parole_italiane_from_db()
        
        return jsonify({
            'message': 'Parole ricaricate dal database',
            'count': len(PAROLE_ITALIANE),
            'status': 'success'
        })
    except Exception as e:
        return jsonify({
            'error': f'Errore nel ricaricamento: {str(e)}',
            'status': 'error'
        }), 500

if __name__ == '__main__':
    print("🚀 Avviando server Flask per pronuncia italiana...")
    print(f"📚 Parole italiane disponibili: {len(PAROLE_ITALIANE)}")
    app.run(debug=True, host='127.0.0.1', port=5001)
