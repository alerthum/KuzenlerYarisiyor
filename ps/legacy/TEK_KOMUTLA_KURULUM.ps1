$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot
Write-Host "Zihin Arenası V8 Mega Release kurulumu başlıyor..." -ForegroundColor Cyan
if (-not (Get-Command node -ErrorAction SilentlyContinue)) { throw "Node.js bulunamadı. Node 20 veya üzerini kurun." }
$version = [version]((node -p "process.versions.node") -split '-')[0]
if ($version.Major -lt 20) { throw "Node.js 20 veya üzeri gerekli. Mevcut: $version" }
if (-not (Test-Path '.\KUZENLER_AYARLARI.env')) { throw "KUZENLER_AYARLARI.env bulunamadı. Mevcut ayar dosyanızı ana klasörde koruyun." }
if (-not (Test-Path '.\node_modules')) { npm install }
npm run check
Write-Host "`nV8 kabul testleri, proje kontrolü ve build başarıyla tamamlandı." -ForegroundColor Green
Write-Host "Yerel çalıştırma: npm run dev" -ForegroundColor Yellow
Write-Host "Canlı modda kurallar değiştiği için bir kez: npm run firebase:deploy" -ForegroundColor Yellow
