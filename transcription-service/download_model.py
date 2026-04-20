#!/usr/bin/env python
"""
Script to manually download Whisper model with retry logic
"""
import whisper
import time
import sys

def download_model_with_retry(model_name="tiny", max_retries=5):
    """Download Whisper model with retry logic"""
    
    for attempt in range(max_retries):
        try:
            print(f"Attempt {attempt + 1}/{max_retries}: Downloading Whisper model '{model_name}'...")
            
            # Try to download/load the model
            model = whisper.load_model(model_name, device="cpu")
            
            print(f"✅ Model '{model_name}' downloaded and loaded successfully!")
            return model
            
        except Exception as e:
            print(f"❌ Attempt {attempt + 1} failed: {e}")
            
            if attempt < max_retries - 1:
                wait_time = (attempt + 1) * 10  # Wait longer each time
                print(f"⏳ Waiting {wait_time} seconds before retry...")
                time.sleep(wait_time)
            else:
                print(f"💥 All {max_retries} attempts failed!")
                return None
    
    return None

if __name__ == "__main__":
    model_name = sys.argv[1] if len(sys.argv) > 1 else "tiny"
    
    print(f"🚀 Starting download of Whisper model: {model_name}")
    print("This may take several minutes depending on your internet connection...")
    print("-" * 60)
    
    model = download_model_with_retry(model_name)
    
    if model:
        print("-" * 60)
        print("🎉 Model download completed successfully!")
        print("You can now start the transcription service.")
    else:
        print("-" * 60)
        print("💔 Model download failed. Please check your internet connection.")
        print("You can try again later or use a different model size.")