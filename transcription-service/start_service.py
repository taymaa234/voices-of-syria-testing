#!/usr/bin/env python
import sys
import os

# Add the virtual environment to the path
venv_path = os.path.join(os.path.dirname(__file__), 'venv', 'Lib', 'site-packages')
sys.path.insert(0, venv_path)

# Now import and run the app
from app import app, load_model
import config

def show_startup_info():
    """عرض معلومات بدء التشغيل"""
    print("🎙️  خدمة التفريغ الصوتي - Voices of Syria")
    print("=" * 60)
    print(f"📋 الموديل: {config.WHISPER_MODEL}")
    print(f"🖥️  الجهاز: {config.WHISPER_DEVICE}")
    print(f"🌐 العنوان: http://localhost:{config.PORT}")
    print(f"📁 التنسيقات: {', '.join(config.SUPPORTED_FORMATS[:5])}...")
    
    # Model quality info
    model_info = {
        'tiny': '⚡ سريع جداً - دقة منخفضة (60%)',
        'base': '🚀 سريع - دقة متوسطة (70%)', 
        'small': '⚖️ متوازن - دقة جيدة (80%)',
        'medium': '🎯 محسن - دقة عالية للعربي (90%)',
        'large': '🏆 الأفضل - دقة قصوى (95%)'
    }
    
    quality = model_info.get(config.WHISPER_MODEL, '❓ غير معروف')
    print(f"📊 الجودة: {quality}")
    
    if config.WHISPER_MODEL in ['medium', 'large']:
        print("✨ محسن خصيصاً للهجة السورية!")
    elif config.WHISPER_MODEL in ['tiny', 'base']:
        print("💡 للحصول على دقة أفضل، شغل: upgrade_transcription.bat")
    
    print("=" * 60)

# Load model explicitly here
if __name__ == '__main__':
    show_startup_info()
    print("🔄 تحميل الموديل...")
    
    model = load_model()
    if model is None:
        print("❌ فشل في تحميل الموديل!")
        print("💡 جرب:")
        print("   1. python download_medium_model.py")
        print("   2. أو شغل upgrade_transcription.bat")
        sys.exit(1)
    
    print("✅ الموديل محمل بنجاح!")
    print("🚀 بدء الخدمة...")
    print(f"📡 الخدمة تعمل على: http://localhost:{config.PORT}")
    print("🔗 اختبار الخدمة: python test_service.py")
    print()
    
    app.run(host='0.0.0.0', port=config.PORT, debug=False)
