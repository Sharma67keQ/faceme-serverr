Add-Type -AssemblyName System.Drawing

$root = Split-Path -Parent $PSScriptRoot
$assets = Join-Path $root "mobile\assets"
$androidRes = Join-Path $root "mobile\android\app\src\main\res"

function New-RoundedRectPath {
  param([float]$X, [float]$Y, [float]$Width, [float]$Height, [float]$Radius)
  $diameter = $Radius * 2
  $path = New-Object System.Drawing.Drawing2D.GraphicsPath
  $path.AddArc($X, $Y, $diameter, $diameter, 180, 90)
  $path.AddArc($X + $Width - $diameter, $Y, $diameter, $diameter, 270, 90)
  $path.AddArc($X + $Width - $diameter, $Y + $Height - $diameter, $diameter, $diameter, 0, 90)
  $path.AddArc($X, $Y + $Height - $diameter, $diameter, $diameter, 90, 90)
  $path.CloseFigure()
  $path
}

function Get-LogoBitmap {
  param([int]$Size, [switch]$WithGlow)

  $bmp = New-Object System.Drawing.Bitmap $Size, $Size
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $g.Clear([System.Drawing.Color]::FromArgb(11, 11, 18))

  if ($WithGlow) {
    $glowPath = New-Object System.Drawing.Drawing2D.GraphicsPath
    $glowPath.AddEllipse([int]($Size * 0.12), [int]($Size * 0.12), [int]($Size * 0.76), [int]($Size * 0.76))
    $glowBrush = New-Object System.Drawing.Drawing2D.PathGradientBrush($glowPath)
    $glowBrush.CenterColor = [System.Drawing.Color]::FromArgb(110, 123, 92, 255)
    $glowBrush.SurroundColors = @([System.Drawing.Color]::FromArgb(0, 123, 92, 255))
    $g.FillEllipse($glowBrush, [int]($Size * 0.08), [int]($Size * 0.08), [int]($Size * 0.84), [int]($Size * 0.84))
    $glowBrush.Dispose()
    $glowPath.Dispose()
  }

  $bodyX = $Size * 0.16
  $bodyY = $Size * 0.14
  $bodyW = $Size * 0.68
  $bodyH = $Size * 0.68
  $bodyRadius = $Size * 0.24
  $bubblePath = New-RoundedRectPath -X $bodyX -Y $bodyY -Width $bodyW -Height $bodyH -Radius $bodyRadius
  $tailPath = New-Object System.Drawing.Drawing2D.GraphicsPath
  $tailPath.AddPolygon(@(
    (New-Object System.Drawing.PointF ([float]($Size * 0.62)), ([float]($Size * 0.76))),
    (New-Object System.Drawing.PointF ([float]($Size * 0.80)), ([float]($Size * 0.78))),
    (New-Object System.Drawing.PointF ([float]($Size * 0.67)), ([float]($Size * 0.92)))
  ))
  $bubblePath.AddPath($tailPath, $true)

  $gradientRect = New-Object System.Drawing.RectangleF 0, 0, $Size, $Size
  $brush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
    $gradientRect,
    [System.Drawing.Color]::FromArgb(139, 92, 255),
    [System.Drawing.Color]::FromArgb(255, 155, 66),
    35
  )
  $blend = New-Object System.Drawing.Drawing2D.ColorBlend
  $blend.Colors = @(
    [System.Drawing.Color]::FromArgb(139, 92, 255),
    [System.Drawing.Color]::FromArgb(40, 167, 255),
    [System.Drawing.Color]::FromArgb(255, 155, 66)
  )
  $blend.Positions = @(0.0, 0.58, 1.0)
  $brush.InterpolationColors = $blend
  $g.FillPath($brush, $bubblePath)

  $outlinePen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(76, 255, 255, 255), [Math]::Max(2, [int]($Size / 64)))
  $g.DrawPath($outlinePen, $bubblePath)

  $innerPath = New-RoundedRectPath -X ($Size * 0.28) -Y ($Size * 0.26) -Width ($Size * 0.44) -Height ($Size * 0.40) -Radius ($Size * 0.16)
  $innerBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(22, 20, 32))
  $g.FillPath($innerBrush, $innerPath)

  $whiteBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(247, 244, 255))
  $eye = [float]($Size * 0.07)
  $g.FillEllipse($whiteBrush, [float]($Size * 0.37), [float]($Size * 0.38), $eye, $eye)
  $g.FillEllipse($whiteBrush, [float]($Size * 0.56), [float]($Size * 0.38), $eye, $eye)

  $smilePen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(247, 244, 255), [Math]::Max(3, [int]($Size / 40)))
  $g.DrawArc($smilePen, [float]($Size * 0.38), [float]($Size * 0.39), [float]($Size * 0.24), [float]($Size * 0.18), 20, 140)

  $brush.Dispose()
  $outlinePen.Dispose()
  $innerBrush.Dispose()
  $whiteBrush.Dispose()
  $smilePen.Dispose()
  $innerPath.Dispose()
  $tailPath.Dispose()
  $bubblePath.Dispose()
  $g.Dispose()
  $bmp
}

