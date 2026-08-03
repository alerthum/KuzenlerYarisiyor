Write-Host "Zihin Arenasi V13.5 Question Factory dogrulama basliyor..." -ForegroundColor Cyan
node --version
npm run quality:premium-core
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
npm run quality:product-acceptance:strict
exit $LASTEXITCODE
