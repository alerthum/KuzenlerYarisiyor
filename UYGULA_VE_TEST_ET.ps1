$ErrorActionPreference = "Stop"
Write-Host "V5.3 yaması ana klasöre kopyalandıktan sonra kontrol başlıyor..." -ForegroundColor Cyan
npm run check
Write-Host "Firebase kuralları değişti. Şimdi npm run firebase:deploy çalıştırın." -ForegroundColor Yellow
Write-Host "Ardından npm run dev ile projeyi başlatın." -ForegroundColor Green
