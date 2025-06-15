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

app = Flask(__name__)

# Configurazione CORS espansa
CORS(app, origins=["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:3001"],
     methods=['GET', 'POST', 'OPTIONS'],
     allow_headers=['Content-Type'])

# Lista statica di parole italiane (sostituisce il database)
PAROLE_ITALIANE = [
    "ciao", "grazie", "prego", "scusa", "pronuncia", "bellissimo", 
    "spaghetti", "cappuccino", "famiglia", "ragazzo", "ragazza", 
    "giorno", "notte", "mangiare", "bere", "parlare", "ascoltare", 
    "guardare", "studiare", "lavorare", "gnocchi", "parmigiano", 
    "prosciutto", "mozzarella", "bruschetta", "gelato", "pizza", 
    "amore", "casa", "strada", "macchina", "telefono", "computer",
    "musica", "libro", "scuola", "università", "lavoro", "tempo",
    "sole", "luna", "mare", "montagna", "città", "paese"
]

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
    return jsonify({
        'status': 'healthy',
        'message': 'Server Flask funzionante',
        'available_words': len(PAROLE_ITALIANE),
        'whisper_loaded': whisper_model is not None
    })

@app.route('/get_random_text', methods=['GET'])
def get_random_text():
    try:
        if not PAROLE_ITALIANE:
            return jsonify({
                'error': 'Nessuna parola disponibile',
                'status': 'error'
            }), 500
            
        parola_casuale = random.choice(PAROLE_ITALIANE)
        word_id = PAROLE_ITALIANE.index(parola_casuale) + 1
        
        return jsonify({
            'text': parola_casuale,
            'id': word_id,
            'status': 'success'
        })
        
    except Exception as e:
        print(f"Errore dettagliato: {str(e)}")  # Log per debug
        return jsonify({
            'error': f'Errore nel recupero della parola: {str(e)}',
            'status': 'error'
        }), 500
    
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

@app.route('/get_all_words', methods=['GET'])
def get_all_words():
    """Ottieni tutte le parole italiane disponibili"""
    try:
        # Crea una lista di dizionari con ID e parola
        parole_con_id = [
            {'id': i + 1, 'parola': parola} 
            for i, parola in enumerate(PAROLE_ITALIANE)
        ]
        
        return jsonify({
            'parole': parole_con_id,
            'count': len(PAROLE_ITALIANE),
            'status': 'success'
        })
    except Exception as e:
        return jsonify({
            'error': f'Errore nel recupero delle parole: {str(e)}',
            'status': 'error'
        })

if __name__ == '__main__':
    print("🚀 Avviando server Flask per pronuncia italiana...")
    print(f"📚 Parole italiane disponibili: {len(PAROLE_ITALIANE)}")
    app.run(debug=True, host='127.0.0.1', port=5001)
