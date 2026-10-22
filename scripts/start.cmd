@echo off
cd /d "%~dp0.."
where node >nul 2>nul
if errorlevel 1 (
 echo Please install Node.js LTS from https://nodejs.org then run start.cmd again.
 pause
 exit /b 1
)
echo Open http://localhost:4173 in your browser.
call npm start
pause

