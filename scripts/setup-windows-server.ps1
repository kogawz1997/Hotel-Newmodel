<#
.SYNOPSIS
  Hotel PMS — Windows Server production setup script.
  Run once on a fresh Windows Server 2019/2022 machine (as Administrator).

.PARAMETER AppPath
  Where to install the app. Default: C:\hotel-pms

.PARAMETER Domain
  Your domain name (e.g. hotel.example.com). Used for Caddy SSL.

.PARAMETER SkipNodeInstall
  Skip Node.js installation if already installed.

.PARAMETER SkipCaddyInstall
  Skip Caddy installation if already installed.

.EXAMPLE
  .\setup-windows-server.ps1 -Domain "pms.myhotel.com"
  .\setup-windows-server.ps1 -Domain "pms.myhotel.com" -AppPath "D:\hotel-pms"
#>
param(
  [string]$AppPath         = "C:\hotel-pms",
  [string]$Domain          = "",
  [switch]$SkipNodeInstall = $false,
  [switch]$SkipCaddyInstall = $false
)

$ErrorActionPreference = "Stop"
$ProgressPreference    = "SilentlyContinue"

# ─────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────
function Write-Step  { param($msg) Write-Host "`n▶ $msg" -ForegroundColor Cyan }
function Write-Ok    { param($msg) Write-Host "  ✅ $msg" -ForegroundColor Green }
function Write-Warn  { param($msg) Write-Host "  ⚠️  $msg" -ForegroundColor Yellow }
function Write-Fail  { param($msg) Write-Host "  ❌ $msg" -ForegroundColor Red; exit 1 }

