# PowerShell Script to Automatically Reload Chrome Extension
# Run this script to automatically reload your extension in Chrome

param(
    [string]$ExtensionPath = "D:\Chrome Extention n8n",
    [switch]$Watch = $false
)

Write-Host "🚀 Chrome Extension Auto-Reloader" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan

# Check if Chrome is running
$chrome = Get-Process chrome -ErrorAction SilentlyContinue

if (-not $chrome) {
    Write-Host "❌ Chrome is not running. Starting Chrome..." -ForegroundColor Yellow
    Start-Process "chrome.exe"
    Start-Sleep -Seconds 3
}

# Function to reload extension
function Reload-Extension {
    Write-Host "`n🔄 Reloading extension..." -ForegroundColor Green

    # Open extensions page
    Start-Process "chrome://extensions/"
    Start-Sleep -Seconds 1

    # Send keyboard shortcuts to reload
    Add-Type -TypeDefinition @"
        using System;
        using System.Runtime.InteropServices;
        using System.Windows.Forms;

        public class KeyboardSender {
            [DllImport("user32.dll")]
            public static extern bool SetForegroundWindow(IntPtr hWnd);

            public static void SendReloadKeys() {
                // Focus Chrome window
                var chromeProcess = System.Diagnostics.Process.GetProcessesByName("chrome")[0];
                SetForegroundWindow(chromeProcess.MainWindowHandle);
                System.Threading.Thread.Sleep(500);

                // Send Ctrl+R to reload
                SendKeys.SendWait("^r");
            }
        }
"@ -ReferencedAssemblies System.Windows.Forms

    [KeyboardSender]::SendReloadKeys()
    Write-Host "✅ Extension reloaded!" -ForegroundColor Green
}

# Function to watch for file changes
function Watch-Files {
    Write-Host "`n👁️ Watching for file changes..." -ForegroundColor Cyan
    Write-Host "Press Ctrl+C to stop watching" -ForegroundColor Yellow

    $watcher = New-Object System.IO.FileSystemWatcher
    $watcher.Path = $ExtensionPath
    $watcher.Filter = "*.*"
    $watcher.IncludeSubdirectories = $true
    $watcher.EnableRaisingEvents = $true

    $action = {
        $path = $Event.SourceEventArgs.FullPath
        $changeType = $Event.SourceEventArgs.ChangeType

        # Filter for relevant files
        if ($path -match "\.(js|html|css|json)$") {
            Write-Host "`n📝 Change detected: $path" -ForegroundColor Yellow
            Reload-Extension
        }
    }

    Register-ObjectEvent -InputObject $watcher -EventName "Changed" -Action $action
    Register-ObjectEvent -InputObject $watcher -EventName "Created" -Action $action
    Register-ObjectEvent -InputObject $watcher -EventName "Deleted" -Action $action

    # Keep the script running
    while ($true) {
        Start-Sleep -Seconds 1
    }
}

# Main execution
if ($Watch) {
    Watch-Files
} else {
    Reload-Extension

    Write-Host "`n💡 Tip: Run with -Watch parameter to automatically reload on file changes:" -ForegroundColor Cyan
    Write-Host "   .\reload-extension.ps1 -Watch" -ForegroundColor White
}

Write-Host "`n✨ Done!" -ForegroundColor Green