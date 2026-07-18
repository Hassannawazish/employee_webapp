param(
  [string]$DatasetPath = "$PSScriptRoot\..\dataset\hazard symbols.v15i.yolov5pytorch",
  [string]$BaseWeights = "$PSScriptRoot\..\yolov5s.pt",
  [string]$Yolov5Repo = "$PSScriptRoot\yolov5",
  [int]$Epochs = 100,
  [int]$ImageSize = 640,
  [int]$BatchSize = 8
)

$ErrorActionPreference = "Stop"

$dataset = Resolve-Path -LiteralPath $DatasetPath
$weights = Resolve-Path -LiteralPath $BaseWeights
$modelsDir = Join-Path $PSScriptRoot "models"
$runsDir = Join-Path $PSScriptRoot "runs"
$localDataYaml = Join-Path $PSScriptRoot "hazard_symbols.local.yaml"

New-Item -ItemType Directory -Force -Path $modelsDir | Out-Null
New-Item -ItemType Directory -Force -Path $runsDir | Out-Null

if (-not (Test-Path -LiteralPath $Yolov5Repo)) {
  git clone https://github.com/ultralytics/yolov5.git $Yolov5Repo
}

python -m pip install --upgrade pip
python -m pip install -r (Join-Path $Yolov5Repo "requirements.txt")
python -m pip install -r (Join-Path $PSScriptRoot "requirements.txt")

$trainImages = (Resolve-Path -LiteralPath (Join-Path $dataset "train\images")).Path.Replace("\", "/")
$validImages = (Resolve-Path -LiteralPath (Join-Path $dataset "valid\images")).Path.Replace("\", "/")
$testImages = (Resolve-Path -LiteralPath (Join-Path $dataset "test\images")).Path.Replace("\", "/")

function ConvertTo-YamlSingleQuotedValue([string]$Value) {
  return "'" + $Value.Replace("'", "''") + "'"
}

$dataYamlContent = @"
train: $(ConvertTo-YamlSingleQuotedValue $trainImages)
val: $(ConvertTo-YamlSingleQuotedValue $validImages)
test: $(ConvertTo-YamlSingleQuotedValue $testImages)

nc: 7
names:
  0: Corrosion
  1: Environment
  2: Exclamation Mark
  3: Flame
  4: Flame Over Circle
  5: Health Hazard
  6: Skull and Crossbones
"@

$utf8WithoutBom = New-Object System.Text.UTF8Encoding $false
[System.IO.File]::WriteAllText($localDataYaml, $dataYamlContent, $utf8WithoutBom)

python (Join-Path $Yolov5Repo "train.py") `
  --img $ImageSize `
  --batch $BatchSize `
  --epochs $Epochs `
  --data $localDataYaml `
  --weights $weights `
  --project $runsDir `
  --name hazard-symbols `
  --exist-ok

$bestWeights = Join-Path $runsDir "hazard-symbols\weights\best.pt"
if (-not (Test-Path -LiteralPath $bestWeights)) {
  throw "Training finished, but best.pt was not found at $bestWeights"
}

Copy-Item -LiteralPath $bestWeights -Destination (Join-Path $modelsDir "hazard-symbols-best.pt") -Force

python (Join-Path $Yolov5Repo "export.py") `
  --weights (Join-Path $modelsDir "hazard-symbols-best.pt") `
  --img $ImageSize `
  --include onnx `
  --project $modelsDir `
  --name exported `
  --exist-ok

Write-Host ""
Write-Host "Training complete."
Write-Host "PyTorch model: $modelsDir\hazard-symbols-best.pt"
Write-Host "ONNX export:   $modelsDir\exported\hazard-symbols-best.onnx"
