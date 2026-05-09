param(
  [string]$Configuration = "release"
)

$ErrorActionPreference = "Stop"

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$tauriDir = Join-Path $repoRoot "src-tauri"
$wixDir = Join-Path $tauriDir "target\$Configuration\wix\x64"
$wxsPath = Join-Path $wixDir "main.wxs"
$wixTools = Join-Path $env:LOCALAPPDATA "tauri\WixTools314"
$candle = Join-Path $wixTools "candle.exe"
$light = Join-Path $wixTools "light.exe"

Push-Location $repoRoot
try {
  npm run tauri build

  if (!(Test-Path -LiteralPath $wxsPath)) {
    throw "WiX source not found: $wxsPath"
  }

  $wxs = Get-Content -LiteralPath $wxsPath -Raw
  $desktopShortcut = '<Shortcut Id="ApplicationDesktopShortcut" Name="hazpenztar" Description="Runs hazpenztar" Target="[!Path]" WorkingDirectory="INSTALLDIR" />'
  $desktopShortcutWithIcon = '<Shortcut Id="ApplicationDesktopShortcut" Name="hazpenztar" Description="Runs hazpenztar" Target="[!Path]" Icon="ProductIcon" WorkingDirectory="INSTALLDIR" />'

  if (!$wxs.Contains($desktopShortcutWithIcon)) {
    if (!$wxs.Contains($desktopShortcut)) {
      throw "Desktop shortcut line not found in WiX source."
    }

    $wxs = $wxs.Replace($desktopShortcut, $desktopShortcutWithIcon)
    Set-Content -LiteralPath $wxsPath -Value $wxs -Encoding UTF8
  }

  if (!(Test-Path -LiteralPath $candle) -or !(Test-Path -LiteralPath $light)) {
    throw "WiX tools not found under $wixTools"
  }

  $wixObj = Join-Path $wixDir "main.wixobj"
  $locale = Join-Path $wixDir "locale.wxl"
  $version = (Get-Content -LiteralPath (Join-Path $tauriDir "tauri.conf.json") -Raw | ConvertFrom-Json).version
  $msiOut = Join-Path $tauriDir "target\$Configuration\bundle\msi\hazpenztar_${version}_x64_en-US.msi"

  & $candle -arch x64 -ext WixUtilExtension -ext WixUIExtension -out $wixObj $wxsPath
  if ($LASTEXITCODE -ne 0) {
    throw "candle.exe failed with exit code $LASTEXITCODE"
  }

  & $light -ext WixUtilExtension -ext WixUIExtension -cultures:en-us -loc $locale -out $msiOut $wixObj
  if ($LASTEXITCODE -ne 0) {
    throw "light.exe failed with exit code $LASTEXITCODE"
  }

  Write-Host "MSI update build ready: $msiOut"
}
finally {
  Pop-Location
}
