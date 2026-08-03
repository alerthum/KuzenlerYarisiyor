param([string]$HedefKlasor = (Join-Path $PSScriptRoot 'Zihin_Arenasi_V10_Canli'))
$ErrorActionPreference='Stop'
$kaynak=$PSScriptRoot
$yedek="$HedefKlasor`_YEDEK_$(Get-Date -Format yyyyMMdd_HHmmss)"
if(Test-Path $HedefKlasor){ Copy-Item $HedefKlasor $yedek -Recurse -Force }
try {
  New-Item -ItemType Directory -Force -Path $HedefKlasor | Out-Null
  Get-ChildItem $kaynak -Force | Where-Object { $_.Name -notin @('node_modules','dist','quality-reports','.git') -and $_.Name -ne (Split-Path $HedefKlasor -Leaf) } | Copy-Item -Destination $HedefKlasor -Recurse -Force
  Push-Location $HedefKlasor
  npm ci
  npm run release:final
  Pop-Location
  Write-Host "V10 kurulumu ve tam kabul testi başarılı." -ForegroundColor Green
  if(Test-Path $yedek){ Write-Host "Yedek: $yedek" -ForegroundColor Yellow }
} catch {
  if((Test-Path $yedek)){
    if(Test-Path $HedefKlasor){ Remove-Item $HedefKlasor -Recurse -Force }
    Move-Item $yedek $HedefKlasor
  }
  throw
}
