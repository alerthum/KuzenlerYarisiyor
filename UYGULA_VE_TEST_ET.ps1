$ErrorActionPreference = "Stop"

Write-Host "Kuzenler Yarışıyor V5.0.4 yama kontrolü başlıyor..." -ForegroundColor Cyan

$required = @(
  ".\package.json",
  ".\js\platform\firebase-platform.js",
  ".\tests\v5-platform-quality.test.mjs",
  ".\KUZENLER_AYARLARI.env"
)

foreach ($file in $required) {
  if (-not (Test-Path $file)) {
    throw "Ana proje klasöründe değilsiniz veya gerekli dosya eksik: $file"
  }
}

npm run check
if ($LASTEXITCODE -ne 0) { throw "Proje kontrolü başarısız." }

Write-Host "V5.0.4 yaması başarıyla doğrulandı." -ForegroundColor Green
Write-Host "Projeyi açmak için: npm run dev" -ForegroundColor Yellow
