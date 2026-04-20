# PowerShell script to download Whisper tiny model
$cacheDir = "$env:USERPROFILE\.cache\whisper"
$modelUrl = "https://openaipublic.azureedge.net/main/whisper/models/65147644a518d12f04e32d6f3b26facc3f8dd46e5390956a9424a650c0ce22b9/tiny.pt"
$modelPath = "$cacheDir\tiny.pt"

Write-Host "Creating cache directory..." -ForegroundColor Green
New-Item -ItemType Directory -Force -Path $cacheDir | Out-Null

Write-Host "Downloading Whisper tiny model..." -ForegroundColor Green
Write-Host "URL: $modelUrl" -ForegroundColor Yellow
Write-Host "Saving to: $modelPath" -ForegroundColor Yellow

try {
    Invoke-WebRequest -Uri $modelUrl -OutFile $modelPath -UseBasicParsing
    Write-Host "✅ Model downloaded successfully!" -ForegroundColor Green
    Write-Host "File size: $((Get-Item $modelPath).Length / 1MB) MB" -ForegroundColor Cyan
} catch {
    Write-Host "❌ Download failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "Press any key to continue..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")