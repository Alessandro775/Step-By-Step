from flask import Flask, request, jsonify
from flask_cors import CORS
import whisper
import io
import tempfile
import os
from ollama import chat
import difflib
import mysql.connector
from mysql.connector import Error
import requests

# Inizializzazione dell'applicazione Flask
app = Flask(__name__)

# Configurazione CORS espansa per permettere richieste da frontend React
# Permette connessioni da localhost:3000 (frontend React) e 
CORS(app, origins=["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:3001"],
     methods=['GET', 'POST', 'OPTIONS'],
     allow_headers=['Content-Type'])

# Configurazione Database MySQL per la persistenza dei dati degli esercizi
DB_CONFIG = {
    'host': '172.29.3.212',
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
        # Query per recuperare esercizi di pronuncia assegnati allo studente
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
         # Elaborazione di ogni risultato per normalizzare i dati
        for row in results:
            id_esercizio_assegnato = row[0]
            testo = row[1]
            immagine = row[2]
            
             # Gestione migliorata delle immagini con validazione URL
            if immagine and isinstance(immagine, str) and immagine.strip():
                immagine = immagine.strip()
                
                # Se inizia con 'http://localhost:3000/uploads', è un file locale del backend Node.js
                if immagine.startswith('http://localhost:3000/uploads'):
                    # Mantieni l'URL così com'è
                    pass
                # Gestione percorsi relativi
                elif immagine.startswith('/'):
                    immagine = f'http://localhost:3000{immagine}'
                 # Gestione URL senza protocollo
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
        # Chiusura sicura della connessione database
        if connection.is_connected():
            cursor.close()
            connection.close()


def get_parole_from_db():
    """Recupera tutte le parole dal database (per compatibilità)"""
    connection = get_db_connection()
    if not connection:
        return []
    
    try:
        cursor = connection.cursor()
         # Query per recuperare tutte le parole di pronuncia uniche
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
         # Elaborazione e validazione delle immagini
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
        
        # Calcolo del punteggio basato sul feedback dell'AI
        if similarity > 0.8:
            punteggio = max(80, int(similarity * 100))
            numero_errori = max(0, numero_tentativi - 1)
        elif similarity >= 0.5:
            punteggio = max(50, int(similarity * 100))
            numero_errori = numero_tentativi - 1
        else:
            punteggio = min(40, int(similarity * 100))
            numero_errori = numero_tentativi

        # Inserimento del risultato nella tabella risultato
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
# Caricamento delle parole dal database all'avvio (per compatibilità)
PAROLE = get_parole_from_db()


# Inizializzazione del modello Whisper per il riconoscimento vocale
try:
    whisper_model = whisper.load_model("base")
    print("✅ Modello Whisper caricato correttamente")
except Exception as e:
    print(f"❌ Errore caricamento Whisper: {e}")
    whisper_model = None

@app.route('/health', methods=['GET'])
def health_check():
    """Endpoint per verificare lo stato del server"""
    parole_aggiornate = get_parole_from_db()
    
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
        # Estrazione dell'ID studente dai parametri della query
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
        
        # Query completa per ottenere esercizi con stato di completamento
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
        # Elaborazione di ogni esercizio con gestione immagini
        for row in results:
            id_esercizio_assegnato = row[0]
            testo = row[1]
            immagine = row[2]
            data_assegnazione = row[3]
            tipologia = row[4]
            descrizione = row[5]
            completato = row[6] is not None  # Se c'è un risultato, è completato
            
            # Gestione e validazione dell'URL dell'immagine
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
        
        # Calcolo delle statistiche degli esercizi
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
        # Estrazione dei parametri richiesti
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
        
        # Controlli di autorizzazione e stato
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
        
         # Gestione dell'immagine associata
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


@app.route('/check_pronunciation', methods=['POST'])
def check_pronunciation():
    try:
        # Verifica disponibilità del modello Whisper
        if whisper_model is None:
            return jsonify({
                'error': 'Modello Whisper non disponibile',
                'status': 'error'
            })

        # Estrazione dei dati dalla richiesta
        audio_data = request.files['audio']
        parola_riferimento = request.form.get('reference_text', '').strip()
        id_studente = request.form.get('idStudente')
        id_esercizio_assegnato = request.form.get('idEsercizioAssegnato')
        tempo_impiegato = float(request.form.get('tempoImpiegato', 0))
        numero_tentativi = int(request.form.get('numeroTentativi', 1))

         # Validazione dei parametri obbligatori
        if not parola_riferimento or not id_studente or not id_esercizio_assegnato:
            return jsonify({
                'error': 'Parametri mancanti',
                'status': 'error'
            })

         # Elaborazione dell'audio con file temporaneo
        with tempfile.NamedTemporaryFile(delete=False, suffix='.wav') as temp_audio:
            
            audio_data.save(temp_audio.name)
            
            try:
                # Trascrizione dell'audio con Whisper (modello italiano)
                # Soppressione di token di punteggiatura comuni
                suppress_tokens = [0, 11, 13, 30]  # !, ,, ., ?
                result = whisper_model.transcribe(
                    temp_audio.name, 
                    language='it',
                    initial_prompt="Trascrivi solo la parola pronunciata senza punteggiatura. Considera accenti regionali italiani."
                )
                testo_trascritto = result["text"].strip()

                # Rimuovi tutta la punteggiatura prima di estrarre la parola
                import re

                # Dopo la trascrizione
                testo_trascritto = result["text"].strip()
                # Rimuovi tutta la punteggiatura residua
                testo_pulito = re.sub(r'[^\w\s]', '', testo_trascritto)
                # Estrai solo la prima parola
                parola_pronunciata = testo_pulito.split()[0].lower() if testo_pulito.split() else ""

            except Exception as whisper_error:
                return jsonify({
                    'error': f'Errore Whisper: {str(whisper_error)}',
                    'status': 'error'
                })
            finally:
                 # Pulizia del file temporaneo
                try:
                    os.unlink(temp_audio.name)
                except:
                    pass

         # Estrazione della prima parola pronunciata e calcolo similarità
        parola_pronunciata = testo_trascritto.split()[0].lower() if testo_trascritto.split() else ""
        parola_riferimento_pulita = parola_riferimento.lower()
        similarity = difflib.SequenceMatcher(None, parola_riferimento_pulita, parola_pronunciata).ratio()

        # Valutazione con AI Ollama per feedback intelligente
        try:
            evaluation_prompt = f"""
                Sei un eduatore specializzato in fonologia per dsa. 
                Valuta questa pronuncia e fornisci un feedback stimolante e costruttivo per bambini delle scuole elementari-medie:

                PAROLA DA PRONUNCIARE: "{parola_riferimento}"
                PAROLA PRONUNCIATA: "{parola_pronunciata}"
                SIMILARITÀ: {similarity:.2f}
                TENTATIVO: {numero_tentativi}/10

                Fornisci un feedback che:
                - Sia motivante e personalizzato
                - Evidenzi i progressi specifici
                - Dia consigli pratici per migliorare
                - Usi un tono incoraggiante ma onesto
                - Sia lungo 30 caratteri massimo
                - non contenga nomi di bambini
                """

            response = chat(
                    model='gemma3',
                    messages=[
                        {'role': 'system', 'content': ' Sei un eduatore specializzato in fonologia per dsa. Dai un feedback costruttivo e stimolante per bambini delle scuole elementari-medie.'},
                        {'role': 'user', 'content': evaluation_prompt}
                    ],
                )
            feedback = response.message.content.strip()

        except:
             # Sistema di fallback basato su similarità
            if similarity > 0.8:
                feedback = "BRAVO"
            elif similarity >= 0.5 and similarity < 0.8:
                feedback = "PROVA A FARE DI MEGLIO"
            else:
                feedback = "SBAGLIATO"

        corrections = []
       # Logica di completamento basata su metriche oggettive
        esercizio_completato = False

        if similarity > 0.8 or numero_tentativi >= 10:
            esercizio_completato = True
            
            # Salva il risultato nel database
            salva_risultato_pronuncia(
                id_studente=id_studente,
                id_esercizio_assegnato=id_esercizio_assegnato,
                feedback=feedback,  # Feedback AI originale
                similarity=similarity,
                parola_pronunciata=parola_pronunciata,
                tempo_impiegato=tempo_impiegato,
                numero_tentativi=numero_tentativi
            )

       
           # Risposta completa con tutti i dati dell'analisi
        return jsonify({
            'transcribed_text': parola_pronunciata,
            'reference_text': parola_riferimento,
            'feedback': feedback,
            'similarity_score': round(similarity * 100, 1),
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


# Avvio del server Flask
if __name__ == '__main__':
    print("🚀 Avviando server Flask per pronuncia italiana...")
    print(f"📚 Parole disponibili: {len(PAROLE)}")
    app.run(debug=True, host='127.0.0.1', port=5001)