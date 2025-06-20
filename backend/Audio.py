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
from datetime import datetime
import json

app = Flask(__name__)

# Configurazione CORS espansa
CORS(app, origins=["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:3001"],
     methods=['GET', 'POST', 'OPTIONS'],
     allow_headers=['Content-Type'])

# Configurazione Database
DB_CONFIG = {
    'host': '172.29.4.159',
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

# Carica il modello Whisper
try:
    whisper_model = whisper.load_model("base")
    print("✅ Modello Whisper caricato correttamente")
except Exception as e:
    print(f"❌ Errore caricamento Whisper: {e}")
    whisper_model = None

@app.route('/get_esercizi_studente', methods=['GET'])
def get_esercizi_studente():
    """Ottieni tutti gli esercizi assegnati a uno studente"""
    id_studente = request.args.get('idStudente')
    
    if not id_studente:
        return jsonify({'error': 'ID studente mancante', 'status': 'error'}), 400
    
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Errore connessione database', 'status': 'error'}), 500
            
        cursor = conn.cursor(dictionary=True)
        
        query = """
        SELECT 
            ea.idEsercizioAssegnato,
            ea.testo,
            ea.immagine,
            ea.data_assegnazione,
            e.tipologia,
            e.descrizione,
            CASE 
                WHEN r.idRisultato IS NOT NULL THEN 1 
                ELSE 0 
            END as completato
        FROM esercizio_assegnato ea
        JOIN esercizio e ON ea.idEsercizio = e.idEsercizio
        LEFT JOIN risultato r ON ea.idEsercizioAssegnato = r.idEsercizioAssegnato
        WHERE ea.idStudente = %s AND e.tipologia = 'pronuncia'
        ORDER BY ea.data_assegnazione DESC
        """
        
        cursor.execute(query, (id_studente,))
        esercizi = cursor.fetchall()
        
        
        cursor.close()
        conn.close()
        
        return jsonify({
            'status': 'success',
            'esercizi': esercizi,
            'totali': len(esercizi),
            'completati': len([e for e in esercizi if e['completato']]),
            'rimanenti': len([e for e in esercizi if not e['completato']])
        })
        
    except Exception as e:
        print(f"❌ Errore nel recupero degli esercizi: {str(e)}")
        return jsonify({'error': f'Errore database: {str(e)}', 'status': 'error'}), 500



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



@app.route('/health', methods=['GET'])
def health_check():
    """Endpoint per verificare lo stato del server"""
    try:
        # Verifica connessione database
        conn = get_db_connection()
        if conn:
            cursor = conn.cursor()
            cursor.execute("SELECT COUNT(*) FROM studente")
            studenti_count = cursor.fetchone()[0]
            cursor.close()
            conn.close()
            db_status = "connected"
        else:
            db_status = "disconnected"
            studenti_count = 0
    except Exception as e:
        db_status = "error"
        studenti_count = 0
    
    # Verifica Whisper
    whisper_status = "available" if whisper_model else "unavailable"
    
    # Verifica Ollama
    try:
        from ollama import chat
        test_response = chat(
            model='gemma3',
            messages=[{'role': 'user', 'content': 'test'}],
        )
        ollama_status = "available"
    except:
        ollama_status = "unavailable"
    
    return jsonify({
        'status': 'success',
        'message': 'Server Flask attivo',
        'database': db_status,
        'whisper': whisper_status,
        'ollama': ollama_status,
        'studenti_totali': studenti_count,
        'timestamp': datetime.now().isoformat()
    })

@app.route('/check_pronunciation', methods=['POST'])
def check_pronunciation():
    try:
        if whisper_model is None:
            return jsonify({'error': 'Modello Whisper non disponibile', 'status': 'error'})

        audio_data = request.files['audio']
        parola_riferimento = request.form.get('reference_text', '').strip()
        id_studente = request.form.get('idStudente')
        id_esercizio_assegnato = request.form.get('idEsercizioAssegnato')
        tempo_impiegato = float(request.form.get('tempoImpiegato', 0))
        numero_tentativi = int(request.form.get('numeroTentativi', 1))

        if not parola_riferimento or not id_studente or not id_esercizio_assegnato:
            return jsonify({'error': 'Parametri mancanti', 'status': 'error'})

        # SOLUZIONE: Gestione corretta del file temporaneo
        temp_audio = None
        try:
            # Crea file temporaneo
            temp_audio = tempfile.NamedTemporaryFile(delete=False, suffix='.wav')
            audio_data.save(temp_audio.name)
            temp_audio.close()  # IMPORTANTE: Chiudi il file prima di usarlo
            
            # Trascrizione audio
            result = whisper_model.transcribe(
            temp_audio.name, 
            language='it',  # FORZA L'ITALIANO
            task='transcribe'  # ASSICURA CHE TRASCRIVA, NON TRADUCA
        )
            testo_trascritto = result["text"].strip()
            
            if not testo_trascritto:
                return jsonify({'error': 'Nessun audio rilevato', 'status': 'error'})
                
        finally:
            # Cleanup garantito del file temporaneo
            if temp_audio and os.path.exists(temp_audio.name):
                try:
                    os.unlink(temp_audio.name)
                except PermissionError:
                    # Se non riesce a cancellare subito, riprova dopo un breve delay
                    import time
                    time.sleep(0.1)
                    try:
                        os.unlink(temp_audio.name)
                    except:
                        print(f"⚠️ Impossibile cancellare file temporaneo: {temp_audio.name}")

        parola_pronunciata = testo_trascritto.split()[0].lower() if testo_trascritto.split() else ""
        parola_riferimento_pulita = parola_riferimento.lower()
        similarity = difflib.SequenceMatcher(None, parola_riferimento_pulita, parola_pronunciata).ratio()

        # Resto del codice rimane uguale...
        feedback_data = evaluate_with_ollama(parola_riferimento, parola_pronunciata, similarity, numero_tentativi)
        
        feedback = feedback_data['feedback']
        corrections = []
        esercizio_completato = False
        
        if feedback == "BRAVO" or numero_tentativi >= 10:
            esercizio_completato = True
            salva_risultato_pronuncia(id_studente, id_esercizio_assegnato, feedback, 
                                    similarity, parola_pronunciata, tempo_impiegato, numero_tentativi)
        else:
            corrections = generate_italian_pronunciation_tips(parola_riferimento, parola_pronunciata, similarity)

        return jsonify({
            'transcribed_text': parola_pronunciata,
            'reference_text': parola_riferimento,
            'feedback': feedback,
            'messaggio_personalizzato': feedback_data.get('messaggio_personalizzato', feedback),
            'suggerimento_ollama': feedback_data.get('suggerimento', ''),
            'motivazione': feedback_data.get('motivazione', ''),
            'similarity_score': round(similarity * 100, 1),
            'corrections': corrections,
            'esercizio_completato': esercizio_completato,
            'tempo_impiegato': tempo_impiegato,
            'numero_tentativi': numero_tentativi,
            'tentativi_rimanenti': max(0, 10 - numero_tentativi),
            'status': 'success'
        })

    except Exception as e:
        return jsonify({'error': f'Errore generale: {str(e)}', 'status': 'error'})

def evaluate_with_ollama_italian_strict(parola_riferimento, parola_pronunciata, similarity, numero_tentativi):
    """Valutazione severa per pronuncia italiana"""
    
    # SOGLIE PIÙ SEVERE
    SOGLIA_PERFETTA = 0.95      # Era 0.8, ora 0.95
    SOGLIA_ACCETTABILE = 0.85   # Era 0.5, ora 0.85
    
    if numero_tentativi == 10:
        context = "È l'ultimo tentativo (10/10). Sii molto severo ma incoraggiante."
    elif numero_tentativi >= 8:
        context = "Ultimi tentativi. Richiedi pronuncia quasi perfetta."
    elif numero_tentativi <= 3:
        context = "Primi tentativi, sii severo ma fornisci suggerimenti chiari."
    else:
        context = "Tentativi intermedi, mantieni standard elevati per la pronuncia italiana."
    
    try:
        prompt = f"""
        Sei un insegnante di italiano molto esigente e preciso. {context}
        
        PAROLA ITALIANA CORRETTA: "{parola_riferimento}"
        PAROLA PRONUNCIATA: "{parola_pronunciata}"
        TENTATIVO: {numero_tentativi}/10
        SIMILARITÀ ALGORITMICA: {similarity:.3f}
        
        CRITERI SEVERI per la valutazione:
        - BRAVO: Solo se la pronuncia è quasi perfetta (similarità > 0.95)
        - PROVA A FARE DI MEGLIO: Se c'è somiglianza ma errori evidenti (0.85-0.95)
        - SBAGLIATO: Se la pronuncia è chiaramente scorretta (< 0.85)
        
        Rispondi in formato JSON:
        {{
            "livello": "BRAVO|PROVA A FARE DI MEGLIO|SBAGLIATO",
            "messaggio": "messaggio severo ma costruttivo",
            "suggerimento": "correzione specifica per la pronuncia italiana",
            "motivazione": "spiegazione precisa degli errori"
        }}
        
        Sii particolarmente attento a:
        - Pronuncia esatta delle vocali italiane (a, e, i, o, u)
        - R vibrante italiana corretta
        - Doppie consonanti precise
        - Accenti tonici nella posizione giusta
        - Suoni italiani specifici (GLI, GN, SC, CH)
        
        Non accettare "quasi giusto" - richiedi precisione nella pronuncia italiana.
        """
        
        response = chat(
            model='gemma3',
            messages=[
                {'role': 'system', 'content': 'Sei un insegnante di italiano molto esigente. Valuta con criteri severi ma sii sempre costruttivo. Rispondi in JSON valido.'},
                {'role': 'user', 'content': prompt}
            ],
        )
        
        import json
        try:
            data = json.loads(response.message.content.strip())
            livello = data.get('livello', '').upper()
            
            # LOGICA SEVERA: Anche Ollama deve rispettare le soglie
            if similarity < SOGLIA_ACCETTABILE:
                feedback = 'SBAGLIATO'
                messaggio_extra = " La pronuncia non è abbastanza precisa per l'italiano."
            elif similarity < SOGLIA_PERFETTA:
                feedback = 'PROVA A FARE DI MEGLIO'
                messaggio_extra = " Ci sei quasi, ma serve maggiore precisione."
            else:
                feedback = 'BRAVO' if 'BRAVO' in livello else 'PROVA A FARE DI MEGLIO'
                messaggio_extra = ""
            
            messaggio_base = data.get('messaggio', get_strict_message_italian(feedback))
            messaggio_finale = messaggio_base + messaggio_extra
            
            return {
                'feedback': feedback,
                'messaggio_personalizzato': messaggio_finale,
                'suggerimento': data.get('suggerimento', get_strict_suggestion(parola_riferimento, parola_pronunciata)),
                'motivazione': data.get('motivazione', f'Precisione richiesta: {similarity:.1%}'),
                'soglia_richiesta': SOGLIA_PERFETTA if feedback == 'BRAVO' else SOGLIA_ACCETTABILE
            }
            
        except json.JSONDecodeError:
            return get_strict_fallback_response(similarity, numero_tentativi, SOGLIA_PERFETTA, SOGLIA_ACCETTABILE)
                
    except Exception as e:
        print(f"Errore Ollama: {e}")
        return get_strict_fallback_response(similarity, numero_tentativi, SOGLIA_PERFETTA, SOGLIA_ACCETTABILE)

def get_strict_message_italian(feedback):
    """Messaggi severi in italiano"""
    messages = {
        'BRAVO': 'Eccellente! Finalmente una pronuncia italiana precisa e corretta!',
        'PROVA A FARE DI MEGLIO': 'Non è abbastanza preciso. La pronuncia italiana richiede maggiore accuratezza.',
        'SBAGLIATO': 'La pronuncia non è corretta. Devi migliorare significativamente.'
    }
    return messages.get(feedback, 'Concentrati sulla precisione della pronuncia italiana.')

def get_strict_suggestion(parola_riferimento, parola_pronunciata):
    """Suggerimenti specifici per errori comuni"""
    if not parola_pronunciata:
        return "Non ho sentito chiaramente. Pronuncia più forte e distintamente."
    
    parola_ref = parola_riferimento.lower()
    parola_pron = parola_pronunciata.lower()
    
    suggestions = []
    
    # Controlli specifici per l'italiano
    if 'r' in parola_ref and 'r' in parola_pron:
        suggestions.append("Assicurati che la R sia vibrante, tipica dell'italiano.")
    
    if any(char*2 in parola_ref for char in 'lmnrst'):
        suggestions.append("Attenzione alle doppie consonanti - devono essere pronunciate distintamente.")
    
    if parola_ref.endswith(('a', 'e', 'i', 'o', 'u')) and not parola_pron.endswith(('a', 'e', 'i', 'o', 'u')):
        suggestions.append("Le parole italiane terminano spesso con vocali chiare - non dimenticarle.")
    
    if 'gl' in parola_ref or 'gn' in parola_ref:
        suggestions.append("I suoni GLI e GN italiani sono unici - pratica la pronuncia specifica.")
    
    if len(suggestions) == 0:
        suggestions.append(f"Ripeti lentamente '{parola_riferimento}' concentrandoti su ogni sillaba.")
    
    return " ".join(suggestions)

def get_strict_fallback_response(similarity, numero_tentativi, soglia_perfetta, soglia_accettabile):
    """Fallback severo basato solo su similarità"""
    if similarity >= soglia_perfetta:
        feedback = 'BRAVO'
        messaggio = 'Pronuncia accettabile, ma potrebbe essere ancora più precisa!'
    elif similarity >= soglia_accettabile:
        feedback = 'PROVA A FARE DI MEGLIO'
        messaggio = f'Pronuncia imprecisa (precisione: {similarity:.1%}). Serve maggiore accuratezza.'
    else:
        feedback = 'SBAGLIATO'
        messaggio = f'Pronuncia scorretta (precisione: {similarity:.1%}). Riprova con più attenzione.'
    
    return {
        'feedback': feedback,
        'messaggio_personalizzato': messaggio,
        'suggerimento': 'Concentrati sulla pronuncia precisa di ogni suono italiano.',
        'motivazione': f'Standard richiesto: {soglia_perfetta:.1%} per BRAVO, {soglia_accettabile:.1%} per migliorare.',
        'soglia_richiesta': soglia_perfetta if feedback == 'BRAVO' else soglia_accettabile
    }


def evaluate_with_ollama(parola_riferimento, parola_pronunciata, similarity, numero_tentativi):
    """Valutazione unificata con Ollama"""
    
    # Contesto basato sui tentativi
    if numero_tentativi == 1:
        context = "È il primo tentativo, sii molto incoraggiante."
    elif numero_tentativi <= 3:
        context = "Primi tentativi, fornisci suggerimenti specifici."
    elif numero_tentativi <= 7:
        context = "Tentativi intermedi, sii più dettagliato."
    else:
        context = "Ultimi tentativi, sii molto specifico e motivante."
    
    try:
        prompt = f"""
        Sei un insegnante di italiano paziente. {context}
        
        PAROLA CORRETTA: "{parola_riferimento}"
        PAROLA PRONUNCIATA: "{parola_pronunciata}"
        TENTATIVO: {numero_tentativi}/10
        
        Rispondi in JSON:
        {{
            "livello": "BRAVO|PROVA A FARE DI MEGLIO|SBAGLIATO",
            "messaggio": "messaggio personalizzato",
            "suggerimento": "consiglio tecnico",
            "motivazione": "spiegazione positiva"
        }}
        """
        
        response = chat(
            model='gemma3',
            messages=[
                {'role': 'system', 'content': 'Rispondi sempre in JSON valido.'},
                {'role': 'user', 'content': prompt}
            ],
        )
        
        import json
        try:
            data = json.loads(response.message.content.strip())
            livello = data.get('livello', '').upper()
            
            if 'BRAVO' in livello:
                feedback = 'BRAVO'
            elif 'MEGLIO' in livello:
                feedback = 'PROVA A FARE DI MEGLIO'
            else:
                feedback = 'SBAGLIATO'
            
            return {
                'feedback': feedback,
                'messaggio_personalizzato': data.get('messaggio', get_default_message(feedback)),
                'suggerimento': data.get('suggerimento', ''),
                'motivazione': data.get('motivazione', '')
            }
            
        except json.JSONDecodeError:
            # Fallback se JSON non valido
            content = response.message.content.upper()
            if 'BRAVO' in content:
                return get_fallback_response('BRAVO', numero_tentativi)
            elif 'MEGLIO' in content:
                return get_fallback_response('PROVA A FARE DI MEGLIO', numero_tentativi)
            else:
                return get_fallback_response('SBAGLIATO', numero_tentativi)
                
    except Exception as e:
        print(f"Errore Ollama: {e}")
        # Fallback basato su similarità
        if similarity >= 0.8:
            return get_fallback_response('BRAVO', numero_tentativi)
        elif similarity >= 0.5:
            return get_fallback_response('PROVA A FARE DI MEGLIO', numero_tentativi)
        else:
            return get_fallback_response('SBAGLIATO', numero_tentativi)

def get_default_message(feedback):
    messages = {
        'BRAVO': 'Eccellente! La tua pronuncia è perfetta!',
        'PROVA A FARE DI MEGLIO': 'Buon tentativo! Continua così!',
        'SBAGLIATO': 'Non ti scoraggiare! Ogni tentativo ti aiuta!'
    }
    return messages.get(feedback, 'Continua a provare!')

def get_fallback_response(feedback, numero_tentativi):
    base_messages = {
        'BRAVO': {
            'messaggio_personalizzato': 'Fantastico! Pronuncia perfetta!',
            'suggerimento': 'Continua così!',
            'motivazione': 'Hai dimostrato grande abilità'
        },
        'PROVA A FARE DI MEGLIO': {
            'messaggio_personalizzato': f'Buon tentativo! Tentativo {numero_tentativi}, continua!',
            'suggerimento': 'Concentrati sui suoni italiani',
            'motivazione': 'Stai migliorando con la pratica'
        },
        'SBAGLIATO': {
            'messaggio_personalizzato': f'Non mollare! Tentativo {numero_tentativi}, ogni prova insegna!',
            'suggerimento': 'Ascolta bene e ripeti lentamente',
            'motivazione': 'L\'italiano richiede pratica, sei sulla strada giusta'
        }
    }
    
    response = base_messages.get(feedback, base_messages['PROVA A FARE DI MEGLIO'])
    response['feedback'] = feedback
    return response

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

if __name__ == '__main__':
    print("🚀 Avviando server Flask per pronuncia italiana...")
    app.run(debug=True, host='127.0.0.1', port=5001)