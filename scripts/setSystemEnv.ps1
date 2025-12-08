# Run this PowerShell script AS YOUR USER to copy values from .env.backup into your Windows user environment variables
# Usage: Open PowerShell (not elevated is fine), cd to backend folder and run: .\scripts\setSystemEnv.ps1

$backupPath = Join-Path $PSScriptRoot '..\.env.backup'
if (-not (Test-Path $backupPath)) {
    Write-Error "Backup file not found: $backupPath"
    exit 1
}

# Read lines and parse simple KEY=VALUE pairs
Get-Content $backupPath | ForEach-Object {
    $line = $_.Trim()
    if ($line -and -not $line.StartsWith('#')) {
        $parts = $line -split '=', 2
        if ($parts.Length -eq 2) {
            $key = $parts[0].Trim()
            $value = $parts[1].Trim()
            if ($key -and $value) {
                Write-Host "Setting user env: $key"
                # setx persists to user environment — will take effect for new shells
                setx $key "$value" | Out-Null
            }
        }
    }
}

Write-Host "Environment variables set. Please restart your terminal and the backend server to pick them up."
Write-Host "If you want to remove the .env file, run: Remove-Item -Path .\.env -Force"
