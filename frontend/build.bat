@echo off
echo Gerando build de producao...
set NODE_ENV=development
npm run build
echo.
echo Build concluido! Pasta: frontend\build\
echo Suba o conteudo da pasta BUILD via FTP para a Skymail.
pause
