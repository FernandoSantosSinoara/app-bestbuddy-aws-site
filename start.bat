@echo off
setlocal enabledelayedexpansion
title Best Buddy - Orquestrador de Servicos (Modo Sem Docker)

echo =====================================================================
echo           BEST BUDDY - INICIALIZADOR DE SERVICOS LOCAIS
echo                    (Alternativa ao Docker Compose)
echo =====================================================================
echo.

:: 1. LOCALIZAR O EXECUTAVEL DO PYTHON
set "PYTHON_CMD=python"
%PYTHON_CMD% --version >nul 2>&1
if errorlevel 1 goto check_local_python
goto python_ok

:check_local_python
if exist "%LOCALAPPDATA%\Programs\Python\Python312\python.exe" (
    set "PYTHON_CMD=%LOCALAPPDATA%\Programs\Python\Python312\python.exe"
    set "PATH=%LOCALAPPDATA%\Programs\Python\Python312;%LOCALAPPDATA%\Programs\Python\Python312\Scripts;!PATH!"
    goto python_ok
)
echo [ERRO] Python nao foi encontrado no PATH do sistema.
echo        Instale o Python 3.12 executando no PowerShell:
echo        winget install --id Python.Python.3.12 --scope user
echo.
pause
exit /b 1

:python_ok
for /f "tokens=*" %%v in ('%PYTHON_CMD% --version 2^>^&1') do set "PY_VER=%%v"
echo [+] %PY_VER% localizado com sucesso.

:: 2. VERIFICAR/CRIAR AMBIENTE VIRTUAL (VENV)
if exist "%~dp0venv\Scripts\activate.bat" goto venv_exists
echo [*] [1/5] Criando ambiente virtual isolado [venv]...
"%PYTHON_CMD%" -m venv "%~dp0venv"
if errorlevel 1 (
    echo [ERRO] Falha ao criar o ambiente virtual venv.
    pause
    exit /b 1
)
echo [+] Ambiente virtual venv criado com sucesso!
goto venv_ready

:venv_exists
echo [+] [1/5] Ambiente virtual venv detectado.

:venv_ready
call "%~dp0venv\Scripts\activate.bat"

:: 3. VERIFICAR/INSTALAR DEPENDENCIAS (PIP)
python -c "import django, onnxruntime" >nul 2>&1
if not errorlevel 1 goto deps_ready
echo [*] [2/5] Instalando dependencias do requirements.txt...
pip install -r "%~dp0requirements.txt"
if errorlevel 1 (
    echo [ERRO] Falha ao instalar dependencias do requirements.txt.
    pause
    exit /b 1
)
echo [+] Dependencias instaladas com sucesso!
goto deps_done

:deps_ready
echo [+] [2/5] Dependencias Django, DRF e ONNX Runtime prontas.

:deps_done

:: 4. VERIFICAR SERVICO DO BANCO DE DADOS (MYSQL / SQLITE)
echo [*] [3/5] Verificando servico do banco de dados...
sc query MySQL80 >nul 2>&1
if errorlevel 1 (
    echo [*] Servico MySQL80 nao encontrado. Usando SQLite local.
    goto db_check_done
)

sc query MySQL80 | findstr /I "RUNNING" >nul 2>&1
if not errorlevel 1 (
    echo [+] Servico MySQL80 esta ATIVO e em execucao.
    goto db_check_done
)

echo [*] Servico MySQL80 esta instalado mas parado. Tentando iniciar...
net start MySQL80 >nul 2>&1
sc query MySQL80 | findstr /I "RUNNING" >nul 2>&1
if not errorlevel 1 (
    echo [+] Servico MySQL80 iniciado com sucesso.
) else (
    echo [!] Servico MySQL80 nao pode ser iniciado automaticamente.
    echo     Usando configuracao do .env.
)

:db_check_done

:: 5. MIGRAR O BANCO DE DADOS
echo [*] [4/5] Verificando e aplicando migracoes do Django...
python manage.py makemigrations --noinput
python manage.py migrate --noinput
if errorlevel 1 (
    echo [ERRO] Falha ao executar as migracoes do banco.
    pause
    exit /b 1
)
echo [+] Migracoes aplicadas com sucesso.

:: 6. SEED DE DADOS (SE NECESSARIO)
if not exist "%~dp0seed_data.py" goto seed_done
python -c "import django, os; os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings'); django.setup(); from usuarios.models import Usuario; exit(0 if Usuario.objects.exists() else 1)" >nul 2>&1
if not errorlevel 1 (
    echo [+] Banco ja contem dados cadastrados.
    goto seed_done
)

echo [*] Banco inicial detectado. Populando dados de teste via seed_data.py...
python seed_data.py

:seed_done

:: 7. LIBERAR PORTAS ANTERIORES SE ESTIVEREM OCUPADAS
powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort 8000, 5500 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique | ForEach-Object { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue }" >nul 2>&1

:: 8. SUBIR OS SERVICOS EM JANELAS INDEPENDENTES
echo [*] [5/5] Inicializando os servicos...

:: Backend API na porta 8000
start "Best Buddy - Backend API (Porta 8000)" cmd /k "title Best Buddy - Backend API (Porta 8000) && cd /d %~dp0 && call venv\Scripts\activate.bat && python manage.py runserver 127.0.0.1:8000"

:: Frontend na porta 5500 (com No-Cache headers ativados)
start "Best Buddy - Frontend (Porta 5500)" cmd /k "title Best Buddy - Frontend (Porta 5500) && cd /d %~dp0\frontend && call ..\venv\Scripts\activate.bat && python server.py 5500"

:: 9. ABRIR O NAVEGADOR
ping 127.0.0.1 -n 4 >nul
start http://localhost:5500

cls
echo =====================================================================
echo         BEST BUDDY - SERVICOS EM EXECUCAO COM SUCESSO!
echo =====================================================================
echo.
echo   [+] Frontend (App Web):      http://localhost:5500/
echo   [+] Backend API (Django):    http://127.0.0.1:8000/api/
echo   [+] Painel Administrativo:   http://127.0.0.1:8000/admin/
echo.
echo   Credenciais padrao:
echo   - Email: usuario@bestbuddy.com
echo   - Senha: 123456
echo.
echo ---------------------------------------------------------------------
echo   * Cada servico esta rodando em sua propria janela do prompt.
echo   * Para parar todos os servicos e liberar as portas, execute:
echo        stop.bat
echo =====================================================================
echo.
pause
