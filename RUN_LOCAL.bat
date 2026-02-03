@echo off
title Aromatic POS - Local Server
echo ==========================================
echo    AROMATIC POS - INICIANDO LOCALMENTE
echo ==========================================
echo.
echo Intentando iniciar servidor local...
echo.

:: Verificar si Python esta instalado
python --version >nul 2>&1
if %errorlevel% == 0 (
    echo [OK] Python detectado. Iniciando servidor en http://localhost:8000
    start http://localhost:8000
    python -m http.server 8000
) else (
    echo [!] Python no detectado.
    echo Intentando abrir index.html directamente... (Algunas funciones podrian limitarse)
    start index.html
    echo.
    echo NOTA: Para una mejor experiencia, instala Python o usa la version PWA (Instalar desde el navegador).
    pause
)
