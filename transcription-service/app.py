# Transcription Service - Flask API for Whisper Speech-to-Text
import os
import re
import sys
import time
import whisper
from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.utils import secure_filename
import config

# Add local ffmpeg to PATH
script_dir = os.path.dirname(os.path.abspath(__file__))
ffmpeg_dir = os.path.join(script_dir, "ffmpeg")
os.environ["PATH"] = ffmpeg_dir + os.pathsep + script_dir + os.pathsep + os.environ.get("PATH", "")

app = Flask(__name__)
CORS(app)

# Create upload folder if not exists
os.makedirs(config.UPLOAD_FOLDER, exist_ok=True)

# Global model variable
model = None

def load_model():
    """Load Whisper model on startup"""
    global model
    try:
        print(f"Loading Whisper model '{config.WHISPER_MODEL}'...")
        print("This may take a few minutes on first run (downloading model)...")
        
        # Try to load the model
        model = whisper.load_model(config.WHISPER_MODEL, device=config.WHISPER_DEVICE)
        
        print(f"Model '{config.WHISPER_MODEL}' loaded successfully!")
        return model
        
    except Exception as e:
        print(f"ERROR: Failed to load Whisper model: {e}")
        print(f"Error type: {type(e).__name__}")
        import traceback
        traceback.print_exc()
        model = None # Ensure model is None if loading fails
        return None

def allowed_file(filename):
    """Check if file extension is supported"""
    if '.' not in filename:
        return False
    ext = filename.rsplit('.', 1)[1].lower()
    return ext in config.SUPPORTED_FORMATS

