@echo off
setlocal
cd /d "%~dp0"
title ProSpace Health - Portal do Cidadao

echo ================================================
echo       PROSPACE HEALTH - PORTAL DO CIDADAO
echo ================================================
echo.

where py >nul 2>nul
if %errorlevel%==0 goto use_py
where python >nul 2>nul
if %errorlevel%==0 goto use_python

echo Python 3 nao foi encontrado.
echo Instale em https://www.python.org/downloads/ e marque a opcao Add Python to PATH.
echo.
pause
exit /b 1

:use_py
echo Abrindo http://localhost:7358
echo Mantenha esta janela aberta enquanto usar o portal.
start "" "http://localhost:7358"
py -3 -m http.server 7358 --bind 127.0.0.1
set SERVER_EXIT=%errorlevel%
goto end

:use_python
echo Abrindo http://localhost:7358
echo Mantenha esta janela aberta enquanto usar o portal.
start "" "http://localhost:7358"
python -m http.server 7358 --bind 127.0.0.1
set SERVER_EXIT=%errorlevel%

:end
echo.
echo O servidor foi encerrado (codigo %SERVER_EXIT%).
pause
