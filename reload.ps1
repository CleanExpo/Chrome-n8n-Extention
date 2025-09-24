# Simple Chrome Extension Reloader
param([switch]$Watch)

Write-Host "Chrome Extension Reloader" -ForegroundColor Cyan
Write-Host "=========================" -ForegroundColor Cyan

function Reload-Extension {
    Write-Host "Reloading extension..." -ForegroundColor Green

    # Open extensions page in Chrome
    Start-Process "chrome://extensions/"
    Start-Sleep -Seconds 2

    Write-Host "Extension page opened. Press Ctrl+R in Chrome to reload." -ForegroundColor Yellow
    Write-Host "Done!" -ForegroundColor Green
}

if ($Watch) {
    Write-Host "Watching for changes in: $PSScriptRoot" -ForegroundColor Cyan
    Write-Host "Press Ctrl+C to stop" -ForegroundColor Yellow

    $watcher = New-Object System.IO.FileSystemWatcher
    $watcher.Path = $PSScriptRoot
    $watcher.IncludeSubdirectories = $true
    $watcher.EnableRaisingEvents = $true

    $action = {
        $name = $Event.SourceEventArgs.Name
        $changeType = $Event.SourceEventArgs.ChangeType
        Write-Host "Changed: $name" -ForegroundColor Yellow

        # Update version file to trigger hot reload
        $version = @{
            timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
            version = "1.0.1"
        }
        $version | ConvertTo-Json | Set-Content "$PSScriptRoot\version.json"
        Write-Host "Version file updated - extension should reload in 2 seconds" -ForegroundColor Green
    }

    Register-ObjectEvent $watcher "Changed" -Action $action
    Register-ObjectEvent $watcher "Created" -Action $action

    while ($true) { Start-Sleep 1 }
} else {
    Reload-Extension
    Write-Host "Tip: Use -Watch to auto-reload on changes" -ForegroundColor Cyan
}