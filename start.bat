@echo off  
chcp 65001 > nul  
setlocal enabledelayedexpansion  
  
set "logFile=%~dp0kill_log.txt"  
set "yarnPIDFile=%~dp0yarn_pid.txt"  
  
echo Starting yarn...  
start "" /b cmd /c "yarn start" >nul 2>&1  
  
for /f "tokens=2" %%A in ('wmic process where "commandline like '%%yarn start%%'" get ProcessId') do (  
    echo %%A > "%yarnPIDFile%"  
)  
  
:loop  
for /f "tokens=1-2 delims=:" %%A in ("%time:~0,5%") do (  
    set "hour=%%A"  
    set "minute=%%B"  
    set "hour=!hour:~-2!"  
    set "minute=!minute:~-2!"  
)  
  
if "!hour!"=="23" if "!minute!"=="57" (  
    echo Executing PowerShell script...  
    powershell -ExecutionPolicy Bypass -Command "$searchPattern = '.*\\src\\index.js'; $processes = Get-WmiObject Win32_Process | Where-Object { $_.Name -eq 'node.exe' -and $_.CommandLine -like $searchPattern }; foreach ($process in $processes) { try { Write-Output 'Terminating process ID $($process.ProcessId) command line: $($process.CommandLine)'; Stop-Process -Id $process.ProcessId -Force; } catch { Write-Output 'Failed to terminate process ID $($process.ProcessId)'; } }" > "%logFile%" 2>&1  
    echo Done, output saved to %logFile%  
    timeout /t 60 /nobreak >nul  
)  
  
timeout /t 10 /nobreak >nul  
goto loop  
  
:handleCtrlC  
if exist "%yarnPIDFile%" (  
    for /f "delims=" %%I in ("%yarnPIDFile%") do (  
        echo Terminating yarn process %%I...  
        taskkill /PID %%I /F >nul 2>&1  
    )  
    del "%yarnPIDFile%"  
)  
exit /b
