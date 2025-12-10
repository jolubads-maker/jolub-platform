@echo off
title JOLUB Platform - Desarrollo Local
color 0A

echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║         JOLUB PLATFORM - ENTORNO DE DESARROLLO LOCAL         ║
echo ╠══════════════════════════════════════════════════════════════╣
echo ║  Este script inicia el servidor backend y frontend juntos    ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.

:: Verificar que Node.js esté instalado
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    color 0C
    echo [ERROR] Node.js no esta instalado.
    echo Por favor, instala Node.js desde: https://nodejs.org
    pause
    exit /b 1
)

:: Mostrar versiones
echo [INFO] Verificando entorno...
echo.
for /f "tokens=*" %%i in ('node -v') do echo   Node.js: %%i
for /f "tokens=*" %%i in ('npm -v') do echo   NPM:     %%i
echo.

:: Verificar que exista el archivo .env
if not exist ".env" (
    color 0E
    echo [ADVERTENCIA] No se encontro el archivo .env
    echo Copiando desde env.example...
    if exist "env.example" (
        copy "env.example" ".env" >nul
        echo [OK] Archivo .env creado. Por favor, configura tus variables de entorno.
    ) else (
        echo [ERROR] No existe env.example. Crea el archivo .env manualmente.
    )
    echo.
)

:: Verificar node_modules
if not exist "node_modules" (
    echo [INFO] Instalando dependencias...
    echo.
    call npm install
    if %ERRORLEVEL% neq 0 (
        color 0C
        echo [ERROR] Fallo la instalacion de dependencias.
        pause
        exit /b 1
    )
    echo.
)

:: Generar cliente de Prisma
echo [INFO] Generando cliente de Prisma...
call npx prisma generate
if %ERRORLEVEL% neq 0 (
    color 0E
    echo [ADVERTENCIA] Prisma generate fallo. Continuando...
)
echo.

:: Aplicar migraciones de base de datos
echo [INFO] Aplicando migraciones de base de datos...
call npx prisma db push
if %ERRORLEVEL% neq 0 (
    color 0E
    echo [ADVERTENCIA] Las migraciones fallaron. Verifica tu DATABASE_URL en .env
)
echo.

:: Iniciar servidores
echo ╔══════════════════════════════════════════════════════════════╗
echo ║                    INICIANDO SERVIDORES                      ║
echo ╠══════════════════════════════════════════════════════════════╣
echo ║  Frontend: http://localhost:5173                             ║
echo ║  Backend:  http://localhost:3001                             ║
echo ╠══════════════════════════════════════════════════════════════╣
echo ║  Presiona Ctrl+C para detener ambos servidores               ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.

:: Ejecutar frontend y backend en paralelo
call npm run dev:all

pause