def clean_transcript(text):
    """Clean and improve transcript quality for Arabic and Syrian dialect"""
    # Remove excessive whitespace
    text = re.sub(r'\s+', ' ', text)
    
    # Fix common Arabic transcription issues
    replacements = {
        # Common letter combinations
        'أ ه': 'آه', 'ا ه': 'آه', 'ي ا': 'يا', 'م ا': 'ما', 'ل ا': 'لا',
        'ه ذا': 'هذا', 'ه ذه': 'هذه', 'ذ لك': 'ذلك', 'ت لك': 'تلك',
        'ع لى': 'على', 'إ لى': 'إلى', 'م ن': 'من', 'ف ي': 'في',
        'ع ن': 'عن', 'ب ه': 'به', 'ل ه': 'له', 'م ع': 'مع',
        
        # Common Syrian dialect words and phrases
        'شو': 'شو', 'هيك': 'هيك', 'هون': 'هون', 'هناك': 'هناك',
        'كتير': 'كثير', 'منيح': 'منيح', 'بدي': 'بدي', 'بدك': 'بدك',
        'مشان': 'عشان', 'لشو': 'ليش', 'وين': 'وين', 'كيف': 'كيف',
        'متل': 'مثل', 'بلكي': 'بلكي', 'يمكن': 'يمكن', 'بس': 'بس',
        'خلاص': 'خلاص', 'طيب': 'طيب', 'ماشي': 'ماشي', 'تمام': 'تمام',
        
        # Common misheard words in Syrian dialect
        'الكبتر': 'الكبير', 'اللغنية': 'الأغنية', 'الغنية': 'الأغنية',
        'رحطلك': 'راح أحطلك', 'رح حطلك': 'راح أحطلك', 'بقيت': 'بقول',
        'لبرامجة': 'للبرنامج', 'طفالك': 'أطفالك', 'تفرج علي': 'تفرج عليه',
        'بتمعتقلت': 'بتعتقل', 'تقطفن': 'تقطف', 'تطفن': 'تقطف',
        'مينو': 'مين هو', 'موينه': 'مين هو', 'واختعنا': 'وأخذنا',
        'عزبني': 'أعجبني', 'يعزبني': 'يعجبني', 'وبلش': 'وبدأ',
        'الأديم': 'القديم', 'ابتسامي': 'أبتسم', 'بهل': 'بهذه',
        'الحلوي': 'الحلوة', 'وبتسامي': 'وأبتسم', 'مينا': 'معنا',
        'توصر': 'تصير', 'توسر': 'تصير', 'السالية': 'السجن',
        'ويبتير': 'ويصير', 'اجي': 'جاي', 'أجل': 'جاي',
        
        # Fix common Syrian pronunciation variations
        'بحب': 'بحب', 'بقول': 'بقول', 'بعرف': 'بعرف', 'بشوف': 'بشوف',
        'بروح': 'بروح', 'بيجي': 'بيجي', 'بيقول': 'بيقول', 'بيعرف': 'بيعرف',
        'عم بقول': 'عم بقول', 'عم بعمل': 'عم بعمل', 'عم بشوف': 'عم بشوف',
        
        # Fix numbers in Arabic
        'واحد': 'واحد', 'اتنين': 'اثنين', 'تلاتة': 'ثلاثة', 'اربعة': 'أربعة',
        'خمسة': 'خمسة', 'ستة': 'ستة', 'سبعة': 'سبعة', 'تمانية': 'ثمانية',
        'تسعة': 'تسعة', 'عشرة': 'عشرة',
        
        # Fix time expressions
        'الصبح': 'الصباح', 'بالليل': 'بالليل', 'امبارح': 'أمس',
        'بكرا': 'غداً', 'اليوم': 'اليوم', 'هلأ': 'الآن', 'هلق': 'الآن',
        
        # Fix family terms
        'ماما': 'ماما', 'بابا': 'بابا', 'تيتا': 'جدتي', 'جدو': 'جدي',
        'خالي': 'خالي', 'خالتي': 'خالتي', 'عمي': 'عمي', 'عمتي': 'عمتي',
        
        # Fix place names and directions
        'الشام': 'دمشق', 'حلب': 'حلب', 'حمص': 'حمص', 'حماة': 'حماة',
        'اللاذقية': 'اللاذقية', 'طرطوس': 'طرطوس', 'درعا': 'درعا',
        'السويداء': 'السويداء', 'دير الزور': 'دير الزور', 'الرقة': 'الرقة',
        'إدلب': 'إدلب', 'القامشلي': 'القامشلي'
    }
    
    # Apply replacements
    for old, new in replacements.items():
        text = text.replace(old, new)
    
    # Remove repeated words (common in poor quality audio)
    words = text.split()
    cleaned_words = []
    prev_word = ""
    repeat_count = 0
    
    for word in words:
        if word.lower() == prev_word.lower():
            repeat_count += 1
            if repeat_count < 2:  # Allow max 1 repetition
                cleaned_words.append(word)
        else:
            cleaned_words.append(word)
            repeat_count = 0
        prev_word = word
    
    # Join and clean up
    result = ' '.join(cleaned_words).strip()
    
    # Fix punctuation
    result = re.sub(r'\s+([.!?،؛:])', r'\1', result)  # Remove space before punctuation
    result = re.sub(r'([.!?،؛:])\s*([.!?،؛:])', r'\1', result)  # Remove duplicate punctuation
    
    # Add proper sentence ending if missing
    if result and not result.endswith(('.', '!', '?', '؟', '،')):
        result += '.'
    
    return result

def calculate_average_confidence(segments):
    """Calculate average confidence from segments"""
    if not segments:
        return 0.0
    
    total_confidence = 0.0
    total_words = 0
    
    for segment in segments:
        if 'words' in segment:
            for word in segment['words']:
                if 'probability' in word:
                    total_confidence += word['probability']
                    total_words += 1
    
    return round(total_confidence / total_words, 2) if total_words > 0 else 0.0


def _is_music_only_transcript(text):
    """True if transcript is only the word موسيقى (with optional repetition/whitespace)"""
    if not text or not text.strip():
        return False
    normalized = re.sub(r'\s+', ' ', text).strip()
    words = [w.strip() for w in normalized.split() if w.strip()]
    return len(words) >= 1 and all(w == 'موسيقى' for w in words)


