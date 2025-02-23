@echo off
echo Starting Banking Application...

:: Kill any existing node processes (in case servers are already running)
taskkill /F /IM node.exe > nul 2>&1

:: Start the backend server
start cmd /k "node server.js"

:: Wait for 3 seconds to let the server start
timeout /t 3 /nobreak > nul

:: Open Edge browser with the index page
start msedge "http://localhost:3000/index.html"

echo Application started! You can close this window.