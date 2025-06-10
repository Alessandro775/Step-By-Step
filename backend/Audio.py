from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
import whisper
import io
import tempfile
import os
from ollama import chat
import base64
import difflib
import ffmpeg
import random

app = Flask(__name__)

# Configurazione CORS
CORS(app, origins=["http://localhost:3000", "http://127.0.0.1:3000"])

# Configurazione database
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///parole_italiane.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

# Modello per le parole italiane
class ParolaItaliana(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    parola = db.Column(db.String(100), nullable=False)
    created_at = db.Column(db.DateTime, default=db.func.current_timestamp())

    def to_dict(self):
        return {
            'id': self.id,
            'parola': self.parola
        }

# Carica il modello Whisper
try:
    whisper_model = whisper.load_model("base")
    print("✅ Modello Whisper caricato correttamente")
except Exception as e:
    print(f"❌ Errore caricamento Whisper: {e}")
    whisper_model = None

@app.route('/get_random_text', methods=['GET'])
def get_random_text():
    try:
        parole = ParolaItaliana.query.all()
        
        if not parole:
            return jsonify({
                'error': 'Nessuna parola trovata nel database',
                'status': 'error'
            })
        
        parola_casuale = random.choice(parole)
        
        return jsonify({
            'text': parola_casuale.parola,
            'id': parola_casuale.id,
            'status': 'success'
        })
        
    except Exception as e:
        return jsonify({
            'error': f'Errore nel recupero della parola: {str(e)}',
            'status': 'error'
        })

@app.route('/check_pronunciation', methods=['POST'])
def check_pronunciation():
    try:
        if whisper_model is None:
            return jsonify({
                'error': 'Modello Whisper non disponibile. Verifica l\'installazione di FFmpeg.',
                'solution': 'Installa FFmpeg: choco install ffmpeg (PowerShell come admin)',
                'status': 'error'
            })

        audio_data = request.files['audio']
        parola_riferimento = request.form.get('reference_text', '').strip()

        if not parola_riferimento:
            return jsonify({
                'error': 'Parola di riferimento mancante',
                'status': 'error'
            })

        with tempfile.NamedTemporaryFile(delete=False, suffix='.wav') as temp_audio:
            audio_data.save(temp_audio.name)

            try:
                # Trascrivi in italiano
                result = whisper_model.transcribe(temp_audio.name, language='it')
                testo_trascritto = result["text"].strip()

                if not testo_trascritto:
                    return jsonify({
                        'error': 'Nessun audio rilevato. Prova a parlare più forte.',
                        'status': 'error'
                    })

            except Exception as whisper_error:
                if "WinError 2" in str(whisper_error) or "ffmpeg" in str(whisper_error).lower():
                    return jsonify({
                        'error': 'FFmpeg non trovato. Installa FFmpeg e riavvia l\'applicazione.',
                        'solution': 'PowerShell (admin): choco install ffmpeg',
                        'status': 'error'
                    })
                else:
                    return jsonify({
                        'error': f'Errore Whisper: {str(whisper_error)}',
                        'status': 'error'
                    })
            finally:
                try:
                    os.unlink(temp_audio.name)
                except:
                    pass

        # Estrai la prima parola pronunciata
        parola_pronunciata = testo_trascritto.split()[0].lower() if testo_trascritto.split() else ""
        parola_riferimento_pulita = parola_riferimento.lower()

        # Calcola similarità
        similarity = difflib.SequenceMatcher(None, parola_riferimento_pulita, parola_pronunciata).ratio()

        # Prompt per valutazione parole italiane
        evaluation_prompt = f"""
        Sei un esperto insegnante di pronuncia italiana. Valuta la pronuncia di una PAROLA ITALIANA.

        PAROLA DA PRONUNCIARE: "{parola_riferimento}"
        PAROLA PRONUNCIATA: "{parola_pronunciata}"
        SIMILARITÀ: {similarity:.2f}

        CRITERI PER PAROLE ITALIANE:
        - Pronuncia corretta dei suoni italiani (r, gl, gn, sc, ch, gh)
        - Accento sulla sillaba giusta
        - Chiarezza della pronuncia
        - Riconoscibilità della parola italiana

        VALUTAZIONE:
        "BRAVO" = parola italiana pronunciata correttamente
        "PROVA A FARE DI MEGLIO" = parola riconoscibile ma con errori di pronuncia italiana
        "SBAGLIATO" = parola non riconoscibile o completamente sbagliata

        Rispondi SOLO con una delle tre opzioni sopra, nient'altro.
        """

        try:
            response = chat(
                model='gemma3',
                messages=[
                    {
                        'role': 'system',
                        'content': 'Sei un insegnante di pronuncia italiana. Rispondi SEMPRE e SOLO con "BRAVO", "PROVA A FARE DI MEGLIO" o "SBAGLIATO".'
                    },
                    {
                        'role': 'user',
                        'content': evaluation_prompt
                    }
                ],
            )
            feedback = response.message.content.strip().upper()

        except Exception as ollama_error:
            return jsonify({
                'error': f'Errore Ollama: {str(ollama_error)}. Verifica che Ollama sia in esecuzione.',
                'solution': 'Esegui: ollama serve',
                'status': 'error'
            })

        # Pulizia della risposta
        if "BRAVO" in feedback:
            feedback = "BRAVO"
        elif "PROVA A FARE DI MEGLIO" in feedback:
            feedback = "PROVA A FARE DI MEGLIO"
        elif "SBAGLIATO" in feedback:
            feedback = "SBAGLIATO"
        else:
            # Fallback per parole italiane
            if similarity >= 0.8:
                feedback = "BRAVO"
            elif similarity >= 0.5:
                feedback = "PROVA A FARE DI MEGLIO"
            else:
                feedback = "SBAGLIATO"

        # Genera suggerimenti per pronuncia italiana
        corrections = []
        if feedback != "BRAVO":
            corrections = generate_italian_pronunciation_tips(parola_riferimento, parola_pronunciata, similarity)

        return jsonify({
            'transcribed_text': parola_pronunciata,
            'reference_text': parola_riferimento,
            'feedback': feedback,
            'similarity_score': round(similarity * 100, 1),
            'corrections': corrections,
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
    
    # Suggerimenti basati sulla similarità
    if similarity < 0.3:
        tips.append(f"🎯 Concentrati sui suoni italiani della parola '{parola_riferimento}'")
        tips.append("🔊 Parla più chiaramente, pronuncia ogni sillaba")
    elif similarity < 0.6:
        tips.append(f"📢 Migliora la pronuncia italiana di '{parola_riferimento}'")
        
    # Suggerimenti specifici per suoni italiani
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
    
    # Suggerimenti per accento italiano
    if len(parola_riferimento) > 3:
        tips.append(f"🎵 Controlla l'accento italiano della parola '{parola_riferimento}'")
    
    return tips[:3]

@app.route('/add_word', methods=['POST'])
def add_word():
    """Aggiungi una nuova parola italiana al database"""
    try:
        data = request.get_json()
        
        nuova_parola = ParolaItaliana(
            parola=data['parola']
        )
        
        db.session.add(nuova_parola)
        db.session.commit()
        
        return jsonify({
            'message': 'Parola italiana aggiunta con successo',
            'id': nuova_parola.id,
            'status': 'success'
        })
        
    except Exception as e:
        return jsonify({
            'error': f'Errore nell\'aggiunta della parola: {str(e)}',
            'status': 'error'
        })

@app.route('/get_all_words', methods=['GET'])
def get_all_words():
    """Ottieni tutte le parole italiane dal database"""
    try:
        parole = ParolaItaliana.query.all()
        return jsonify({
            'parole': [parola.to_dict() for parola in parole],
            'count': len(parole),
            'status': 'success'
        })
    except Exception as e:
        return jsonify({
            'error': f'Errore nel recupero delle parole: {str(e)}',
            'status': 'error'
        })

@app.before_first_request
def create_tables():
    db.create_all()
    
    # Aggiungi parole italiane di esempio se il database è vuoto
    if ParolaItaliana.query.count() == 0:
        parole_esempio = [
            ParolaItaliana(parola="ciao"),
            ParolaItaliana(parola="grazie"),
            ParolaItaliana(parola="prego"),
            ParolaItaliana(parola="scusa"),
            ParolaItaliana(parola="pronuncia"),
            ParolaItaliana(parola="bellissimo"),
            ParolaItaliana(parola="spaghetti"),
            ParolaItaliana(parola="cappuccino"),
            ParolaItaliana(parola="famiglia"),
            ParolaItaliana(parola="ragazzo"),
            ParolaItaliana(parola="ragazza"),
            ParolaItaliana(parola="giorno"),
            ParolaItaliana(parola="notte"),
            ParolaItaliana(parola="mangiare"),
            ParolaItaliana(parola="bere"),
            ParolaItaliana(parola="parlare"),
            ParolaItaliana(parola="ascoltare"),
            ParolaItaliana(parola="guardare"),
            ParolaItaliana(parola="studiare"),
            ParolaItaliana(parola="lavorare"),
            ParolaItaliana(parola="gnocchi"),
            ParolaItaliana(parola="parmigiano"),
            ParolaItaliana(parola="prosciutto"),
            ParolaItaliana(parola="mozzarella"),
            ParolaItaliana(parola="bruschetta")
        ]
        
        for parola in parole_esempio:
            db.session.add(parola)
        
        db.session.commit()
        print("✅ Database inizializzato con parole italiane di esempio")

if __name__ == '__main__':
    print("🚀 Avviando server Flask per pronuncia italiana...")
    app.run(debug=True, host='0.0.0.0', port=5000)
