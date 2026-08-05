$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $Root

Write-Host "Zihin Arenası Phase 5I kontrollü canlı beta dağıtımı" -ForegroundColor Cyan

if (-not (Test-Path ".\KUZENLER_AYARLARI.env")) {
    throw "KUZENLER_AYARLARI.env bulunamadı. Mevcut canlı ayar dosyanızı proje köküne koyun; örnek dosyadaki MEVCUT_AYAR_DOSYANIZI_KORUYUN alanlarıyla yayın yapılmaz."
}

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    throw "Node.js bulunamadı. Node.js 20 veya üzerini kurun."
}

if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    throw "npm bulunamadı."
}

Write-Host "1/6 Bağımlılıklar doğrulanıyor..." -ForegroundColor Yellow
npm ci
if ($LASTEXITCODE -ne 0) { throw "npm ci başarısız." }

Write-Host "2/6 Phase 5I hedef testleri çalışıyor..." -ForegroundColor Yellow
npm run test:phase5i
if ($LASTEXITCODE -ne 0) { throw "Phase 5I testleri başarısız; yayın durduruldu." }

Write-Host "3/6 Production build oluşturuluyor..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) { throw "Production build başarısız; yayın durduruldu." }

Write-Host "4/6 Güvenlik denetimi çalışıyor..." -ForegroundColor Yellow
npm run assessment:v2:phase5g:security
if ($LASTEXITCODE -ne 0) { throw "Güvenlik denetimi başarısız; yayın durduruldu." }

Write-Host "5/6 Firebase kuralları yayınlanıyor..." -ForegroundColor Yellow
npx --yes firebase-tools@latest deploy --project kuzenleryarisiyor --config firebase/firebase.json --only firestore:rules,firestore:indexes
if ($LASTEXITCODE -ne 0) { throw "Firebase rules/indexes dağıtımı başarısız." }

Write-Host "6/6 Vercel production yayını başlatılıyor..." -ForegroundColor Yellow
npx --yes vercel@latest --prod
if ($LASTEXITCODE -ne 0) { throw "Vercel dağıtımı başarısız." }

Write-Host "Phase 5I kontrollü canlı beta dağıtımı tamamlandı." -ForegroundColor Green