function Require-Admin {
  $id = [System.Security.Principal.WindowsIdentity]::GetCurrent()
  $p  = New-Object System.Security.Principal.WindowsPrincipal($id)
  if (-not $p.IsInRole([System.Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-Fail "Run this script as Administrator (right-click → Run as administrator)."
  }
}

function Command-Exists { param($cmd) return !!(Get-Command $cmd -ErrorAction SilentlyContinue) }

# ─────────────────────────────────────────────
# 0. Pre-flight checks
# ─────────────────────────────────────────────
Write-Step "Pre-flight checks"
Require-Admin

$os = (Get-CimInstance Win32_OperatingSystem).Caption
Write-Ok "OS: $os"

if ($Domain -eq "") {
  Write-Warn "No -Domain specified. Caddy will serve on HTTP only (localhost)."
  Write-Warn "Re-run with -Domain your.domain.com to enable automatic HTTPS."
}

# ─────────────────────────────────────────────
# 1. Install Node.js 20 LTS
# ─────────────────────────────────────────────
Write-Step "Node.js 20 LTS"
if ($SkipNodeInstall -or (Command-Exists "node")) {
  $nodeVer = node --version 2>$null
  Write-Ok "Node.js already installed: $nodeVer"
} else {
  Write-Host "  Downloading Node.js 20 LTS installer..."
  $nodeUrl  = "https://nodejs.org/dist/v20.19.0/node-v20.19.0-x64.msi"
  $nodeMsi  = "$env:TEMP\node-v20.msi"
  Invoke-WebRequest $nodeUrl -OutFile $nodeMsi
  Start-Process msiexec.exe -ArgumentList "/i `"$nodeMsi`" /quiet /norestart" -Wait
  Remove-Item $nodeMsi -Force
  # Reload PATH
  $env:PATH = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" +
              [System.Environment]::GetEnvironmentVariable("Path", "User")
  Write-Ok "Node.js installed: $(node --version)"
}

# ─────────────────────────────────────────────
# 2. Install PM2 + windows-startup
# ─────────────────────────────────────────────
Write-Step "PM2 process manager"
if (-not (Command-Exists "pm2")) {
  npm install -g pm2 pm2-windows-startup --silent
  Write-Ok "PM2 installed"
} else {
  Write-Ok "PM2 already installed: $(pm2 --version)"
}

# ─────────────────────────────────────────────
# 3. Install Caddy (reverse proxy + auto SSL)
# ─────────────────────────────────────────────
Write-Step "Caddy web server"
$caddyDir = "C:\caddy"
$caddyExe = "$caddyDir\caddy.exe"

if ($SkipCaddyInstall -or (Test-Path $caddyExe)) {
  Write-Ok "Caddy already installed"
} else {
  Write-Host "  Downloading Caddy..."
  $caddyUrl = "https://github.com/caddyserver/caddy/releases/latest/download/caddy_windows_amd64.zip"
  $caddyZip = "$env:TEMP\caddy.zip"
  Invoke-WebRequest $caddyUrl -OutFile $caddyZip
  New-Item -ItemType Directory -Force -Path $caddyDir | Out-Null
  Expand-Archive $caddyZip -DestinationPath $caddyDir -Force
  Remove-Item $caddyZip -Force

  # Add Caddy to PATH
  $machinePath = [System.Environment]::GetEnvironmentVariable("Path", "Machine")
  if ($machinePath -notlike "*$caddyDir*") {
    [System.Environment]::SetEnvironmentVariable("Path", "$machinePath;$caddyDir", "Machine")
    $env:PATH = "$env:PATH;$caddyDir"
  }
  Write-Ok "Caddy installed"
}

# ─────────────────────────────────────────────
# 4. App directory setup
# ─────────────────────────────────────────────
Write-Step "App directory: $AppPath"
if (-not (Test-Path $AppPath)) {
  New-Item -ItemType Directory -Force -Path $AppPath | Out-Null
  Write-Ok "Created $AppPath"
} else {
  Write-Ok "$AppPath already exists"
}

# Backup directory
$BackupPath = "C:\Backups\hotel-pms"
New-Item -ItemType Directory -Force -Path $BackupPath | Out-Null
Write-Ok "Backup directory: $BackupPath"

# Logs directory
$LogPath = "$AppPath\logs"
New-Item -ItemType Directory -Force -Path $LogPath | Out-Null
Write-Ok "Logs directory: $LogPath"

# ─────────────────────────────────────────────
# 5. Windows Firewall rules
# ─────────────────────────────────────────────
Write-Step "Windows Firewall"

$rules = @(
  @{ Name="Hotel-PMS HTTP";   Port=80;   Action="Allow" },
  @{ Name="Hotel-PMS HTTPS";  Port=443;  Action="Allow" },
  @{ Name="Hotel-PMS Block 3000"; Port=3000; Action="Block" }
)

foreach ($rule in $rules) {
  $existing = Get-NetFirewallRule -DisplayName $rule.Name -ErrorAction SilentlyContinue
  if ($existing) {
    Write-Ok "$($rule.Name) — already exists"
  } else {
    New-NetFirewallRule `
      -DisplayName $rule.Name `
      -Direction Inbound `
      -Protocol TCP `
      -LocalPort $rule.Port `
      -Action $rule.Action | Out-Null
    Write-Ok "$($rule.Name) (port $($rule.Port)) → $($rule.Action)"
  }
}

# ─────────────────────────────────────────────
# 6. Windows Defender exclusions
# ─────────────────────────────────────────────
Write-Step "Windows Defender exclusions (prevent node_modules slowdown)"
$exclusions = @(
  "$AppPath\node_modules",
  "$AppPath\.next",
  "$AppPath\logs"
)
foreach ($path in $exclusions) {
  Add-MpPreference -ExclusionPath $path -ErrorAction SilentlyContinue
  Write-Ok "Excluded: $path"
}

# ─────────────────────────────────────────────
# 7. Generate Caddyfile
# ─────────────────────────────────────────────
Write-Step "Caddyfile"
$caddyfile = "$caddyDir\Caddyfile"

if ($Domain -ne "") {
  $caddyContent = @"
$Domain {
    reverse_proxy localhost:3000

    # Security headers
    header {
        Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"
        X-Frame-Options "SAMEORIGIN"
        X-Content-Type-Options "nosniff"
        Referrer-Policy "strict-origin-when-cross-origin"
        -Server
    }

    # Compress responses
    encode gzip

    # Logs
    log {
        output file $LogPath\caddy-access.log {
            roll_size 50mb
            roll_keep 7
        }
    }
}
"@
} else {
  $caddyContent = @"
:80 {
    reverse_proxy localhost:3000
    encode gzip
    log {
        output file $LogPath\caddy-access.log
    }
}
"@
}

Set-Content -Path $caddyfile -Value $caddyContent -Encoding UTF8
Write-Ok "Caddyfile written to $caddyfile"

# ─────────────────────────────────────────────
# 8. PM2 ecosystem file
# ─────────────────────────────────────────────
Write-Step "PM2 ecosystem config"
$ecosystem = @"
module.exports = {
  apps: [{
    name: 'hotel-pms',
    script: 'node_modules/.bin/next',
    args: 'start',
    cwd: '$($AppPath.Replace('\','\\'))',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
    },
    error_file: '$($LogPath.Replace('\','\\'))\\pm2-error.log',
    out_file:   '$($LogPath.Replace('\','\\'))\\pm2-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    merge_logs: true,
  }]
};
"@

Set-Content -Path "$AppPath\ecosystem.config.js" -Value $ecosystem -Encoding UTF8
Write-Ok "ecosystem.config.js written"

# ─────────────────────────────────────────────
# 9. Backup scheduled task
# ─────────────────────────────────────────────
Write-Step "Backup scheduled task (daily 02:00)"

$backupScript = @"
`$date = Get-Date -Format "yyyy-MM-dd"
`$dest = "$BackupPath\`$date"
New-Item -ItemType Directory -Force -Path `$dest | Out-Null

# Backup env and logs
if (Test-Path "$AppPath\.env.production") {
  Copy-Item "$AppPath\.env.production" `$dest
}
if (Test-Path "$LogPath") {
  Copy-Item "$LogPath\*" `$dest -Recurse -ErrorAction SilentlyContinue
}

# Keep only last 30 days of backups
Get-ChildItem "$BackupPath" -Directory |
  Where-Object { `$_.CreationTime -lt (Get-Date).AddDays(-30) } |
  Remove-Item -Recurse -Force

