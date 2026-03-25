@echo off
title LAIKA CLUB - Servidores
color 0a

echo ========================================
echo   INICIANDO SISTEMA LAIKA CLUB
echo ========================================
echo.

:: 1. Iniciar Microservicios de Python
echo [*] Lanzando Microservicios...
start cmd /k "title Microservicios && echo Iniciando Microservicios... && cd /d %~dp0 && python run_microservices.py"

:: 2. Iniciar Frontend
echo [*] Lanzando Frontend (npm start)...
start cmd /k "title Frontend && echo Iniciando Frontend... && cd /d %~dp0 && npm start"

echo.
echo ========================================
echo [OK] Ventanas de servidores lanzadas.
echo Puedes cerrar esta ventana principal.
echo ========================================
