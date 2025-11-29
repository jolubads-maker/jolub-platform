$ErrorActionPreference = "Continue"
Write-Host "Iniciando despliegue..."

if (Test-Path deploy_build) { Remove-Item deploy_build -Recurse -Force -ErrorAction SilentlyContinue }
New-Item -ItemType Directory -Force -Path deploy_build | Out-Null

Write-Host "Copiando archivos..."
robocopy . deploy_build /XD .git node_modules dist deploy_temp deploy_final .vscode /E /NFL /NDL /NJH /NJS

Write-Host "Modificando package.json para eliminar postinstall..."
$pkgPath = "deploy_build\package.json"
if (Test-Path $pkgPath) {
    $pkg = Get-Content $pkgPath -Raw | ConvertFrom-Json
    if ($pkg.scripts.postinstall) {
        $pkg.scripts.PSObject.Properties.Remove('postinstall')
        $pkg | ConvertTo-Json -Depth 10 | Set-Content $pkgPath
        Write-Host "postinstall eliminado."
    }
}

Write-Host "Desplegando..."
Set-Location deploy_build
vercel --prod --force
Set-Location ..

Write-Host "Limpiando..."
Start-Sleep -Seconds 2
Remove-Item deploy_build -Recurse -Force -ErrorAction SilentlyContinue
Write-Host "✅ Despliegue completado."
