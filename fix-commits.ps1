# Git 提交訊息亂碼修正腳本
# 此腳本會修正最近兩個提交的訊息

# 確保使用 UTF-8 編碼
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
chcp 65001 | Out-Null

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Git 提交訊息亂碼修正腳本" -ForegroundColor Green
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

# 檢查是否有未提交的變更
$status = git status --porcelain
if ($status) {
    Write-Host "警告：偵測到未提交的變更" -ForegroundColor Yellow
    Write-Host "未提交的檔案：" -ForegroundColor Yellow
    git status --short
    Write-Host ""
    $continue = Read-Host "是否繼續修正提交訊息？(y/n)"
    if ($continue -ne "y" -and $continue -ne "Y") {
        Write-Host "已取消操作" -ForegroundColor Yellow
        exit 0
    }
}

# 檢查提交歷史
$commitCount = (git rev-list --count HEAD 2>$null)
if ($commitCount -lt 2) {
    Write-Host "警告：提交歷史少於 2 個，只能修正最新的提交" -ForegroundColor Yellow
    $onlyLatest = $true
} else {
    $onlyLatest = $false
}

# 顯示當前的提交訊息（亂碼）
Write-Host "`n當前提交歷史（顯示為亂碼）：" -ForegroundColor Cyan
git log --oneline -3
Write-Host ""

# 修正最新的提交
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "步驟 1: 修正最新的提交訊息" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan

$latestCommitMsg = "新增 Element Plus 繁體中文語系支援"
Write-Host "將使用以下訊息修正最新提交：" -ForegroundColor Yellow
Write-Host "  $latestCommitMsg" -ForegroundColor White
Write-Host ""

$confirm = Read-Host "確認使用此訊息？(y/n，或按 Enter 輸入自訂訊息)"
if ($confirm -ne "y" -and $confirm -ne "Y" -and $confirm -ne "") {
    $latestCommitMsg = Read-Host "請輸入新的提交訊息"
}

try {
    # 使用環境變數設定編碼，確保中文正確處理
    $env:GIT_COMMITTER_NAME = git config user.name
    $env:GIT_COMMITTER_EMAIL = git config user.email
    $env:LANG = "zh_TW.UTF-8"
    
    # 使用臨時檔案來避免 PowerShell 編碼問題
    $tempFile = [System.IO.Path]::GetTempFileName()
    [System.IO.File]::WriteAllText($tempFile, $latestCommitMsg, [System.Text.Encoding]::UTF8)
    
    git commit --amend -F $tempFile
    
    Remove-Item $tempFile -ErrorAction SilentlyContinue
    
    Write-Host "✓ 最新提交訊息已修正" -ForegroundColor Green
} catch {
    Write-Host "錯誤：修正最新提交時發生問題" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}

# 修正第二個提交
if (-not $onlyLatest) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "步驟 2: 修正第二個提交訊息" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Cyan
    
    # 根據變更內容推測提交訊息
    $secondCommitFiles = git diff-tree --no-commit-id --name-only -r HEAD~1
    $hasPackageLock = $secondCommitFiles | Where-Object { $_ -like "*package-lock.json*" }
    $hasReadme = $secondCommitFiles | Where-Object { $_ -like "*README*" -or $_ -like "*QUICKSTART*" }
    $hasVueFiles = $secondCommitFiles | Where-Object { $_ -like "*.vue" }
    
    if ($hasPackageLock -and $hasReadme -and $hasVueFiles) {
        $secondCommitMsg = "更新專案文件與介面優化"
    } else {
        $secondCommitMsg = "更新專案程式碼"
    }
    
    Write-Host "根據變更內容，建議的提交訊息：" -ForegroundColor Yellow
    Write-Host "  $secondCommitMsg" -ForegroundColor White
    Write-Host ""
    Write-Host "將使用互動式 rebase 來修正第二個提交" -ForegroundColor Yellow
    Write-Host "在編輯器中：" -ForegroundColor Yellow
    Write-Host "  1. 將第二個提交的 'pick' 改為 'reword' 或 'r'" -ForegroundColor White
    Write-Host "  2. 儲存並關閉編輯器" -ForegroundColor White
    Write-Host "  3. 在出現的編輯器中輸入：$secondCommitMsg" -ForegroundColor White
    Write-Host "  4. 儲存並關閉編輯器" -ForegroundColor White
    Write-Host ""
    
    $continue = Read-Host "按 Enter 繼續，或輸入 's' 跳過此步驟"
    if ($continue -ne "s" -and $continue -ne "S") {
        try {
            # 設定 Git 編輯器環境變數
            $env:GIT_EDITOR = "code --wait"
            $env:EDITOR = "code --wait"
            
            git rebase -i HEAD~2
            
            Write-Host "✓ 第二個提交訊息已修正" -ForegroundColor Green
        } catch {
            Write-Host "警告：互動式 rebase 可能未完成，請手動檢查" -ForegroundColor Yellow
        }
    }
}

# 顯示修正後的結果
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "修正完成！" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "修正後的提交歷史：" -ForegroundColor Cyan
git log --oneline -3
Write-Host ""

# 檢查是否已推送到遠端
$remoteStatus = git status -sb 2>$null
if ($remoteStatus -match "ahead") {
    Write-Host "注意：本地分支領先遠端分支" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "如果已經推送到遠端，需要強制推送來更新遠端歷史：" -ForegroundColor Yellow
    Write-Host "  git push --force-with-lease origin main" -ForegroundColor White
    Write-Host ""
    Write-Host "⚠️  警告：強制推送會改寫遠端歷史" -ForegroundColor Red
    Write-Host "   請確保團隊成員知道此變更，避免造成協作問題" -ForegroundColor Red
    Write-Host ""
    
    $pushNow = Read-Host "是否現在推送到遠端？(y/n)"
    if ($pushNow -eq "y" -or $pushNow -eq "Y") {
        try {
            git push --force-with-lease origin main
            Write-Host "✓ 已推送到遠端" -ForegroundColor Green
        } catch {
            Write-Host "錯誤：推送失敗" -ForegroundColor Red
            Write-Host $_.Exception.Message -ForegroundColor Red
        }
    }
}

Write-Host ""
Write-Host "腳本執行完成！" -ForegroundColor Green
