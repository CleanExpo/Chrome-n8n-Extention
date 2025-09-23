@echo off
echo ========================================
echo Setting up Native Host for n8n Assistant
echo ========================================
echo.

echo Installing Python dependencies...
pip install pyautogui pillow pytesseract opencv-python keyboard mouse speechrecognition pyttsx3 screeninfo psutil pywin32

echo.
echo Downloading Tesseract OCR...
echo Please install Tesseract from: https://github.com/tesseract-ocr/tesseract
echo Add it to your PATH after installation.

echo.
echo ========================================
echo IMPORTANT: Native Host Registration
echo ========================================
echo.
echo To register the native host with Chrome:
echo.
echo 1. Get your extension ID from chrome://extensions
echo 2. Update manifest.json with your extension ID
echo 3. Run: REG ADD "HKCU\Software\Google\Chrome\NativeMessagingHosts\com.n8n.assistant" /ve /t REG_SZ /d "%CD%\manifest.json" /f
echo.
echo ========================================
pause