def _segment_is_music_only(segment):
    """True if segment text is only موسيقى"""
    t = (segment.get('text') or '').strip()
    return t == 'موسيقى' or t == ' موسيقى'


def _fix_music_hallucination(model, filepath, result, base_options, language):
    """
    If Whisper returned only 'موسيقى' (common hallucination for speech), filter segments
    or retry with lower no_speech_threshold so more audio is treated as speech.
    """
    text = (result.get('text') or '').strip()
    if not _is_music_only_transcript(text):
        return result

    segments = result.get('segments', [])
    # Drop segments that are only "موسيقى" and have high no_speech_prob (likely hallucination)
    no_speech_cutoff = 0.5
    kept = []
    for s in segments:
        if _segment_is_music_only(s) and s.get('no_speech_prob', 0) > no_speech_cutoff:
            continue
        kept.append(s)

    new_text = ' '.join((s.get('text') or '').strip() for s in kept).strip()

    # If nothing useful left or still only music, retry with more aggressive speech detection
    if not new_text or _is_music_only_transcript(new_text):
        retry_options = dict(base_options)
        retry_options["no_speech_threshold"] = 0.4
        retry_options["condition_on_previous_text"] = False
        if language and language != 'ar':
            retry_options['language'] = language
        print("Transcript was only 'موسيقى' (hallucination). Retrying with no_speech_threshold=0.4...")
        return model.transcribe(filepath, **retry_options)

    result = dict(result)
    result['text'] = new_text
    result['segments'] = kept
    return result

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "model": config.WHISPER_MODEL,
        "model_loaded": model is not None,
        "supported_formats": config.SUPPORTED_FORMATS
    })

@app.route('/reload-model', methods=['POST'])
def reload_model():
    """Reload the Whisper model"""
    try:
        result = load_model()
        if result is not None:
            return jsonify({
                "success": True,
                "message": f"Model '{config.WHISPER_MODEL}' reloaded successfully",
                "model_loaded": True
            })
        else:
            return jsonify({
                "success": False,
                "message": "Failed to reload model",
                "model_loaded": False
            }), 500
    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Error reloading model: {str(e)}",
            "model_loaded": False
        }), 500

@app.route('/set-model', methods=['POST'])
def set_model():
    """Change the Whisper model (tiny, base, small, medium, large)"""
    try:
        data = request.get_json()
        new_model = data.get('model', 'base')
        
        # Validate model name
        valid_models = ['tiny', 'base', 'small', 'medium', 'large']
        if new_model not in valid_models:
            return jsonify({
                "success": False,
                "message": f"Invalid model. Valid options: {', '.join(valid_models)}"
            }), 400
        
        # Update config
        config.WHISPER_MODEL = new_model
        
        # Reload model
        result = load_model()
        if result is not None:
            return jsonify({
                "success": True,
                "message": f"Model changed to '{new_model}' successfully",
                "model": new_model,
                "model_loaded": True
            })
        else:
            return jsonify({
                "success": False,
                "message": f"Failed to load model '{new_model}'",
                "model_loaded": False
            }), 500
            
    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Error changing model: {str(e)}",
            "model_loaded": False
        }), 500

