# Script para abrir puertos en el Firewall de Windows para JOLUB
# Debe ejecutarse como Administrador

Write-Host "🔥 Configurando Firewall para JOLUB..." -ForegroundColor Cyan

$ports = @(5173, 4000)

foreach ($port in $ports) {
    $ruleName = "JOLUB Dev Port $port"
    
    # Eliminar regla existente si la hay
    Remove-NetFirewallRule -DisplayName $ruleName -ErrorAction SilentlyContinue
    
    # Crear nueva regla de entrada
    New-NetFirewallRule -DisplayName $ruleName `
                        -Direction Inbound `
                        -LocalPort $port `
                        -Protocol TCP `
                        -Action Allow `
                        -Profile Any `
                        -Description "Permite acceso a JOLUB en el puerto $port"

    Write-Host "✅ Puerto $port abierto correctamente." -ForegroundColor Green
}

Write-Host "🚀 ¡Listo! Ahora intenta conectar desde tu móvil u otro PC." -ForegroundColor Yellow
Write-Host "Presiona Enter para salir..."
Read-Host
