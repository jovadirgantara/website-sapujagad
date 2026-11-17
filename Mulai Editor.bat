@echo off
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js belum terpasang. Unduh di https://nodejs.org lalu jalankan file ini lagi.
  pause
  exit /b 1
)
start "" http://localhost:4173/editor/
node scripts\dev.js
pause
