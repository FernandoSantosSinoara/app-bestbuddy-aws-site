@echo off
title Best Buddy - Parando Servicos Locais

echo =====================================================================
echo                BEST BUDDY - PARANDO SERVICOS LOCAIS
echo                    (Equivalente a docker compose down)
echo =====================================================================
echo.

echo [*] Procurando processos nas portas 8000 (Backend) e 5500 (Frontend)...
powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort 8000, 5500 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique | ForEach-Object { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue }"

echo.
echo [+] Todos os servicos foram finalizados com sucesso!
echo     Portas 8000 e 5500 estao livres.
echo.
ping 127.0.0.1 -n 3 >nul
