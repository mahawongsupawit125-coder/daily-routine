@echo off
cd /d "%~dp0"
where git >nul 2>nul
if errorlevel 1 (
 echo Git is not installed or is not on PATH. Install Git for Windows first.
 pause
 exit /b 1
)
if not exist ".git" (
 echo This folder is not a Git checkout. Use the original local project folder or clone the repository.
 echo Downloaded ZIP files do not contain Git history.
 pause
 exit /b 1
)
echo Uploading committed changes to the daily-routine repository...
git push origin main
if errorlevel 1 (
 echo Upload did not finish. Check the message above and sign in to GitHub if requested.
 pause
 exit /b 1
)
echo Upload completed.
pause
