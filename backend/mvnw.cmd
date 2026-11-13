@REM ----------------------------------------------------------------------------
@REM Maven Startup Script for Windows
@REM ----------------------------------------------------------------------------

@echo off
setlocal

set DIRNAME=%~dp0
if "%DIRNAME%" == "" set DIRNAME=.
set APP_BASE_NAME=%~n0
set APP_HOME=%DIRNAME%

@REM Find maven or mvn executable
where mvn >nul 2>nul
if %ERRORLEVEL% equ 0 (
    mvn %*
    goto :end
)

echo [INFO] Apache Maven was not found in your PATH.
echo [INFO] Please install Maven or OpenJDK, or run using your IDE (IntelliJ IDEA / Eclipse / VS Code).
echo [INFO] You can run PotholeAI directly by opening the backend folder in IntelliJ IDEA and clicking Run!

:end
exit /b %ERRORLEVEL%
