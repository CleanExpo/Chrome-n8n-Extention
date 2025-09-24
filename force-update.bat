@echo off
echo ===============================================
echo    Chrome Extension Force Update Script
echo ===============================================
echo.

:: Kill Chrome processes
echo [1/5] Closing Chrome...
taskkill /F /IM chrome.exe 2>nul
timeout /t 2 >nul

:: Clear Chrome extension cache
echo [2/5] Clearing Chrome cache...
set "chromePath=%LOCALAPPDATA%\Google\Chrome\User Data\Default"

:: Delete extension storage
if exist "%chromePath%\Local Extension Settings" (
    echo Clearing extension storage...
    rd /s /q "%chromePath%\Local Extension Settings" 2>nul
)

:: Clear service worker cache
if exist "%chromePath%\Service Worker" (
    echo Clearing service worker cache...
    rd /s /q "%chromePath%\Service Worker\CacheStorage" 2>nul
    rd /s /q "%chromePath%\Service Worker\ScriptCache" 2>nul
)

:: Create version marker
echo [3/5] Updating version marker...
echo {"version": "1.0.1", "timestamp": "%date% %time%"} > version.json

:: Start Chrome with fresh profile
echo [4/5] Starting Chrome with extensions page...
start chrome.exe --new-window "chrome://extensions/"
timeout /t 3 >nul

:: Show instructions
echo [5/5] Manual steps required:
echo.
echo 1. Chrome should now be open on the extensions page
echo 2. Turn ON "Developer mode" (top right)
echo 3. Click "Load unpacked"
echo 4. Select folder: D:\Chrome Extention n8n
echo 5. The extension should now show the latest models!
echo.
echo ===============================================
echo    VERIFICATION:
echo ===============================================
echo After loading, open this test page:
echo file:///D:/Chrome%%20Extention%%20n8n/verify-extension.html
echo.
echo Click "Get Available Models" to see:
echo - GPT-4o, GPT-4o Mini, o1 Preview, o1 Mini
echo - Gemini 2.0 Flash, Gemini 1.5 Pro
echo - Claude 3.5 Sonnet, Claude 3.5 Haiku
echo.
pause