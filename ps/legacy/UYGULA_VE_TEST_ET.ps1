$ErrorActionPreference = "Stop"
Write-Host "Zihin Arenası V6.0 + V6.5 kontrolü başlıyor..." -ForegroundColor Cyan
npm run check
Write-Host "Kontrol başarılı. npm run dev ile başlatabilirsiniz." -ForegroundColor Green
