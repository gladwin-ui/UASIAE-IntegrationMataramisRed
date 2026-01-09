@echo off
echo Starting DosWallet Microservices...
echo.

start "User Service" cmd /k "cd user-service && python app.py"
timeout /t 2 /nobreak >nul

start "Wallet Service" cmd /k "cd wallet-service && python app.py"
timeout /t 2 /nobreak >nul

start "Transaction Service" cmd /k "cd transaction-service && python app.py"
timeout /t 2 /nobreak >nul

start "Notification Service" cmd /k "cd notification-service && python app.py"
timeout /t 2 /nobreak >nul

echo.
echo All services started in separate windows!
echo Close each window to stop the respective service.
pause

