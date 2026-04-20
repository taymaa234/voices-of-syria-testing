# PowerShell script to setup ffmpeg directory and download
$transcriptionDir = $PSScriptRoot
$ffmpegDir = Join-Path $transcriptionDir "ffmpeg"
$ffmpegExePath = Join-Path $ffmpegDir "ffmpeg.exe"

Write-Host "Setting up ffmpeg for transcription service..." -ForegroundColor Green
Write-Host "Transcription directory: $transcriptionDir" -ForegroundColor Yellow

# Create ffmpeg directory
Write-Host "Creating ffmpeg directory..." -ForegroundColor Green
New-Item -ItemType Directory -Force -Path $ffmpegDir | Out-Null
Write-Host "✅ Directory created: $ffmpegDir" -ForegroundColor Green

# Check if ffmpeg.exe already exists
if (Test-Path $ffmpegExePath) {
    Write-Host "✅ ffmpeg.exe already exists at: $ffmpegExePath" -ForegroundColor Green
} else {
    Write-Host "Downloading ffmpeg..." -ForegroundColor Green
    
    # Download from a reliable source
    $ffmpegUrl = "https://www.gyan.dev/ffmpeg/builds/packages/ffmpeg-7.1-essentials_build.zip"
    $zipPath = Join-Path $transcriptionDir "ffmpeg_temp.zip"
    
    try {
        Write-Host "Downloading from: $ffmpegUrl" -ForegroundColor Yellow
        Invoke-WebRequest -Uri $ffmpegUrl -OutFile $zipPath -UseBasicParsing
        Write-Host "✅ Download completed!" -ForegroundColor Green
        
        Write-Host "Extracting ffmpeg..." -ForegroundColor Green
        $tempExtractDir = Join-Path $transcriptionDir "temp_extract"
        Expand-Archive -Path $zipPath -DestinationPath $tempExtractDir -Force
        
        # Find ffmpeg.exe in the extracted files
        $ffmpegExeSource = Get-ChildItem -Path $tempExtractDir -Recurse -Name "ffmpeg.exe" | Select-Object -First 1
        
        if ($ffmpegExeSource) {
            $sourcePath = Join-Path $tempExtractDir $ffmpegExeSource
            Copy-Item $sourcePath -Destination $ffmpegExePath
            Write-Host "✅ ffmpeg.exe copied to: $ffmpegExePath" -ForegroundColor Green
        } else {
            Write-Host "❌ Could not find ffmpeg.exe in downloaded archive" -ForegroundColor Red
        }
        
        # Clean up
        Remove-Item $zipPath -Force -ErrorAction SilentlyContinue
        Remove-Item $tempExtractDir -Recurse -Force -ErrorAction SilentlyContinue
        
    } catch {
        Write-Host "❌ Download failed: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host "Please download ffmpeg manually from: https://www.gyan.dev/ffmpeg/builds/" -ForegroundColor Yellow
    }
}

# Verify installation
if (Test-Path $ffmpegExePath) {
    Write-Host "✅ Setup completed successfully!" -ForegroundColor Green
    Write-Host "ffmpeg.exe is available at: $ffmpegExePath" -ForegroundColor Cyan
    
    # Test ffmpeg
    try {
        $version = & $ffmpegExePath -version 2>$null | Select-Object -First 1
        Write-Host "✅ ffmpeg version: $version" -ForegroundColor Cyan
    } catch {
        Write-Host "⚠️  ffmpeg installed but version check failed" -ForegroundColor Yellow
    }
} else {
    Write-Host "❌ Setup failed. Please download ffmpeg manually." -ForegroundColor Red
    Write-Host "1. Go to: https://www.gyan.dev/ffmpeg/builds/" -ForegroundColor Yellow
    Write-Host "2. Download 'essentials' build" -ForegroundColor Yellow
    Write-Host "3. Extract ffmpeg.exe to: $ffmpegExePath" -ForegroundColor Yellow
}

Write-Host "`nPress any key to continue..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")