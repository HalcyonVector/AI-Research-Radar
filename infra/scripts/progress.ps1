<#
  progress.ps1  -  one-shot backfill progress for AI Research Radar.
  Run anytime:
      cd "D:\Projects\AI Research Radar\infra\docker"
      powershell -ExecutionPolicy Bypass -File ..\scripts\progress.ps1

  Prints a progress bar + rolling ETA for model/repo/paper AI summaries, and
  writes backfill-status.json to the project root (read by the scheduled ping).
#>

$ErrorActionPreference = "Stop"
$ComposeDir = "D:\Projects\AI Research Radar\infra\docker"
$ProjectRoot = "D:\Projects\AI Research Radar"
$StatusFile  = Join-Path $ProjectRoot "backfill-status.json"

$sql = @"
select
 (select count(*) filter (where ai_summary is not null) from models),
 (select count(*) from models),
 (select count(*) filter (where ai_summary is not null) from repositories),
 (select count(*) from repositories),
 (select count(*) filter (where ai_summary is not null) from papers),
 (select count(*) from papers);
"@ -replace "`r`n", " "

Push-Location $ComposeDir
try {
    $raw = docker compose exec -T postgres psql -U radar -d radar_dev -tA -F ',' -c $sql
} finally {
    Pop-Location
}

$line = ($raw | Where-Object { $_ -match '^\d' } | Select-Object -First 1).Trim()
if (-not $line) { Write-Error "Could not read counts. Is Docker up? ($raw)"; exit 1 }
$n = $line.Split(',')
$mDone=[int]$n[0]; $mTot=[int]$n[1]; $rDone=[int]$n[2]; $rTot=[int]$n[3]; $pDone=[int]$n[4]; $pTot=[int]$n[5]

$done = $mDone + $rDone + $pDone
$tot  = $mTot  + $rTot  + $pTot
$pct  = if ($tot) { [math]::Round(100.0 * $done / $tot, 1) } else { 0 }
$now  = Get-Date

# --- rolling ETA from the previous snapshot ---
$eta = "-"; $rate = 0.0
if (Test-Path $StatusFile) {
    try {
        $prev = Get-Content $StatusFile -Raw | ConvertFrom-Json
        $dt = ($now - [datetime]$prev.ts).TotalHours
        $dDone = $done - [int]$prev.done
        if ($dt -gt 0 -and $dDone -gt 0) {
            $rate = [math]::Round($dDone / $dt, 1)          # items/hour
            $remain = $tot - $done
            $hrs = $remain / ($dDone / $dt)
            if ($hrs -lt 1) { $eta = "{0} min" -f [math]::Round($hrs*60) }
            else            { $eta = "{0} hr"  -f [math]::Round($hrs,1) }
        }
    } catch {}
}

function Bar($d,$t){ $w=28; $f=if($t){[int]($w*$d/$t)}else{0}; "[" + ("#"*$f) + ("-"*($w-$f)) + "]" }

Write-Host ""
Write-Host "AI Research Radar - backfill progress  ($($now.ToString('yyyy-MM-dd HH:mm')))" -ForegroundColor Cyan
Write-Host ("  Models  {0}  {1,5}/{2,-5} {3,5}%" -f (Bar $mDone $mTot), $mDone, $mTot, ([math]::Round(100.0*$mDone/[math]::Max($mTot,1),1)))
Write-Host ("  Repos   {0}  {1,5}/{2,-5} {3,5}%" -f (Bar $rDone $rTot), $rDone, $rTot, ([math]::Round(100.0*$rDone/[math]::Max($rTot,1),1)))
Write-Host ("  Papers  {0}  {1,5}/{2,-5} {3,5}%" -f (Bar $pDone $pTot), $pDone, $pTot, ([math]::Round(100.0*$pDone/[math]::Max($pTot,1),1)))
Write-Host ("  -------------------------------------------------")
Write-Host ("  TOTAL   {0}  {1,5}/{2,-5} {3,5}%" -f (Bar $done $tot), $done, $tot, $pct) -ForegroundColor Green
if ($rate -gt 0) { Write-Host ("  Rate ~{0}/hr   ETA ~{1} (since last check)" -f $rate, $eta) -ForegroundColor DarkGray }
Write-Host ""

# --- write status for the scheduled ping ---
$status = [ordered]@{
    ts=$now.ToString("o"); done=$done; total=$tot; percent=$pct;
    models=@{done=$mDone; total=$mTot}; repos=@{done=$rDone; total=$rTot}; papers=@{done=$pDone; total=$pTot};
    rate_per_hour=$rate; eta=$eta; complete=($done -ge $tot -and $tot -gt 0)
}
$status | ConvertTo-Json -Depth 5 | Set-Content $StatusFile -Encoding UTF8
