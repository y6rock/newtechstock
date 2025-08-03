@echo off
rem ==== CONFIGURATION ====
rem Change these paths to match your environment
set "BACKEND_DIR=C:\Dev\monirbisharats\backend"
set "FRONTEND_DIR=C:\Dev\monirbisharats\frontend"
set "XAMPP_DIR=C:\xampp"
rem =======================

echo Starting Apache (XAMPP) …
start "Apache"  cmd /k "cd /d %XAMPP_DIR% && call apache_start.bat"

echo Starting MySQL (XAMPP) …
start "MySQL"   cmd /k "cd /d %XAMPP_DIR% && call mysql_start.bat"

echo Starting backend …
start "Backend" cmd /k "cd /d %BACKEND_DIR% && npm start"

echo Starting frontend …
start "Frontend" cmd /k "cd /d %FRONTEND_DIR% && npm start"

echo =====================================================
echo All services launched. Each has its own window for logs.
echo You can close this launcher window now if you like.
pause
