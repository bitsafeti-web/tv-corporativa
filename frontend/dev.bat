@echo off
set NODE_ENV=development
echo Encerrando processos anteriores...
powershell -Command "Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force"
echo Iniciando TV Corporativa (frontend)...
echo Acesse: http://localhost:5173
echo.
npm run dev
pause