Write-Host "Backup completed: `$dest"
"@

$backupScriptPath = "C:\hotel-pms-backup.ps1"
Set-Content -Path $backupScriptPath -Value $backupScript -Encoding UTF8

$taskName = "HotelPMSBackup"
$existing = Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue
if ($existing) {
  Unregister-ScheduledTask -TaskName $taskName -Confirm:$false
}

$action  = New-ScheduledTaskAction -Execute "powershell.exe" `
             -Argument "-NonInteractive -File `"$backupScriptPath`""
$trigger = New-ScheduledTaskTrigger -Daily -At "02:00"
$settings = New-ScheduledTaskSettingsSet -ExecutionTimeLimit (New-TimeSpan -Minutes 30)
Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger `
  -Settings $settings -RunLevel Highest -Force | Out-Null
Write-Ok "Scheduled task '$taskName' registered (daily 02:00)"

# ─────────────────────────────────────────────
# 10. Caddy as Windows Service
# ─────────────────────────────────────────────
Write-Step "Caddy Windows Service"
$svcName = "CaddyServer"
$existing = Get-Service -Name $svcName -ErrorAction SilentlyContinue
if ($existing) {
  Write-Ok "Caddy service already registered"
} else {
  & "$caddyExe" service-install --config "$caddyfile" 2>$null
  if ($LASTEXITCODE -eq 0) {
    Start-Service $svcName
    Write-Ok "Caddy service installed and started"
  } else {
    Write-Warn "Caddy service install skipped (run manually: caddy run --config $caddyfile)"
  }
}

# ─────────────────────────────────────────────
# 11. .env.production template (if not exists)
# ─────────────────────────────────────────────
Write-Step ".env.production"
$envDest = "$AppPath\.env.production"
$envSrc  = "$PSScriptRoot\..\env.production.example"

if (Test-Path $envDest) {
  Write-Ok ".env.production already exists — not overwriting"
} elseif (Test-Path $envSrc) {
  Copy-Item $envSrc $envDest
  Write-Warn ".env.production copied from example — FILL IN your secrets before starting the app!"
} else {
  Write-Warn ".env.production not found at $envDest"
  Write-Warn "Create it before running: pm2 start ecosystem.config.js"
}

# ─────────────────────────────────────────────
# 12. Final summary
# ─────────────────────────────────────────────
Write-Host ""
Write-Host "════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  Hotel PMS — Windows Server Setup Complete " -ForegroundColor Cyan
Write-Host "════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Next steps:" -ForegroundColor White
Write-Host ""
Write-Host "  1. Copy your app files to: $AppPath" -ForegroundColor Yellow
Write-Host "     git clone https://github.com/kogawz1997/Hotel-Newmodel.git $AppPath" -ForegroundColor Gray
Write-Host ""
Write-Host "  2. Fill in secrets:" -ForegroundColor Yellow
Write-Host "     notepad $AppPath\.env.production" -ForegroundColor Gray
Write-Host ""
Write-Host "  3. Build and start:" -ForegroundColor Yellow
Write-Host "     cd $AppPath" -ForegroundColor Gray
Write-Host "     npm install --legacy-peer-deps" -ForegroundColor Gray
Write-Host "     npm run build" -ForegroundColor Gray
Write-Host "     pm2 start ecosystem.config.js" -ForegroundColor Gray
Write-Host "     pm2 save" -ForegroundColor Gray
Write-Host "     pm2-startup install" -ForegroundColor Gray
Write-Host ""
Write-Host "  4. Start Caddy (if not auto-started):" -ForegroundColor Yellow
Write-Host "     caddy run --config $caddyfile" -ForegroundColor Gray
Write-Host ""
if ($Domain -ne "") {
  Write-Host "  5. Access your app:" -ForegroundColor Yellow
  Write-Host "     https://$Domain" -ForegroundColor Green
} else {
  Write-Host "  5. Access your app:" -ForegroundColor Yellow
  Write-Host "     http://localhost (or server IP)" -ForegroundColor Green
  Write-Host "     Run with -Domain your.domain.com for HTTPS" -ForegroundColor Gray
}
Write-Host ""
Write-Host "  Useful commands:" -ForegroundColor White
Write-Host "     pm2 logs hotel-pms       # ดู logs" -ForegroundColor Gray
Write-Host "     pm2 monit                # monitor realtime" -ForegroundColor Gray
Write-Host "     pm2 restart hotel-pms    # restart app" -ForegroundColor Gray
Write-Host "     pm2 stop hotel-pms       # stop app" -ForegroundColor Gray
Write-Host ""
Write-Host "  Logs: $LogPath" -ForegroundColor Gray
Write-Host "  Backups: $BackupPath (daily 02:00, keep 30 days)" -ForegroundColor Gray
Write-Host ""
