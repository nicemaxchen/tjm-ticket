# Convert all project files to UTF-8 encoding (without BOM)
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Project Files UTF-8 Conversion Tool" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$fileExtensions = @('*.js', '*.vue', '*.md', '*.json', '*.txt', '*.html', '*.css', '*.xml', '*.yaml', '*.yml')
$excludeDirs = @('node_modules', '.git', 'dist', 'build', '.vscode', '.idea')

$totalFiles = 0
$convertedFiles = 0
$skippedFiles = 0
$errorFiles = 0

$projectRoot = $PSScriptRoot
if (-not $projectRoot) {
    $projectRoot = Get-Location
}

Write-Host "Project directory: $projectRoot" -ForegroundColor Cyan
Write-Host "Scanning files..." -ForegroundColor Yellow
Write-Host ""

$files = @()
foreach ($ext in $fileExtensions) {
    $foundFiles = Get-ChildItem -Path $projectRoot -Filter $ext -Recurse -File -ErrorAction SilentlyContinue | 
        Where-Object {
            $excluded = $false
            foreach ($excludeDir in $excludeDirs) {
                if ($_.FullName -like "*\$excludeDir\*") {
                    $excluded = $true
                    break
                }
            }
            -not $excluded
        }
    $files += $foundFiles
}

$files = $files | Sort-Object FullName -Unique
$totalFiles = $files.Count

Write-Host "Found $totalFiles files to check" -ForegroundColor Cyan
Write-Host ""

$utf8NoBom = New-Object System.Text.UTF8Encoding $false

foreach ($file in $files) {
    $relativePath = $file.FullName.Replace($projectRoot, '').TrimStart('\')
    Write-Host "Processing: $relativePath" -ForegroundColor Gray -NoNewline
    
    try {
        $bytes = [System.IO.File]::ReadAllBytes($file.FullName)
        
        # Check if already UTF-8 without BOM
        $isUtf8 = $true
        if ($bytes.Length -ge 3 -and $bytes[0] -eq 0xEF -and $bytes[1] -eq 0xBB -and $bytes[2] -eq 0xBF) {
            $isUtf8 = $false
        }
        
        if ($isUtf8) {
            try {
                $content = [System.IO.File]::ReadAllText($file.FullName, [System.Text.Encoding]::UTF8)
                $reEncoded = [System.Text.Encoding]::UTF8.GetBytes($content)
                if ([System.Linq.Enumerable]::SequenceEqual([byte[]]$bytes, [byte[]]$reEncoded)) {
                    Write-Host " [UTF-8 - Skip]" -ForegroundColor Green
                    $skippedFiles++
                    continue
                }
            } catch {
                $isUtf8 = $false
            }
        }
        
        # Try to read with different encodings
        $content = $null
        $encodings = @(
            [System.Text.Encoding]::UTF8,
            [System.Text.Encoding]::GetEncoding('Big5'),
            [System.Text.Encoding]::GetEncoding('GB2312'),
            [System.Text.Encoding]::GetEncoding('GB18030'),
            [System.Text.Encoding]::Default
        )
        
        foreach ($encoding in $encodings) {
            try {
                $content = [System.IO.File]::ReadAllText($file.FullName, $encoding)
                break
            } catch {
                continue
            }
        }
        
        if ($null -eq $content) {
            Write-Host " [Error: Cannot read]" -ForegroundColor Red
            $errorFiles++
            continue
        }
        
        # Write as UTF-8 without BOM
        [System.IO.File]::WriteAllText($file.FullName, $content, $utf8NoBom)
        Write-Host " [Converted to UTF-8]" -ForegroundColor Green
        $convertedFiles++
        
    } catch {
        Write-Host " [Error: $($_.Exception.Message)]" -ForegroundColor Red
        $errorFiles++
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Conversion Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Total files: $totalFiles" -ForegroundColor White
Write-Host "Converted: $convertedFiles" -ForegroundColor Green
Write-Host "Skipped (already UTF-8): $skippedFiles" -ForegroundColor Cyan
Write-Host "Errors: $errorFiles" -ForegroundColor $(if ($errorFiles -gt 0) { "Red" } else { "Green" })
Write-Host ""

if ($convertedFiles -gt 0) {
    Write-Host "Note: Please verify file contents and commit changes." -ForegroundColor Yellow
}
