@echo off
chcp 65001 >nul
title خدمة التفريغ الصوتي - Voices of Syria

echo.
echo 🎙️  خدمة التفريغ الصوتي - Voices of Syria
echo ===============================================
echo.

REM Check if we're in the right directory
if not exist "app.py" (
    echo ❌ يرجى تشغيل هذا الملف من مجلد transcription-service
    echo 📂 المجلد الحالي: %CD%
    pause
    exit /b 1
)

REM Kill any existing Python processes for this service
echo 🔄 إيقاف الخدمات السابقة...
taskkill /f /im python.exe 2>nul >nul

REM Wait a moment
echo ⏳ انتظار لحظة...
timeout /t 2 /nobreak >nul

REM Navigate to script directory
cd /d "%~dp0"

REM Check for virtual environment
if exist "venv\Scripts\activate.bat" (
    echo 🔄 تفعيل البيئة الافتراضية...
    call venv\Scripts\activate.bat
) else if exist "venv_new\Scripts\activate.bat" (
    echo 🔄 تفعيل البيئة الافتراضية الجديدة...
    call venv_new\Scripts\activate.bat
) else (
    echo ⚠️  لم يتم العثور على بيئة افتراضية
    echo 💡 سيتم استخدام Python العام
)

echo.
echo 🚀 بدء خدمة التفريغ الصوتي...
echo 📡 ستعمل على: http://localhost:5000
echo 🔗 لاختبار الخدمة: python test_service.py
echo ⏹️  لإيقاف الخدمة: اضغط Ctrl+C
echo.

REM Start the service
python start_service.py

echo.
echo 📴 تم إيقاف الخدمة
pause