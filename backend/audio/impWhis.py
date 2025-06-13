from flask import Flask, request, jsonify
from flask_cors import CORS
import whisper
import tempfile
import os
from ollama import chat
import difflib
import random

app = Flask(__name__)
# CORREZIONE CRITICA: Cambia da 5000 a 3000 per React
CORS(app, origins=['http://localhost:3000'])

# Lista di parole italiane
PAROLE_ITALIANE = [
    "ciao", "buongiorno", "buonasera", "arrivederci", "salve", "grazie", "prego",
    "madre", "padre", "figlio", "figlia", "nonno", "nonna", "fratello", "sorella",
    "rosso", "blu", "verde", "giallo", "nero", "bianco", "rosa", "viola",
    "uno", "due", "tre", "quattro", "cinque", "sei", "sette", "otto", "nove", "dieci",
    "pasta", "pizza", "gelato", "caffè", "pane", "formaggio", "pomodoro", "basilico",
    "cucina", "bagno", "camera", "salotto", "finestra", "porta", "tavolo", "sedia",
    "oggi", "ieri", "domani", "mattina", "pomeriggio", "sera", "notte", "settimana",
    "cane", "gatto", "uccello", "pesce", "cavallo", "mucca", "pecora", "coniglio",
    "testa", "occhi", "naso", "bocca", "mani", "piedi", "braccia", "gambe",
    "albero", "fiore", "erba", "montagna", "mare", "fiume", "sole", "luna", "stella"
]

# Carica il modello Whisper
try:
    whisper_model = whisper.load_model("base")
    print("✅ Modello Whisper caricato correttamente")
except Exception as e:
    print(f"❌ Errore caricamento Whisper: {e}")
    whisper_model = None

@app.route('/')
def index():
    return jsonify({
        "message": "API di pronuncia italiana attiva", 
        "status": "running",
        "words_count": len(PAROLE_ITALIANE)
    })

@app.route('/get_random_word', methods=['GET'])
def get_random_word():
    """Restituisce una parola casuale dalla lista"""
    word = random.choice(PAROLE_ITALIANE)
    print(f"🎯 Parola generata: {word}")
    return jsonify({
        'word': word,
        'status': 'success'
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
        reference_text = request.form.get('reference_text', '')

        if not reference_text.strip():
            return jsonify({
                'error': 'Testo di riferimento mancante',
                'status': 'error'
            })

        with tempfile.NamedTemporaryFile(delete=False, suffix='.wav') as temp_audio:
            audio_data.save(temp_audio.name)

            try:
                result = whisper_model.transcribe(temp_audio.name, language='it')
                transcribed_text = result["text"].strip()

                if not transcribed_text:
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

        similarity = difflib.SequenceMatcher(None, reference_text.lower(), transcribed_text.lower()).ratio()

        evaluation_prompt = f"""
Sei un esperto insegnante di pronuncia italiana. Valuta la pronuncia dello studente.

TESTO DI RIFERIMENTO: "{reference_text}"
TESTO PRONUNCIATO: "{transcribed_text}"
SIMILARITÀ: {similarity:.2f}

CRITERI:
- Considera errori di pronuncia comuni
- Ignora piccole differenze di punteggiatura
- Valuta comprensibilità del messaggio
- Considera contesto e significato

VALUTAZIONE:
"BRAVO" = pronuncia corretta/ottima, significato chiaro
"PROVA A FARE DI MEGLIO" = pronuncia parzialmente corretta, comprensibile ma con errori
"SBAGLIATO" = pronuncia molto diversa, significato poco chiaro

Rispondi SOLO con una delle tre opzioni sopra, nient'altro.
"""

        try:
            response = chat(
                model='gemma3',
                messages=[
                    {
                        'role': 'system',
                        'content': 'Sei un insegnante di pronuncia. Rispondi SEMPRE e SOLO con "BRAVO", "PROVA A FARE DI MEGLIO" o "SBAGLIATO".'
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

        if "BRAVO" in feedback:
            feedback = "BRAVO"
        elif "PROVA A FARE DI MEGLIO" in feedback:
            feedback = "PROVA A FARE DI MEGLIO"
        elif "SBAGLIATO" in feedback:
            feedback = "SBAGLIATO"
        else:
            if similarity >= 0.85:
                feedback = "BRAVO"
            elif similarity >= 0.6:
                feedback = "PROVA A FARE DI MEGLIO"
            else:
                feedback = "SBAGLIATO"

        corrections = []
        if feedback != "BRAVO":
            corrections = generate_pronunciation_tips(reference_text, transcribed_text, similarity)

        return jsonify({
            'transcribed_text': transcribed_text,
            'reference_text': reference_text,
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

def generate_pronunciation_tips(reference, transcribed, similarity):
    """Genera suggerimenti di correzione intelligenti per l'italiano"""
    tips = []
    ref_words = reference.lower().split()
    trans_words = transcribed.lower().split()

    if similarity < 0.3:
        tips.append("🎯 Parla più lentamente e articola meglio le parole")
        tips.append("🔊 Avvicinati al microfono e parla più chiaramente")
    elif similarity < 0.6:
        tips.append("📢 Concentrati sulla pronuncia delle consonanti doppie")
        tips.append("🎵 Presta attenzione all'accento tonico delle parole")

    for i, ref_word in enumerate(ref_words):
        if i < len(trans_words):
            trans_word = trans_words[i]
            if ref_word != trans_word:
                if 'gl' in ref_word and 'l' in trans_word:
                    tips.append(f"🗣️ Pronuncia 'GL' in '{ref_word}' come in 'famiglia'")
                elif 'gn' in ref_word and 'n' in trans_word:
                    tips.append(f"🔤 Pronuncia 'GN' in '{ref_word}' come in 'gnocchi'")
                elif ref_word.count('l') == 2 and trans_word.count('l') == 1:
                    tips.append(f"⚡ Ricorda la doppia 'LL' in '{ref_word}'")
                elif len(ref_word) > 3:
                    tips.append(f"🎯 Concentrati sulla pronuncia di '{ref_word}'")

    if len(trans_words) < len(ref_words):
        tips.append("📝 Assicurati di pronunciare tutte le parole")

    return tips[:3]

if __name__ == '__main__':
    print("🚀 Avviando impWhis.py...")
    print(f" - Whisper: {'✅' if whisper_model else '❌'}")
    print(f" - Parole caricate: ✅ {len(PAROLE_ITALIANE)} parole")
    print("\n🌐 API disponibile su: http://localhost:5000")
    app.run(debug=True, host='0.0.0.0', port=5000)
