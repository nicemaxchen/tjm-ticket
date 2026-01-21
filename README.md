# TJM Ticket Management System

基於Vue框架的事件票券管理系統，包含前台、後台和API後端。

## 系統架構

### 三個主要系統

1. **查詢報名資料系統**（前台）
   - 支援LIFF App和Web App
   - 手機號簡訊驗證
   - 顯示已報名票券及條碼
   - 現場報到功能

2. **登記報名資料系統**（前台）
   - 支援LIFF App和Web App
   - 使用者資料收集（姓名、Email、手機號）
   - 手機號簡訊驗證
   - 自動發送報到條碼連結

3. **票券管理配置系統**（後台）
   - 票券類別限額設定
   - 開放取票時間設定
   - 開放報到時間設定
   - 名單審核和開票作業

## 專案結構

```
tjm-ticket/
├── frontend/          # 前台系統（使用者端）
├── admin/            # 後台系統（管理端）
├── backend/          # 後端API服務
│   ├── database/     # SQLite資料庫
│   └── routes/       # API路由
└── README.md
```

## 安裝步驟

1. 安裝所有依賴：
```bash
npm run install:all
```

2. 啟動開發伺服器：
```bash
# 同時啟動前台、後台和後端
npm run dev

# 或分別啟動
npm run dev:frontend    # 前台 http://localhost:5173
npm run dev:admin       # 後台 http://localhost:5174
npm run dev:backend    # API後端 http://localhost:3000
```

## 技術棧

- **前端框架**: Vue 3 + Vite
- **UI元件庫**: Element Plus
- **後端框架**: Express.js
- **資料庫**: SQLite
- **路由**: Vue Router

## 功能特性

- ✅ 手機號簡訊驗證
- ✅ LIFF App整合支援
- ✅ 票券條碼產生和展示
- ✅ 報到掃碼功能
- ✅ 票券限額管理
- ✅ 時間配置管理
- ✅ 名單審核系統

## 預設帳戶

### 後台管理員
- 使用者名稱: `admin`
- 密碼: `admin123`

> 首次啟動後端服務時，系統會自動建立預設管理員帳戶和範例資料

## 資料庫說明

系統使用SQLite資料庫，資料庫檔案位於 `backend/database/ticket.db`

### 主要資料表

1. **users** - 使用者表
2. **events** - 活動表
3. **ticket_categories** - 票券類別表
4. **registrations** - 報名記錄表
5. **tickets** - 票券表
6. **sms_verifications** - 簡訊驗證表
7. **pending_list** - 待審核名單表
8. **admins** - 管理員表

## API端點說明

### 前台API
- `POST /api/auth/sms/send` - 發送簡訊驗證碼
- `POST /api/auth/sms/verify` - 驗證簡訊驗證碼
- `POST /api/registrations/query` - 查詢報名資料
- `POST /api/registrations/register` - 登記報名資料
- `GET /api/registrations/ticket/:tokenId` - 取得票券詳情
- `POST /api/registrations/checkin` - 報到
- `GET /api/tickets/events` - 取得活動列表
- `GET /api/tickets/categories` - 取得票券類別列表

### 後台API
- `POST /api/auth/admin/login` - 管理員登入
- `GET /api/admin/events` - 取得活動列表（後台）
- `POST /api/admin/events` - 建立活動
- `PUT /api/admin/events/:id` - 更新活動
- `GET /api/admin/categories` - 取得票券類別列表（後台）
- `POST /api/admin/categories` - 建立票券類別
- `PUT /api/admin/categories/:id` - 更新票券類別
- `GET /api/admin/pending-list` - 取得待審核名單
- `POST /api/admin/pending-list/:id/approve` - 審核通過並開票
- `POST /api/admin/pending-list/:id/reject` - 審核拒絕
- `GET /api/admin/statistics` - 取得統計資訊

## 開發說明

### 簡訊驗證碼
當前為開發環境，簡訊驗證碼會在控制台輸出，實際生產環境應接入真實的簡訊服務API。

### LIFF App支援
系統已預留LIFF App整合介面，前端可以透過檢測LIFF環境自動取得使用者資訊。

## 注意事項

1. 首次執行請確保已安裝所有依賴
2. 資料庫檔案會在首次執行時自動建立
3. 預設管理員帳戶僅用於開發環境，生產環境請及時修改密碼
4. 簡訊驗證碼在開發環境會輸出到控制台，生產環境需配置真實的簡訊服務
