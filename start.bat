@echo off
chcp 65001 > nul
setlocal enabledelayedexpansion

REM 设置日志文件路径
set "logFile=%~dp0kill_log.txt"
REM 设置 yarn 进程的 ID 文件路径
set "yarnPIDFile=%~dp0yarn_pid.txt"

REM 启动 yarn
echo start yarn...
start "" /b cmd /c "yarn start" >nul 2>&1

REM 获取启动的 yarn 进程 ID 并保存到文件
for /f "tokens=2" %%A in ('wmic process where "commandline like '%%yarn start%%'" get ProcessId') do (
    echo %%A > "%yarnPIDFile%"
)

REM 无限循环
echo runing...

:loop
REM 获取当前时间的小时和分钟
set "currentTime=%time%"

REM 去掉前导空格
set "currentTime=%currentTime: =%"

REM 提取小时和分钟
for /f "tokens=1-2 delims=:" %%A in ("%currentTime:~0,5%") do (
    set "hour=%%A"
    set "minute=%%B"
)

REM 去掉小时和分钟的前导零
if "%hour:~0,1%"=="0" set "hour=%hour:~1%"
if "%minute:~0,1%"=="0" set "minute=%minute:~1%"

REM 如果当前时间是23点56分，执行 PowerShell 脚本
if "%hour%"=="23" if "%minute%"=="57" (
    echo 当前处理后的时间: %hour%:%minute%
    echo 正在执行 PowerShell 脚本...
    REM 执行嵌入的 PowerShell 脚本
     powershell -ExecutionPolicy Bypass -Command ^
    "$searchPattern = '*./src/index.js*';" ^
    "$processes = Get-WmiObject Win32_Process | Where-Object { $_.Name -eq 'node.exe' };" ^
    "foreach ($process in $processes) {" ^
    "    try {" ^
    "        $commandLine = $process.CommandLine;" ^
    "        if ($commandLine -like $searchPattern) {" ^
    "            Write-Output '正在终止进程 ID $($process.ProcessId) 命令行: ''$commandLine''';" ^
    "            Stop-Process -Id $process.ProcessId -Force;" ^
    "        }" ^
    "    } catch {" ^
    "        Write-Output '无法终止进程 ID $($process.ProcessId)';" ^
    "    }" ^
    "}" > "%logFile%" 2>&1
    
    echo 执行完成，输出已保存到 %logFile%
    REM 等待1分钟，确保在23点56分过后不会重复执行
    timeout /t 60 /nobreak >nul
)

REM 等待30秒后再次检查时间
timeout /t 10 /nobreak >nul

REM 返回循环开头
goto loop

REM 处理 Ctrl+C 中断
:handleCtrlC
REM 读取 yarn 进程 ID 并终止
if exist "%yarnPIDFile%" (
    for /f "delims=" %%I in ("%yarnPIDFile%") do (
        echo 终止 yarn 进程 %%I...
        taskkill /PID %%I /F >nul 2>&1
    )
    del "%yarnPIDFile%"
)
exit /b
