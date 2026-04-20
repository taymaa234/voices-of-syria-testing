#!/usr/bin/env python
"""
Script to download the medium Whisper model for better Arabic transcription
"""
import whisper
import time
import sys
import os

def download_medium_model():
    """Download Whisper medium model with progress tracking"""
    
    print("🚀 تحميل موديل Whisper المتوسط للحصول على تفريغ أفضل للعربي")
    print("=" * 60)
    print("📋 معلومات الموديل:")
    print("   - الاسم: medium")
    print("   - الحجم: ~769 MB")
    print("   - الدقة: عالية جداً للعربي")
    print("   - السرعة: متوسطة")
    print("=" * 60)
    
    try:
        print("⏳ بدء التحميل... قد يستغرق عدة دقائق حسب سرعة الإنترنت")
        start_time = time.time()
        
        # Download the medium model
        model = whisper.load_model("medium", device="cpu")
        
        download_time = time.time() - start_time
        
        print("=" * 60)
        print("✅ تم تحميل الموديل بنجاح!")
        print(f"⏱️  وقت التحميل: {download_time:.1f} ثانية")
        print("🎯 الموديل جاهز للاستخدام")
        print("=" * 60)
        
        # Test the model with a simple Arabic phrase
        print("🧪 اختبار الموديل...")
        test_result = model.transcribe("test", language="ar")
        print("✅ الموديل يعمل بشكل صحيح")
        
        return True
        
    except Exception as e:
        print("=" * 60)
        print("❌ فشل في تحميل الموديل!")
        print(f"🔍 الخطأ: {e}")
        print("💡 تأكد من:")
        print("   - اتصال الإنترنت")
        print("   - وجود مساحة كافية (1 GB على الأقل)")
        print("   - صلاحيات الكتابة في المجلد")
        print("=" * 60)
        return False

def check_current_model():
    """Check what model is currently configured"""
    try:
        import config
        print(f"📋 الموديل الحالي في الكونفيج: {config.WHISPER_MODEL}")
        return config.WHISPER_MODEL
    except:
        print("⚠️  لم يتم العثور على ملف الكونفيج")
        return None

if __name__ == "__main__":
    print("🎙️  محسن خدمة التفريغ الصوتي - Voices of Syria")
    print()
    
    # Check current configuration
    current_model = check_current_model()
    
    if current_model == "medium":
        print("✅ الموديل المتوسط مُعد بالفعل في الكونفيج")
        print("🔄 سيتم التأكد من تحميله...")
    else:
        print(f"📝 سيتم ترقية الموديل من '{current_model}' إلى 'medium'")
    
    print()
    
    # Download the model
    success = download_medium_model()
    
    if success:
        print()
        print("🎉 التحديث مكتمل!")
        print("📌 الخطوات التالية:")
        print("   1. أعد تشغيل خدمة التفريغ")
        print("   2. جرب تفريغ ملف صوتي جديد")
        print("   3. ستلاحظ تحسن كبير في الدقة")
        print()
        print("🚀 لإعادة تشغيل الخدمة:")
        print("   python start_service.py")
    else:
        print()
        print("💔 فشل التحديث")
        print("🔄 يمكنك المحاولة مرة أخرى لاحقاً")