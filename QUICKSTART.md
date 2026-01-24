# 快速啟動指南

## 前置要求

- Node.js 18+ 
- npm 或 yarn

## 一鍵安裝

```bash
npm run install:all
```

這個命令會安裝：
- 根目錄依賴
- 前台系統依賴 (frontend/)
- 後台系統依賴 (admin/)
- 後端API依賴 (backend/)

## 啟動系統

### 方式一：同時啟動所有服務（推薦）

```bash
npm run dev
```

這會同時啟動：
- 後端API服務: http://localhost:3000
- 前台系統: http://localhost:5173
- 後台管理系統: http://localhost:5174

### 方式二：分別啟動

```bash
# 終端1 - 啟動後端
npm run dev:backend

# 終端2 - 啟動前台
npm run dev:frontend

# 終端3 - 啟動後台
npm run dev:admin
```

## 首次使用

1. **啟動後端服務**後，系統會自動：
   - 建立SQLite資料庫檔案 (`backend/database/ticket.db`)
   - 建立所有資料表
   - 建立預設管理員帳戶
   - 建立範例活動和資料

2. **登入後台管理系統**:
   - 訪問 http://localhost:5174
   - 使用預設帳戶登入：
     - 使用者名稱: `admin`
     - 密碼: `admin123`

3. **使用前台系統**:
   - 訪問 http://localhost:5173
   - 可以查詢報名或進行新的報名登記

## 測試流程

### 1. 後台管理流程

1. 登入後台管理系統
2. 在「活動管理」中建立新活動
3. 在「票券類別」中設定票券限額
4. 查看「待審核名單」並審核通過

### 2. 前台報名流程

1. 訪問前台系統
2. 點擊「登記報名資料」
3. 選擇活動場次和票券類別
4. 填寫姓名、Email、手機號
5. 輸入驗證碼（開發環境驗證碼會在後端控制台顯示）
6. 提交報名
7. 如果審核通過，會自動產生票券

### 3. 查詢和報到流程

1. 訪問前台系統
2. 點擊「查詢報名資料」
3. 輸入手機號和驗證碼
4. 查看已報名的票券
5. 點擊「掃碼報到」完成報到

## 開發環境說明

### 簡訊驗證碼

在開發環境中，簡訊驗證碼會直接輸出到後端控制台：
```
📱 簡訊驗證碼 [手機號]: 123456 (過期時間: ...)
```

**注意**: 生產環境需要配置真實的簡訊服務API。

### 資料庫

SQLite資料庫檔案位於 `backend/database/ticket.db`

可以使用SQLite工具查看和管理資料：
```bash
sqlite3 backend/database/ticket.db
```

## 常見問題

### 1. 埠號被佔用

如果埠號被佔用，可以修改設定檔：
- 後端: `backend/server.js` 中的 `PORT` 變數
- 前台: `frontend/vite.config.js` 中的 `server.port`
- 後台: `admin/vite.config.js` 中的 `server.port`

### 2. 資料庫錯誤

如果遇到資料庫錯誤，可以刪除 `backend/database/ticket.db` 檔案，重新啟動後端服務會自動建立。

### 3. 依賴安裝失敗

確保使用正確的Node.js版本（18+），如果仍有問題，可以嘗試：
```bash
# 清理快取
npm cache clean --force

# 刪除node_modules後重新安裝
rm -rf node_modules frontend/node_modules admin/node_modules backend/node_modules
npm run install:all
```

## 下一步

- 查看 [README.md](README.md) 了解完整的系統架構和功能
- 查看 API 文件了解介面詳情
- 根據實際需求修改和擴展系統功能
