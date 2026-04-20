# Transcription Service Configuration

# Whisper Model Settings
# Options: tiny, base, small, medium, large
# Using 'medium' for much better Arabic accuracy (especially Syrian dialect)
WHISPER_MODEL = "medium"

# Device: cpu or cuda (use cpu since MX130 has limited VRAM)
WHISPER_DEVICE = "cpu"

# Server Settings
HOST = "0.0.0.0"
PORT = 5000

# File Settings
MAX_AUDIO_SIZE_MB = 50
SUPPORTED_FORMATS = ["mp3", "wav", "m4a", "webm", "ogg", "flac", "mp4", "avi", "mov", "mkv"]

# Temp directory for uploaded files
UPLOAD_FOLDER = "temp_uploads"