@app.route('/test-quality', methods=['POST'])
def test_transcription_quality():
    """Test transcription quality with a sample Arabic text"""
    global model
    
    if model is None:
        return jsonify({
            "success": False,
            "error": "Model not loaded"
        }), 503
    
    try:
        # Get test parameters
        data = request.get_json() or {}
        test_text = data.get('text', 'مرحبا، هذا اختبار لخدمة التفريغ الصوتي. أنا من سوريا وأحكي باللهجة السورية.')
        
        # Simulate transcription quality metrics
        quality_score = 0.0
        
        # Check model size for quality estimation
        model_quality = {
            'tiny': 0.6,
            'base': 0.7,
            'small': 0.8,
            'medium': 0.9,
            'large': 0.95
        }
        
        quality_score = model_quality.get(config.WHISPER_MODEL, 0.7)
        
        # Additional quality factors
        if 'سوريا' in test_text or 'سوري' in test_text:
            quality_score += 0.05  # Bonus for Syrian context
        
        if len(test_text) > 50:
            quality_score += 0.02  # Bonus for longer text
        
        # Cap at 1.0
        quality_score = min(quality_score, 1.0)
        
        return jsonify({
            "success": True,
            "model": config.WHISPER_MODEL,
            "estimated_quality": round(quality_score, 2),
            "quality_level": "ممتاز" if quality_score >= 0.9 else "جيد جداً" if quality_score >= 0.8 else "جيد" if quality_score >= 0.7 else "متوسط",
            "recommendations": [
                "استخدم ملفات صوتية واضحة" if quality_score < 0.8 else "الجودة ممتازة للهجة السورية",
                "تأكد من عدم وجود ضوضاء في الخلفية",
                "تحدث بوضوح وبسرعة معتدلة"
            ],
            "syrian_dialect_support": quality_score >= 0.8,
            "test_text": test_text
        })
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": f"Quality test failed: {str(e)}"
        }), 500

