# 修正 Git 提交訊息亂碼問題

## 問題說明
Git 提交訊息出現亂碼是因為編碼不匹配。提交訊息已損壞，需要修正。

## 快速解決方案（推薦）

### 使用自動修正腳本

執行提供的 PowerShell 腳本來自動修正提交訊息：

```powershell
.\fix-commits.ps1
```

腳本會：
1. 自動檢查 Git 環境和未提交的變更
2. 修正最新的提交訊息（預設：`新增 Element Plus 繁體中文語系支援`）
3. 引導您修正第二個提交訊息
4. 顯示修正後的結果
5. 可選：推送到遠端（如果需要）

## 手動修正方法

### 步驟 1: 修正最近的提交訊息

由於提交訊息已經損壞，我們需要使用 `git commit --amend` 來修正：

```bash
# 修正最新的提交 (c19a100)
git commit --amend -m "新增 Element Plus 繁體中文語系支援"

# 修正第二個提交 (78ea84d) - 需要互動式 rebase
git rebase -i HEAD~2
# 在編輯器中，將第二個提交的 "pick" 改為 "reword"
# 然後輸入正確的提交訊息（建議：更新專案文件與介面優化）
```

### 步驟 2: 如果已經推送到遠端

如果已經推送到遠端，需要強制推送（請謹慎使用）：

```bash
# 警告：這會改寫遠端歷史，請確保團隊成員知道
git push --force-with-lease origin main
```

## Git 編碼設定（已完成）

以下設定已經完成：
- `core.quotepath = false`
- `i18n.commitencoding = utf-8`
- `i18n.logoutputencoding = utf-8`

## 終端機編碼設定

### PowerShell 臨時設定
在 PowerShell 中執行：
```powershell
chcp 65001
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
```

### PowerShell 永久設定
在 PowerShell 設定檔（`$PROFILE`）中加入：
```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
chcp 65001 | Out-Null
```

## 預防措施

1. **使用 UTF-8 編碼的編輯器**：確保編輯器（如 VS Code）使用 UTF-8 編碼
2. **設定 PowerShell 預設編碼**：在 PowerShell 設定檔中設定 UTF-8（見上方）
3. **使用臨時檔案提交訊息**：避免直接在命令列輸入中文
   ```powershell
   # 建立 UTF-8 編碼的訊息檔案
   "您的提交訊息" | Out-File -Encoding utf8 commit-msg.txt
   git commit -F commit-msg.txt
   ```
4. **使用編輯器編輯提交訊息**：使用 `git commit`（不加 `-m`）讓 Git 開啟編輯器
5. **設定 Git 編輯器為 VS Code**：
   ```bash
   git config --global core.editor "code --wait"
   ```

## 腳本功能說明

`fix-commits.ps1` 腳本包含以下功能：
- ✅ 自動檢查 Git 環境
- ✅ 檢查未提交的變更並提示
- ✅ 使用 UTF-8 編碼處理提交訊息
- ✅ 智能推測第二個提交的訊息內容
- ✅ 互動式引導修正過程
- ✅ 可選的遠端推送功能
- ✅ 完整的錯誤處理
