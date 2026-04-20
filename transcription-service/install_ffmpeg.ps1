# PowerShell script to download and install ffmpeg
$ffmpegDir = "$PSScriptRoot\ffmpeg"
$ffmpegUrl = "https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-win64-gpl.zip"
$zipPath = "$PSScriptRoot\ffmpeg.zip"

Write-Host "Creating ffmpeg directory..." -ForegroundColor Green
New-Item -ItemType Directory -Force -Path $ffmpegDir | Out-Null

Write-Host "Downloading ffmpeg..." -ForegroundColor Green
Write-Host "URL: $ffmpegUrl" -ForegroundColor Yellow

try {
    Invoke-WebRequest -Uri $ffmpegUrl -OutFile $zipPath -UseBasicParsing
    Write-Host "✅ Download completed!" -ForegroundColor Green
    
    Write-Host "Extracting ffmpeg..." -ForegroundColor Green
    Expand-Archive -Path $zipPath -DestinationPath $ffmpegDir -Force
    
    # Find the extracted folder and move ffmpeg.exe to the root
    $extractedFolder = Get-ChildItem -Path $ffmpegDir -Directory | Select-Object -First 1
    $ffmpegExe = Join-Path $extractedFolder.FullName "bin\ffmpeg.exe"
    
    if (Test-Path $ffmpegExe) {
        Copy-Item $ffmpegExe -Destination "$ffmpegDir\ffmpeg.exe"
        Write-Host "✅ ffmpeg.exe copied to $ffmpegDir" -ForegroundColor Green
    }
    
    # Clean up
    Remove-Item $zipPath -Force
    Write-Host "✅ Installation completed!" -ForegroundColor Green
    Write-Host "ffmpeg is now available at: $ffmpegDir\ffmpeg.exe" -ForegroundColor Cyan
    
} catch {
    Write-Host "❌ Installation failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "Press any key to continue..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")