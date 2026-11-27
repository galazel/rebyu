# REBYU defense pre-flight check.
# Run this the moment you arrive at the venue, before the panel walks in.
#   powershell -ExecutionPolicy Bypass -File defense-preflight.ps1
#
# Every check prints PASS or FAIL. If anything says FAIL, fix it before
# the panel arrives -- the rubric gives 5.0 if the system does not run.

$ErrorActionPreference = 'Continue'
$fail = 0
$warn = 0

# Windows PowerShell auto-detects a proxy on every web call, which can add
# several seconds and make a healthy service look slow. Turn it off so the
# timings below measure the system and not PowerShell.
[Net.WebRequest]::DefaultWebProxy = $null
$ProgressPreference = 'SilentlyContinue'

function Test-Step {
    param([string]$Name, [scriptblock]$Check)
    Write-Host ("  {0,-44}" -f $Name) -NoNewline
    try {
        $result = & $Check
        if ($result -eq $true) { Write-Host "PASS" -ForegroundColor Green }
        elseif ($result -eq 'WARN') { Write-Host "WARN" -ForegroundColor Yellow; $script:warn++ }
        else { Write-Host "FAIL  $result" -ForegroundColor Red; $script:fail++ }
    } catch {
        Write-Host "FAIL  $($_.Exception.Message)" -ForegroundColor Red
        $script:fail++
    }
}

function Get-Http {
    param([string]$Url, [int]$TimeoutSec = 20)
    $sw = [Diagnostics.Stopwatch]::StartNew()
    $r = Invoke-WebRequest -Uri $Url -TimeoutSec $TimeoutSec -UseBasicParsing
    $sw.Stop()
    # Windows PowerShell 5.1 hands back a byte[] for some content types.
    $body = $r.Content
    if ($body -is [byte[]]) { $body = [Text.Encoding]::UTF8.GetString($body) }
    [pscustomobject]@{ Code = [int]$r.StatusCode; Ms = $sw.ElapsedMilliseconds; Body = [string]$body }
}

Write-Host ""
Write-Host "REBYU pre-flight  --  $(Get-Date -Format 'yyyy-MM-dd HH:mm')" -ForegroundColor Cyan
Write-Host ("=" * 60)

# ---------------------------------------------------------------- network
Write-Host ""
Write-Host "NETWORK  (the system cannot run without this)" -ForegroundColor Cyan

Test-Step "Internet reachable" {
    if (Test-Connection -ComputerName 1.1.1.1 -Count 2 -Quiet) { $true } else { "no route to the internet" }
}
Test-Step "DNS resolving" {
    try { [void][Net.Dns]::GetHostEntry('supabase.com'); $true } catch { "DNS is not resolving" }
}
Test-Step "Supabase reachable (your database)" {
    try { $r = Get-Http 'https://supabase.com' 15; if ($r.Code -lt 500) { $true } else { "HTTP $($r.Code)" } }
    catch { "cannot reach Supabase - the database will not work" }
}

# ---------------------------------------------------------------- docker
Write-Host ""
Write-Host "CONTAINERS" -ForegroundColor Cyan

$expected = @('backend', 'frontend', 'python-api', 'redis', 'rabbitmq')
$running = @()
try { $running = (docker compose ps --format '{{.Service}}' 2>$null) -split "`n" | Where-Object { $_ } } catch {}

foreach ($svc in $expected) {
    Test-Step "container: $svc" {
        if ($running -contains $svc) { $true } else { "not running - run: docker compose up -d" }
    }.GetNewClosure()
}

# ---------------------------------------------------------------- services
Write-Host ""
Write-Host "SERVICES RESPOND" -ForegroundColor Cyan

Test-Step "Frontend            http://localhost:3000" {
    $r = Get-Http 'http://localhost:3000/'
    if ($r.Code -eq 200) { $true } else { "HTTP $($r.Code)" }
}
Test-Step "Backend health      :8080/actuator/health" {
    $r = Get-Http 'http://localhost:8080/actuator/health'
    if ($r.Body -match '"status"\s*:\s*"UP"') { $true } else { "not UP: $($r.Body)" }
}
Test-Step "Backend readiness" {
    $r = Get-Http 'http://localhost:8080/actuator/health/readiness'
    if ($r.Code -eq 200) { $true } else { "HTTP $($r.Code)" }
}
Test-Step "AI service          :8000 health/live" {
    $r = Get-Http 'http://localhost:8000/api/v1/bkt/health/live'
    if ($r.Code -eq 200) { $true } else { "HTTP $($r.Code)" }
}
Test-Step "AI service database" {
    $r = Get-Http 'http://localhost:8000/api/v1/bkt/health/ready'
    if ($r.Body -match '"database"\s*:\s*"ok"') { $true } else { "database not ok: $($r.Body)" }
}

# ---------------------------------------------------------------- database
Write-Host ""
Write-Host "DATABASE  (a real query, not just a ping)" -ForegroundColor Cyan

Test-Step "Certifications load from Postgres" {
    $r = Get-Http 'http://localhost:8080/api/certifications' 40
    if ($r.Code -ne 200) { return "HTTP $($r.Code)" }
    if ($r.Body.Length -lt 3) { return "empty response - no data?" }
    $true
}
Test-Step "Query speed acceptable" {
    # Uncached reads normally land around 2-2.5s because the database is
    # Supabase over the internet. The first call after an idle period can
    # spike while the pooler opens a fresh connection -- so retry once
    # before calling it a failure.
    $r = Get-Http ("http://localhost:8080/api/certifications?_=" + (Get-Random)) 40
    if ($r.Ms -gt 4000) {
        Start-Sleep -Milliseconds 500
        $r = Get-Http ("http://localhost:8080/api/certifications?_=" + (Get-Random)) 40
    }
    if ($r.Ms -lt 4000) { $true }
    elseif ($r.Ms -lt 10000) { 'WARN' }
    else { "$($r.Ms) ms - check the venue connection" }
}

Test-Step "Warm reads are fast (cache working)" {
    [void](Get-Http 'http://localhost:8080/api/certifications' 40)
    $r = Get-Http 'http://localhost:8080/api/certifications' 40
    if ($r.Ms -lt 1200) { $true } else { "$($r.Ms) ms - Redis cache may not be working" }
}

# ---------------------------------------------------------------- summary
Write-Host ""
Write-Host ("=" * 60)
if ($fail -eq 0 -and $warn -eq 0) {
    Write-Host "ALL CHECKS PASSED - the system is ready to demo." -ForegroundColor Green
} elseif ($fail -eq 0) {
    Write-Host "PASSED with $warn warning(s). Safe to demo, but expect some slowness." -ForegroundColor Yellow
} else {
    Write-Host "$fail CHECK(S) FAILED - do not start the defense yet." -ForegroundColor Red
    Write-Host ""
    Write-Host "Most common fixes:" -ForegroundColor Yellow
    Write-Host "  containers down   ->  docker compose up -d"
    Write-Host "  backend unhealthy ->  docker compose logs --tail=50 backend"
    Write-Host "  database failing  ->  check internet; Supabase is in the cloud"
    Write-Host "  rebuilt frontend  ->  docker compose up -d --build --no-deps frontend"
}
Write-Host ""
Write-Host "Reminder: log in once yourself before the panel arrives." -ForegroundColor Cyan
Write-Host ""
exit $fail
