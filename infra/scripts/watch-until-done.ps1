<#
  watch-until-done.ps1  -  background watcher for the AI Research Radar backfill.
  Start it once, leave it running:
      cd "D:\Projects\AI Research Radar\infra\scripts"
      powershell -ExecutionPolicy Bypass -File .\watch-until-done.ps1

  Every few minutes it refreshes backfill-status.json and prints a one-line
  progress update. When model + repo + paper summaries all hit 100%, it beeps,
  pops a Windows message box, and writes BACKFILL-DONE.txt to the project root,
  then exits.

  Optional:  -IntervalMinutes 10   (default 5)
#>
param([int]$IntervalMinutes = 5)

$ErrorActionPreference = "Continue"
$ComposeDir  = "D:\Projects\AI Research Radar\infra\docker"
$ProjectRoot = "D:\Projects\AI Research Radar"
$StatusFile  = Join-Path $ProjectRoot "backfill-status.json"
$DoneFlag    = Join-Path $ProjectRoot "BACKFILL-DONE.txt"

$sql = @"
select
 (select count(*) filter (where ai_summary is not null and (downloads_total >= 100 or likes >= 3)) from models),
 (select count(*) filter (where downloads_total >= 100 or likes >= 3) from models),
 (select count(*) filter (where ai_summary is not null) from repositories),
 (select count(*) from repositories),
 (select count(*) filter (where ai_summary is not null) from papers),
 (select count(*) from papers);
"@ -replace "`r`n", " "

Write-Host "Watching backfill every $IntervalMinutes min. Ctrl+C to stop (does NOT stop the worker)." -ForegroundColor Cyan
$prevDone = $null; $prevTs = $null

while ($true) {
    try {
        Push-Location $ComposeDir
        $raw = docker compose exec -T postgres psql -U radar -d radar_dev -tA -F ',' -c $sql
        Pop-Location
        $line = ($raw | Where-Object { $_ -match '^\d' } | Select-Object -First 1).Trim()
        $n = $line.Split(',')
        $mDone=[int]$n[0]; $mTot=[int]$n[1]; $rDone=[int]$n[2]; $rTot=[int]$n[3]; $pDone=[int]$n[4]; $pTot=[int]$n[5]
        $done=$mDone+$rDone+$pDone; $tot=$mTot+$rTot+$pTot
        $pct = if ($tot) { [math]::Round(100.0*$done/$tot,1) } else { 0 }
        $now = Get-Date

        $rate=0.0; $eta="-"
        if ($prevDone -ne $null) {
            $dt = ($now-$prevTs).TotalHours; $dd = $done-$prevDone
            if ($dt -gt 0 -and $dd -gt 0) { $rate=[math]::Round($dd/$dt,1); $eta="{0} hr" -f [math]::Round(($tot-$done)/($dd/$dt),1) }
        }
        $prevDone=$done; $prevTs=$now

        Write-Host ("[{0}] {1,5}/{2} ({3}%)  models {4}/{5}  repos {6}/{7}  papers {8}/{9}  ~{10}/hr  ETA {11}" -f `
            $now.ToString('HH:mm'),$done,$tot,$pct,$mDone,$mTot,$rDone,$rTot,$pDone,$pTot,$rate,$eta)

        $complete = ($done -ge $tot -and $tot -gt 0)
        $status = [ordered]@{ ts=$now.ToString("o"); done=$done; total=$tot; percent=$pct;
            models=@{done=$mDone;total=$mTot}; repos=@{done=$rDone;total=$rTot}; papers=@{done=$pDone;total=$pTot};
            rate_per_hour=$rate; eta=$eta; complete=$complete }
        $status | ConvertTo-Json -Depth 5 | Set-Content $StatusFile -Encoding UTF8

        if ($complete) {
            "Backfill complete at $($now.ToString('u')) - $done/$tot summaries." | Set-Content $DoneFlag -Encoding UTF8
            [console]::beep(880,300); [console]::beep(1175,300); [console]::beep(1568,500)
            try {
                Add-Type -AssemblyName System.Windows.Forms
                [System.Windows.Forms.MessageBox]::Show(
                    "All $tot AI summaries are done (models/repos/papers at 100%). You can let the laptop sleep now.",
                    "AI Research Radar - backfill complete") | Out-Null
            } catch {}
            Write-Host "DONE - 100%. Watcher exiting." -ForegroundColor Green
            break
        }
    } catch {
        Write-Host ("check failed: {0} (will retry)" -f $_.Exception.Message) -ForegroundColor Yellow
    }
    Start-Sleep -Seconds ($IntervalMinutes*60)
}
