@echo off
echo =====================================================================
echo  Starting PotholeAI - Java Spring Boot Backend Server
echo =====================================================================

cd /d "%~dp0"

echo [1/2] Checking Maven and Java environment...
where mvn >nul 2>nul
if %ERRORLEVEL% equ 0 (
    echo [2/2] Launching Spring Boot with Maven...
    mvn spring-boot:run
) else (
    echo [WARNING] Maven executable 'mvn' not detected in system PATH.
    echo Attempting Maven wrapper...
    call mvnw.cmd spring-boot:run
)

pause
