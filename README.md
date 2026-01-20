# TJM Ticket Management System

基于Vue框架的事件票券管理系统，包含前台、后台和API后端。

## 系统架构

### 三个主要系统

1. **查询报名资料系统**（前台）
   - 支持LIFF App和Web App
   - 手机号短信验证
   - 显示已报名票券及条码
   - 现场报到功能

2. **登记报名资料系统**（前台）
   - 支持LIFF App和Web App
   - 用户资料收集（姓名、Email、手机号）
   - 手机号短信验证
   - 自动发送报到条码链接

3. **票券管理配置系统**（后台）
   - 票券类别限额设定
   - 开放取票时间设定
   - 开放报到时间设定
   - 名單审核和开票作业

## 项目结构

```
tjm-ticket/
├── frontend/          # 前台系统（用户端）
├── admin/            # 后台系统（管理端）
├── backend/          # 后端API服务
│   ├── database/     # SQLite数据库
│   └── routes/       # API路由
└── README.md
```

## 安装步骤

1. 安装所有依赖：
```bash
npm run install:all
```

2. 启动开发服务器：
```bash
# 同时启动前台、后台和后端
npm run dev

# 或分别启动
npm run dev:frontend    # 前台 http://localhost:5173
npm run dev:admin       # 后台 http://localhost:5174
npm run dev:backend    # API后端 http://localhost:3000
```

## 技术栈

- **前端框架**: Vue 3 + Vite
- **UI组件库**: Element Plus
- **后端框架**: Express.js
- **数据库**: SQLite
- **路由**: Vue Router

## 功能特性

- ✅ 手机号短信验证
- ✅ LIFF App集成支持
- ✅ 票券条码生成和展示
- ✅ 报到扫码功能
- ✅ 票券限额管理
- ✅ 时间配置管理
- ✅ 名單审核系统

## 默认账户

### 后台管理员
- 用户名: `admin`
- 密码: `admin123`

> 首次启动后端服务时，系统会自动创建默认管理员账户和示例数据

## 数据库说明

系统使用SQLite数据库，数据库文件位于 `backend/database/ticket.db`

### 主要数据表

1. **users** - 用户表
2. **events** - 活动表
3. **ticket_categories** - 票券类别表
4. **registrations** - 报名记录表
5. **tickets** - 票券表
6. **sms_verifications** - 短信验证表
7. **pending_list** - 待审核名单表
8. **admins** - 管理员表

## API端点说明

### 前台API
- `POST /api/auth/sms/send` - 发送短信验证码
- `POST /api/auth/sms/verify` - 验证短信验证码
- `POST /api/registrations/query` - 查询报名资料
- `POST /api/registrations/register` - 登记报名资料
- `GET /api/registrations/ticket/:tokenId` - 获取票券详情
- `POST /api/registrations/checkin` - 报到
- `GET /api/tickets/events` - 获取活动列表
- `GET /api/tickets/categories` - 获取票券类别列表

### 后台API
- `POST /api/auth/admin/login` - 管理员登录
- `GET /api/admin/events` - 获取活动列表（后台）
- `POST /api/admin/events` - 创建活动
- `PUT /api/admin/events/:id` - 更新活动
- `GET /api/admin/categories` - 获取票券类别列表（后台）
- `POST /api/admin/categories` - 创建票券类别
- `PUT /api/admin/categories/:id` - 更新票券类别
- `GET /api/admin/pending-list` - 获取待审核名单
- `POST /api/admin/pending-list/:id/approve` - 审核通过并开票
- `POST /api/admin/pending-list/:id/reject` - 审核拒绝
- `GET /api/admin/statistics` - 获取统计信息

## 开发说明

### 短信验证码
当前为开发环境，短信验证码会在控制台输出，实际生产环境应接入真实的短信服务API。

### LIFF App支持
系统已预留LIFF App集成接口，前端可以通过检测LIFF环境自动获取用户信息。

## 注意事项

1. 首次运行请确保已安装所有依赖
2. 数据库文件会在首次运行时自动创建
3. 默认管理员账户仅用于开发环境，生产环境请及时修改密码
4. 短信验证码在开发环境会输出到控制台，生产环境需配置真实的短信服务