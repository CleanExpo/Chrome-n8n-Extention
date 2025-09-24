@echo off
:: Quick script to trigger extension reload

echo Triggering extension update...

:: Update version file to trigger hot reload
echo {"timestamp": "%date% %time%", "version": "1.0.1"} > version.json

echo Update triggered! Extension should reload in 2 seconds...
echo.
echo If it doesn't reload automatically, manually reload at:
echo chrome://extensions/
echo.
timeout /t 3 >nul