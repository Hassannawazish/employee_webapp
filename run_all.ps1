$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$mosquittoDir = Join-Path $root 'test\mosquitto'
$frontendDir = Join-Path $root 'test\espfrontend'
$mqttUrl = 'ws://127.0.0.1:9002'
$hazardDetectionUrl = 'http://127.0.0.1:5055'
$startedProcesses = @()
$previousTreatControlCAsInput = [Console]::TreatControlCAsInput

function Start-StackWindow {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Title,
    [Parameter(Mandatory = $true)]
    [string]$WorkingDirectory,
    [Parameter(Mandatory = $true)]
    [string]$Command
  )

  $process = Start-Process `
    -FilePath 'cmd.exe' `
    -ArgumentList @('/k', "title $Title && $Command") `
    -WorkingDirectory $WorkingDirectory `
    -PassThru

  $script:startedProcesses += $process
  return $process
}

function Stop-StackProcesses {
  foreach ($process in $script:startedProcesses) {
    if ($null -eq $process -or $process.HasExited) {
      continue
    }

    Write-Host "Stopping $($process.Id)..."
    & taskkill.exe /PID $process.Id /T /F | Out-Null
  }
}

function Wait-ForStopSignal {
  [Console]::TreatControlCAsInput = $true

  while ($true) {
    if ([Console]::KeyAvailable) {
      $key = [Console]::ReadKey($true)
      $isCtrlC = $key.Key -eq [ConsoleKey]::C -and ($key.Modifiers -band [ConsoleModifiers]::Control)
      $isQ = $key.Key -eq [ConsoleKey]::Q

      if ($isCtrlC -or $isQ) {
        return
      }
    }

    Start-Sleep -Milliseconds 150
  }
}

Write-Host 'Starting SCAI local stack...'
Write-Host ''
Write-Host "Mosquitto: $mosquittoDir"
Write-Host "Detector:  $hazardDetectionUrl"
Write-Host "React:     $frontendDir"
Write-Host "MQTT URL:  $mqttUrl"
Write-Host ''

try {
  Start-StackWindow `
    -Title 'SCAI Mosquitto MQTT' `
    -WorkingDirectory $mosquittoDir `
    -Command 'call ".\run-mosquitto-dev.bat"' | Out-Null

  Start-Sleep -Seconds 2

  Start-StackWindow `
    -Title 'SCAI YOLO Detector' `
    -WorkingDirectory $frontendDir `
    -Command 'set "KMP_DUPLICATE_LIB_OK=TRUE" && python ".\ml\serve_hazard_detector.py"' | Out-Null

  Start-Sleep -Seconds 2

  Start-StackWindow `
    -Title 'SCAI React Webapp' `
    -WorkingDirectory $frontendDir `
    -Command "set `"REACT_APP_MQTT_URL=$mqttUrl`" && set `"REACT_APP_HAZARD_DETECTION_URL=$hazardDetectionUrl`" && npm.cmd start" | Out-Null

  Write-Host 'Started all services in separate windows.'
  Write-Host ''
  Write-Host 'Press Ctrl+C or Q in this main window to stop Mosquitto, YOLO, and React.'
  Write-Host 'Keep this main window open while using the app.'
  Write-Host ''

  Wait-ForStopSignal
} finally {
  [Console]::TreatControlCAsInput = $previousTreatControlCAsInput
  Write-Host ''
  Write-Host 'Stopping SCAI local stack...'
  Stop-StackProcesses
  Write-Host 'All launched services were asked to stop.'
}
