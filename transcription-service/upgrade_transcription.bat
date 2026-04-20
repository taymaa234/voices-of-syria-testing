@echo off
chcp 65001 >nul
title تحسين خدمة التفريغ الصوتي - Voices of Syria

echo.
echo 🎙️  محسن خدمة التفريغ الصوتي - Voices of Syria
echo ================================================
echo.
echo 📋 هذا السكريبت سيقوم بـ:
echo    ✓ ترقية موديل Whisper للحصول على دقة أفضل
echo    ✓ تحسين التفريغ للهجة السورية
echo    ✓ إضافة معالجة متقدمة للنصوص
echo.

pause

echo 🚀 بدء عملية الترقية...
powershell -ExecutionPolicy Bypass -File "upgrade_model.ps1"

echo.
echo ✅ انتهت عملية الترقية
pause