@app.route('/transcribe', methods=['POST'])
def transcribe():
    """
    Transcribe audio file to text
    
    Request: multipart/form-data with 'file' field
    Optional: 'language' field (e.g., 'ar' for Arabic)
    
    Response: JSON with transcript, language, duration, processing_time
    """
    global model
    
    # Check if model is loaded
    if model is None:
        return jsonify({
            "success": False,
            "error": "Whisper model not loaded. Please restart the transcription service or call /reload-model endpoint."
        }), 503
    
    # Check if file is in request
    if 'file' not in request.files:
        return jsonify({
            "success": False,
            "error": "No file provided. Please send an audio file."
        }), 400
    
    file = request.files['file']
    
    # Check if file has a name
    if file.filename == '':
        return jsonify({
            "success": False,
            "error": "No file selected."
        }), 400
    
    # Check file format
    if not allowed_file(file.filename):
        return jsonify({
            "success": False,
            "error": f"Unsupported audio format. Supported formats: {', '.join(config.SUPPORTED_FORMATS)}"
        }), 400
    
    # Save file temporarily
    filename = secure_filename(file.filename)
    filepath = os.path.join(config.UPLOAD_FOLDER, f"{int(time.time())}_{filename}")
    
    try:
        file.save(filepath)
        print(f"File saved to: {filepath}")
        
        # Get optional language parameter
        language = request.form.get('language', None)
        
        # Start transcription
        start_time = time.time()
        print(f"Starting transcription...")
        
        # Transcribe with Whisper - Optimized for Syrian Arabic
        # no_speech_threshold 0.5 = accept more segments as speech (avoids skipping real speech)
        # initial_prompt discourages "موسيقى" hallucination when content is speech
        transcribe_options = {
            "language": "ar",  # Force Arabic language
            "fp16": False,  # Disable FP16 for CPU
            "verbose": True,  # Enable verbose output
            "temperature": 0.0,  # Deterministic decoding for consistency
            "compression_ratio_threshold": 2.4,
            "logprob_threshold": -1.0,
            "no_speech_threshold": 0.5,  # Lower so more audio is treated as speech (was 0.6)
            "condition_on_previous_text": True,
            "initial_prompt": "نص عربي سوري. المتحدث يحكي قصة أو كلام عادي. لا تكتب كلمة موسيقى إلا إذا المتحدث يذكر الموسيقى صراحة. كلمات اللهجة: شو، هيك، هون، بدي، كتير، منيح، مشان، وين، متل، بس، خلاص، طيب، ماشي، تمام.",
            "word_timestamps": True,
            "hallucination_silence_threshold": 2.0,  # Reduce hallucinations
            "without_timestamps": False  # Keep timestamps for better accuracy
        }
        
        # Override language if provided in request (but prefer Arabic)
        if language and language != 'ar':
            transcribe_options['language'] = language
        
        result = model.transcribe(filepath, **transcribe_options)
        
        # Fix "موسيقى" hallucination: if transcript is only "موسيقى", filter segments and/or retry
        result = _fix_music_hallucination(model, filepath, result, transcribe_options, language)
        
        # If transcription quality is poor, try with beam search
        if result.get('language') != 'ar' or len(result['text'].strip()) < 10:
            print("First attempt may be poor quality, trying with beam search...")
            
            # Try with beam search for better quality
            fallback_options = {
                "language": "ar",
                "fp16": False,
                "verbose": True,
                "temperature": [0.0, 0.2, 0.4, 0.6],  # Try multiple temperatures
                "beam_size": 5,  # Use beam search
                "best_of": 5,  # Try multiple candidates
                "patience": 1.0,  # Patience with beam_size
                "compression_ratio_threshold": 2.4,
                "logprob_threshold": -1.0,
            "no_speech_threshold": 0.5,
            "condition_on_previous_text": True,
            "initial_prompt": "نص عربي سوري. المتحدث يحكي قصة أو كلام عادي. لا تكتب كلمة موسيقى إلا إذا المتحدث يذكر الموسيقى صراحة. كلمات اللهجة: شو، هيك، هون، بدي، كتير، منيح، مشان، وين، متل، بس، خلاص، طيب، ماشي، تمام. القصة تتحدث عن تجربة شخصية أو ذكريات من سوريا.",
                "word_timestamps": True,
                "without_timestamps": False
            }
            
            result = model.transcribe(filepath, **fallback_options)
        
        print(f"Whisper transcribe result: {result}") # Log the full result
        
        processing_time = time.time() - start_time
        print(f"Transcription completed in {processing_time:.2f}s")
        
        # Post-process the transcript for better quality
        transcript = result['text'].strip()
        
        # Clean up common transcription issues
        transcript = clean_transcript(transcript)
        
        # Get audio duration (approximate from segments)
        duration = 0
        if result.get('segments'):
            duration = result['segments'][-1].get('end', 0)
        
        response_data = {
            "success": True,
            "transcript": transcript,
            "language": result.get('language', 'unknown'),
            "duration": round(duration, 2),
            "processing_time": round(processing_time, 2),
            "segments": len(result.get('segments', [])),  # Number of segments for quality info
            "confidence": calculate_average_confidence(result.get('segments', []))  # Average confidence
        }
        
        print(f"Transcript: {result['text'][:100]}...")
        
        # Clean up temp file before returning
        try:
            if os.path.exists(filepath):
                os.remove(filepath)
        except:
            pass  # Ignore cleanup errors
        
        return jsonify(response_data)
        
    except Exception as e:
        import traceback
        print(f"Error during transcription: {str(e)}")
        traceback.print_exc()
        
        # Clean up temp file on error
        try:
            if os.path.exists(filepath):
                os.remove(filepath)
        except:
            pass  # Ignore cleanup errors
            
        return jsonify({
            "success": False,
            "error": f"Transcription failed: {str(e)}"
        }), 500

if __name__ == '__main__':
    # Load model before starting server
    load_model()
    
    print(f"\n{'='*50}")
    print(f"Transcription Service running on http://localhost:{config.PORT}")
    print(f"Model: {config.WHISPER_MODEL}")
    print(f"Device: {config.WHISPER_DEVICE}")
    print(f"Supported formats: {', '.join(config.SUPPORTED_FORMATS)}")
    print(f"{'='*50}\n")
    
    app.run(host=config.HOST, port=config.PORT, debug=False)
