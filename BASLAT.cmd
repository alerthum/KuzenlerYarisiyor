@echo off
setlocal EnableExtensions
chcp 65001 >nul
cd /d "%~dp0"
title Zihin Arenasi

echo.
echo ============================================================
echo   ZIHIN ARENASI - TEK KOMUTLA BASLATMA
echo ============================================================
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo HATA: Node.js bulunamadi.
  echo Node.js 22 surumunu kurup bu dosyayi yeniden calistirin.
  pause
  exit /b 1
)

for /f "tokens=*" %%v in ('node -v') do set NODE_VERSION=%%v
echo Node: %NODE_VERSION%

if not exist "node_modules\" (
  echo Bagimliliklar ilk kez kuruluyor...
  call npm install --include=dev --prefer-offline --no-audit --no-fund
  if errorlevel 1 (
    echo HATA: npm kurulumu tamamlanamadi.
    pause
    exit /b 1
  )
)

if not exist "KUZENLER_AYARLARI.env" (
  echo Bilgi: Yerel ayar dosyasi bulunamadi; uygulama guvenli yerel modda acilacak.
)

echo Uygulama hazirlaniyor...
call npm run prepare
if errorlevel 1 (
  echo HATA: Proje ayarlari hazirlanamadi.
  pause
  exit /b 1
)

start "" powershell.exe -NoProfile -WindowStyle Hidden -Command "Start-Sleep -Seconds 2; Start-Process 'http://localhost:6220'"
echo.
echo Tarayici aciliyor: http://localhost:6220
echo Kapatmak icin bu pencerede Ctrl+C kullanin.
echo.
node server.mjs --port 6220
set EXIT_CODE=%ERRORLEVEL%
if not "%EXIT_CODE%"=="0" (
  echo.
  echo HATA: Uygulama %EXIT_CODE% koduyla durdu.
  pause
)
exit /b %EXIT_CODE%