function Save-CenteredLogo {
  param([int]$CanvasSize, [double]$Scale, [string]$Path)
  $canvas = New-Object System.Drawing.Bitmap $CanvasSize, $CanvasSize
  $g = [System.Drawing.Graphics]::FromImage($canvas)
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $g.Clear([System.Drawing.Color]::FromArgb(11, 11, 18))
  $logo = Get-LogoBitmap -Size ([int]($CanvasSize * $Scale)) -WithGlow
  $offsetX = [int](($CanvasSize - $logo.Width) / 2)
  $offsetY = [int](($CanvasSize - $logo.Height) / 2)
  $g.DrawImage($logo, $offsetX, $offsetY, $logo.Width, $logo.Height)
  $canvas.Save($Path, [System.Drawing.Imaging.ImageFormat]::Png)
  $logo.Dispose()
  $g.Dispose()
  $canvas.Dispose()
}

Save-CenteredLogo -CanvasSize 1024 -Scale 0.74 -Path (Join-Path $assets "icon.png")
Save-CenteredLogo -CanvasSize 1024 -Scale 0.66 -Path (Join-Path $assets "adaptive-icon.png")

$splash = New-Object System.Drawing.Bitmap 1242, 2688
$g = [System.Drawing.Graphics]::FromImage($splash)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.Clear([System.Drawing.Color]::FromArgb(11, 11, 18))
$splashLogo = Get-LogoBitmap -Size 540 -WithGlow
$g.DrawImage($splashLogo, [int](($splash.Width - $splashLogo.Width) / 2), 760, $splashLogo.Width, $splashLogo.Height)
$splash.Save((Join-Path $assets "splash.png"), [System.Drawing.Imaging.ImageFormat]::Png)
$splashLogo.Dispose()
$g.Dispose()
$splash.Dispose()

$splashSizes = @{
  "drawable-mdpi" = 140
  "drawable-hdpi" = 210
  "drawable-xhdpi" = 280
  "drawable-xxhdpi" = 420
  "drawable-xxxhdpi" = 560
}

foreach ($folder in $splashSizes.Keys) {
  $logo = Get-LogoBitmap -Size $splashSizes[$folder] -WithGlow
  $path = Join-Path $androidRes "$folder\\splashscreen_logo.png"
  $logo.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
  $logo.Dispose()
}

$iconSizes = @{
  "mipmap-mdpi" = 48
  "mipmap-hdpi" = 72
  "mipmap-xhdpi" = 96
  "mipmap-xxhdpi" = 144
  "mipmap-xxxhdpi" = 192
}

foreach ($folder in $iconSizes.Keys) {
  $size = $iconSizes[$folder]
  $foreground = Join-Path $androidRes "$folder\\ic_launcher_foreground.png"
  $icon = Join-Path $androidRes "$folder\\ic_launcher.png"
  $round = Join-Path $androidRes "$folder\\ic_launcher_round.png"

  Save-CenteredLogo -CanvasSize $size -Scale 0.76 -Path $foreground
  Save-CenteredLogo -CanvasSize $size -Scale 0.92 -Path $icon
  Save-CenteredLogo -CanvasSize $size -Scale 0.92 -Path $round
}
