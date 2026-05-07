@echo off
title FinTech HFT Portal - Starting...
color 0B

echo.
echo  ============================================
echo    FinTech HFT ^& Secure Banking Portal
echo  ============================================
echo.
echo  [*] Starting development server...
echo.

cd /d "c:\Users\PRASAD MAHAJAN\Desktop\Internship project\fintech-hft-portal"

:: Kill anything already on port 5173
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":5173"') do (
  taskkill /F /PID %%a >nul 2>&1
)

:: Start Vite server in background
start "" /B cmd /c "npm run dev > nul 2>&1"

:: Wait for server to be ready
echo  [*] Waiting for server to be ready...
timeout /t 4 /nobreak > nul

:: Open browser
echo  [*] Opening browser...
start "" "http://localhost:5173/"

echo.
echo  [OK] FinTech Portal is running at http://localhost:5173/
echo.
echo  Login Credentials:
echo  ------------------
echo  Admin  : admin@fintech.io  / admin123  / OTP: 482910
echo  Trader : trader@fintech.io / trader123 / OTP: 739201
echo  Viewer : viewer@fintech.io / viewer123 / OTP: 156734
echo.
echo  Press any key to STOP the server and close...
echo.
pause > nul

:: Stop server on close
echo  [*] Shutting down server...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":5173"') do (
  taskkill /F /PID %%a >nul 2>&1
)
echo  [OK] Server stopped. Goodbye!
timeout /t 2 /nobreak > nul
