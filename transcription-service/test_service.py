#!/usr/bin/env python
"""
اختبار خدمة التفريغ الصوتي بعد الترقية
"""
import requests
import json
import time

def test_health():
    """اختبار حالة الخدمة"""
    try:
        response = requests.get("http://localhost:5000/health", timeout=10)
        if response.status_code == 200:
            data = response.json()
            print("✅ الخدمة تعمل بشكل صحيح")
            print(f"📋 الموديل: {data.get('model', 'غير معروف')}")
            print(f"🔄 الموديل محمل: {'نعم' if data.get('model_loaded') else 'لا'}")
            print(f"📁 التنسيقات المدعومة: {', '.join(data.get('supported_formats', []))}")
            return True
        else:
            print(f"❌ خطأ في الخدمة: {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print("❌ لا يمكن الاتصال بالخدمة")
        print("💡 تأكد من تشغيل الخدمة: python start_service.py")
        return False
    except Exception as e:
        print(f"❌ خطأ: {e}")
        return False

def test_quality():
    """اختبار جودة التفريغ"""
    try:
        test_data = {
            "text": "مرحبا، أنا من دمشق وبحب احكي قصتي. شو رأيك بهالموضوع؟ كتير منيح هالبرنامج."
        }
        
        response = requests.post(
            "http://localhost:5000/test-quality",
            json=test_data,
            timeout=30
        )
        
        if response.status_code == 200:
            data = response.json()
            print("🧪 نتائج اختبار الجودة:")
            print(f"📊 نقاط الجودة: {data.get('estimated_quality', 0)}/1.0")
            print(f"🏆 مستوى الجودة: {data.get('quality_level', 'غير معروف')}")
            print(f"🇸🇾 دعم اللهجة السورية: {'نعم' if data.get('syrian_dialect_support') else 'لا'}")
            
            recommendations = data.get('recommendations', [])
            if recommendations:
                print("💡 التوصيات:")
                for i, rec in enumerate(recommendations, 1):
                    print(f"   {i}. {rec}")
            
            return True
        else:
            print(f"❌ فشل اختبار الجودة: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ خطأ في اختبار الجودة: {e}")
        return False

def test_model_change():
    """اختبار تغيير الموديل"""
    try:
        # Test changing to medium model
        response = requests.post(
            "http://localhost:5000/set-model",
            json={"model": "medium"},
            timeout=60
        )
        
        if response.status_code == 200:
            data = response.json()
            print("🔄 تم تغيير الموديل بنجاح")
            print(f"📋 الموديل الجديد: {data.get('model', 'غير معروف')}")
            return True
        else:
            print(f"❌ فشل تغيير الموديل: {response.status_code}")
            try:
                error_data = response.json()
                print(f"🔍 الخطأ: {error_data.get('message', 'خطأ غير معروف')}")
            except:
                pass
            return False
            
    except Exception as e:
        print(f"❌ خطأ في تغيير الموديل: {e}")
        return False

def main():
    """تشغيل جميع الاختبارات"""
    print("🎙️  اختبار خدمة التفريغ الصوتي - Voices of Syria")
    print("=" * 60)
    
    # Test 1: Health check
    print("\n1️⃣ اختبار حالة الخدمة...")
    health_ok = test_health()
    
    if not health_ok:
        print("\n❌ الخدمة لا تعمل. يرجى تشغيلها أولاً.")
        return
    
    # Test 2: Quality test
    print("\n2️⃣ اختبار جودة التفريغ...")
    quality_ok = test_quality()
    
    # Test 3: Model change test
    print("\n3️⃣ اختبار تغيير الموديل...")
    model_ok = test_model_change()
    
    # Summary
    print("\n" + "=" * 60)
    print("📋 ملخص النتائج:")
    print(f"   حالة الخدمة: {'✅ تعمل' if health_ok else '❌ لا تعمل'}")
    print(f"   جودة التفريغ: {'✅ جيدة' if quality_ok else '❌ مشكلة'}")
    print(f"   تغيير الموديل: {'✅ يعمل' if model_ok else '❌ مشكلة'}")
    
    if health_ok and quality_ok and model_ok:
        print("\n🎉 جميع الاختبارات نجحت! الخدمة جاهزة للاستخدام")
        print("💡 يمكنك الآن تجربة تفريغ ملف صوتي حقيقي")
    else:
        print("\n⚠️  بعض الاختبارات فشلت. راجع الأخطاء أعلاه")
        print("🔧 قد تحتاج لإعادة تشغيل الخدمة أو تحديث الموديل")

if __name__ == "__main__":
    main()