# PowerShell script to upgrade Whisper model to medium for better Arabic transcription
# Voices of Syria - Transcription Service Upgrade

Write-Host "🎙️  محسن خدمة التفريغ الصوتي - Voices of Syria" -ForegroundColor Cyan
Write-Host "=" -Repeat 60 -ForegroundColor Gray

# Check if Python is available
Write-Host "🔍 فحص Python..." -ForegroundColor Yellow
try {
    $pythonVersion = python --version 2>&1
    Write-Host "✅ Python متوفر: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Python غير متوفر! يرجى تثبيت Python أولاً" -ForegroundColor Red
    exit 1
}

# Check if we're in the right directory
if (-not (Test-Path "config.py")) {
    Write-Host "⚠️  تأكد من تشغيل السكريبت من مجلد transcription-service" -ForegroundColor Yellow
    Write-Host "📂 المجلد الحالي: $(Get-Location)" -ForegroundColor Gray
    
    # Try to find the transcription-service directory
    if (Test-Path "../transcription-service/config.py") {
        Write-Host "🔄 الانتقال لمجلد transcription-service..." -ForegroundColor Yellow
        Set-Location "../transcription-service"
    } elseif (Test-Path "transcription-service/config.py") {
        Write-Host "🔄 الانتقال لمجلد transcription-service..." -ForegroundColor Yellow
        Set-Location "transcription-service"
    } else {
        Write-Host "❌ لم يتم العثور على مجلد transcription-service" -ForegroundColor Red
        exit 1
    }
}

Write-Host "📂 المجلد الحالي: $(Get-Location)" -ForegroundColor Gray

# Check virtual environment
Write-Host "🔍 فحص البيئة الافتراضية..." -ForegroundColor Yellow

$venvPaths = @("venv", "venv_new", ".venv")
$venvFound = $false

foreach ($venvPath in $venvPaths) {
    if (Test-Path $venvPath) {
        Write-Host "✅ تم العثور على البيئة الافتراضية: $venvPath" -ForegroundColor Green
        
        # Activate virtual environment
        $activateScript = Join-Path $venvPath "Scripts\Activate.ps1"
        if (Test-Path $activateScript) {
            Write-Host "🔄 تفعيل البيئة الافتراضية..." -ForegroundColor Yellow
            & $activateScript
            $venvFound = $true
            break
        }
    }
}

if (-not $venvFound) {
    Write-Host "⚠️  لم يتم العثور على بيئة افتراضية، سيتم استخدام Python العام" -ForegroundColor Yellow
}

# Check if whisper is installed
Write-Host "🔍 فحص مكتبة Whisper..." -ForegroundColor Yellow
try {
    python -c "import whisper; print('Whisper version:', whisper.__version__)" 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ مكتبة Whisper متوفرة" -ForegroundColor Green
    } else {
        throw "Whisper not found"
    }
} catch {
    Write-Host "❌ مكتبة Whisper غير متوفرة!" -ForegroundColor Red
    Write-Host "📦 تثبيت مكتبة Whisper..." -ForegroundColor Yellow
    pip install openai-whisper
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ فشل في تثبيت Whisper" -ForegroundColor Red
        exit 1
    }
}

# Show current model info
Write-Host "`n📋 معلومات الترقية:" -ForegroundColor Cyan
Write-Host "   من: موديل صغير (دقة منخفضة)" -ForegroundColor Gray
Write-Host "   إلى: موديل متوسط (دقة عالية للعربي)" -ForegroundColor Gray
Write-Host "   الحجم: ~769 MB" -ForegroundColor Gray
Write-Host "   التحسين: مخصص للهجة السورية" -ForegroundColor Gray

# Ask for confirmation
Write-Host "`n❓ هل تريد المتابعة؟ (y/n): " -ForegroundColor Yellow -NoNewline
$confirmation = Read-Host

if ($confirmation -ne 'y' -and $confirmation -ne 'Y' -and $confirmation -ne 'yes') {
    Write-Host "❌ تم إلغاء العملية" -ForegroundColor Red
    exit 0
}

# Download the medium model
Write-Host "`n🚀 بدء تحميل الموديل المحسن..." -ForegroundColor Cyan
Write-Host "⏳ قد يستغرق عدة دقائق حسب سرعة الإنترنت..." -ForegroundColor Yellow

try {
    python download_medium_model.py
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "`n🎉 تم تحديث الموديل بنجاح!" -ForegroundColor Green
        Write-Host "=" -Repeat 60 -ForegroundColor Gray
        
        Write-Host "📌 الخطوات التالية:" -ForegroundColor Cyan
        Write-Host "   1. أعد تشغيل خدمة التفريغ" -ForegroundColor White
        Write-Host "   2. جرب تفريغ ملف صوتي جديد" -ForegroundColor White
        Write-Host "   3. ستلاحظ تحسن كبير في دقة التفريغ" -ForegroundColor White
        
        Write-Host "`n🚀 لإعادة تشغيل الخدمة:" -ForegroundColor Cyan
        Write-Host "   .\restart_service.bat" -ForegroundColor White
        Write-Host "   أو" -ForegroundColor Gray
        Write-Host "   python start_service.py" -ForegroundColor White
        
        Write-Host "`n✨ الآن خدمة التفريغ محسنة للهجة السورية!" -ForegroundColor Green
        
    } else {
        Write-Host "`n❌ فشل في تحميل الموديل" -ForegroundColor Red
        Write-Host "🔄 يمكنك المحاولة مرة أخرى لاحقاً" -ForegroundColor Yellow
    }
    
} catch {
    Write-Host "`n❌ حدث خطأ أثناء التحميل: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "🔄 تأكد من اتصال الإنترنت وحاول مرة أخرى" -ForegroundColor Yellow
}

Write-Host "`nاضغط أي مفتاح للخروج..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")