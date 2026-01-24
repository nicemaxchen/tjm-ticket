# Git 提交並推送到 GitHub 腳本
# 此腳本會自動提交所有變更並推送到 GitHub

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
chcp 65001 | Out-Null

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Git 提交並推送到 GitHub" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 檢查 Git 是否可用
try {
    $null = git --version
} catch {
    Write-Host "錯誤：找不到 Git，請確認 Git 已安裝並在 PATH 中" -ForegroundColor Red
    exit 1
}

# 檢查是否在 Git 倉庫中
$gitRoot = git rev-parse --git-dir 2>$null
if (-not $gitRoot) {
    Write-Host "錯誤：當前目錄不是 Git 倉庫" -ForegroundColor Red
    exit 1
}

# 檢查是否有遠端倉庫
$remote = git remote get-url origin 2>$null
if (-not $remote) {
    Write-Host "錯誤：找不到遠端倉庫 origin" -ForegroundColor Red
    exit 1
}

Write-Host "遠端倉庫: $remote" -ForegroundColor Cyan
Write-Host ""

# 檢查當前分支
$currentBranch = git rev-parse --abbrev-ref HEAD
Write-Host "當前分支: $currentBranch" -ForegroundColor Cyan
Write-Host ""

# 檢查是否有未提交的變更
$status = git status --porcelain
if (-not $status) {
    Write-Host "沒有未提交的變更" -ForegroundColor Yellow
    Write-Host ""
    
    # 檢查是否有未推送的提交
    $ahead = git rev-list --count @{u}..HEAD 2>$null
    if ($ahead -gt 0) {
        Write-Host "發現 $ahead 個未推送的提交" -ForegroundColor Yellow
        $push = Read-Host "是否推送到遠端？(y/n)"
        if ($push -eq "y" -or $push -eq "Y") {
            Write-Host "`n推送到 GitHub..." -ForegroundColor Cyan
            git push origin $currentBranch
            if ($LASTEXITCODE -eq 0) {
                Write-Host "✓ 推送成功" -ForegroundColor Green
            } else {
                Write-Host "✗ 推送失敗" -ForegroundColor Red
                exit 1
            }
        }
    } else {
        Write-Host "所有變更已提交並推送" -ForegroundColor Green
    }
    exit 0
}

# 顯示變更摘要
Write-Host "變更摘要：" -ForegroundColor Cyan
git status --short
Write-Host ""

# 顯示詳細變更統計
Write-Host "變更統計：" -ForegroundColor Cyan
git diff --stat
Write-Host ""

# 詢問是否繼續
$continue = Read-Host "是否提交這些變更？(y/n)"
if ($continue -ne "y" -and $continue -ne "Y") {
    Write-Host "已取消操作" -ForegroundColor Yellow
    exit 0
}

# 輸入提交訊息
Write-Host ""
Write-Host "請輸入提交訊息：" -ForegroundColor Yellow
Write-Host "(按 Enter 使用預設訊息，或輸入自訂訊息)" -ForegroundColor Gray
$commitMessage = Read-Host

if ([string]::IsNullOrWhiteSpace($commitMessage)) {
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $commitMessage = "更新專案 - $timestamp"
    Write-Host "使用預設訊息: $commitMessage" -ForegroundColor Gray
}

# 詢問是否需要詳細說明
$needDetails = Read-Host "`n是否需要添加詳細說明？(y/n)"
$details = @()

if ($needDetails -eq "y" -or $needDetails -eq "Y") {
    Write-Host "請輸入詳細說明（每行一個，輸入空行結束）：" -ForegroundColor Yellow
    while ($true) {
        $line = Read-Host
        if ([string]::IsNullOrWhiteSpace($line)) {
            break
        }
        $details += "- $line"
    }
}

# 建立提交訊息檔案
$tempFile = [System.IO.Path]::GetTempFileName()
$messageContent = $commitMessage

if ($details.Count -gt 0) {
    $messageContent += "`n`n" + ($details -join "`n")
}

[System.IO.File]::WriteAllText($tempFile, $messageContent, [System.Text.Encoding]::UTF8)

# 添加所有變更
Write-Host "`n添加變更到暫存區..." -ForegroundColor Cyan
git add .

if ($LASTEXITCODE -ne 0) {
    Write-Host "錯誤：添加變更失敗" -ForegroundColor Red
    Remove-Item $tempFile -ErrorAction SilentlyContinue
    exit 1
}

# 提交變更
Write-Host "提交變更..." -ForegroundColor Cyan
git commit -F $tempFile

if ($LASTEXITCODE -ne 0) {
    Write-Host "錯誤：提交失敗" -ForegroundColor Red
    Remove-Item $tempFile -ErrorAction SilentlyContinue
    exit 1
}

Write-Host "✓ 提交成功" -ForegroundColor Green
Remove-Item $tempFile -ErrorAction SilentlyContinue

# 顯示提交資訊
Write-Host ""
Write-Host "提交資訊：" -ForegroundColor Cyan
git log --oneline -1
Write-Host ""

# 詢問是否推送到遠端
$push = Read-Host "是否推送到 GitHub？(y/n)"
if ($push -eq "y" -or $push -eq "Y") {
    Write-Host "`n推送到 GitHub..." -ForegroundColor Cyan
    
    # 檢查是否需要強制推送
    $behind = git rev-list --count HEAD..@{u} 2>$null
    if ($behind -gt 0) {
        Write-Host "警告：遠端分支有新的提交" -ForegroundColor Yellow
        Write-Host "本地分支落後 $behind 個提交" -ForegroundColor Yellow
        $force = Read-Host "是否使用強制推送？(y/n，建議先執行 git pull)"
        if ($force -eq "y" -or $force -eq "Y") {
            git push --force-with-lease origin $currentBranch
        } else {
            Write-Host "已取消推送，請先執行 git pull 合併遠端變更" -ForegroundColor Yellow
            exit 0
        }
    } else {
        git push origin $currentBranch
    }
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ 推送成功" -ForegroundColor Green
    } else {
        Write-Host "✗ 推送失敗" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "已跳過推送，您可以稍後使用 'git push' 推送" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "完成！" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
