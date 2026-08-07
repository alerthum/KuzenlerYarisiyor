$ErrorActionPreference = "Stop"
Write-Host "Zihin Arenası V13 kalite araçları kuruluyor..." -ForegroundColor Cyan
$major = [int]((node --version).TrimStart('v').Split('.')[0])
if ($major -lt 22) { throw "Node.js 22.22 veya üstü gerekli." }
if (Test-Path "package-lock.json") { Remove-Item "package-lock.json" -Force }
npm install
npx playwright install chromium
npm run check
npm run test:property
npm run test:e2e:smoke
Write-Host "Temel kalite hattı hazır." -ForegroundColor Green
Write-Host "Ağır kontroller: npm run test:mutation / npm run test:firebase:rules / npm run ai:eval"
