# 快速启动指南

## 前置要求

- Node.js 18+ 
- npm 或 yarn

## 一键安装

```bash
npm run install:all
```

这个命令会安装：
- 根目录依赖
- 前台系统依赖 (frontend/)
- 后台系统依赖 (admin/)
- 后端API依赖 (backend/)

## 启动系统

### 方式一：同时启动所有服务（推荐）

```bash
npm run dev
```

这会同时启动：
- 后端API服务: http://localhost:3000
- 前台系统: http://localhost:5173
- 后台管理系统: http://localhost:5174

### 方式二：分别启动

```bash
# 终端1 - 启动后端
npm run dev:backend

# 终端2 - 启动前台
npm run dev:frontend

# 终端3 - 启动后台
npm run dev:admin
```

## 首次使用

1. **启动后端服务**后，系统会自动：
   - 创建SQLite数据库文件 (`backend/database/ticket.db`)
   - 创建所有数据表
   - 创建默认管理员账户
   - 创建示例活动和数据

2. **登录后台管理系统**:
   - 访问 http://localhost:5174
   - 使用默认账户登录：
     - 用户名: `admin`
     - 密码: `admin123`

3. **使用前台系统**:
   - 访问 http://localhost:5173
   - 可以查询报名或进行新的报名登记

## 测试流程

### 1. 后台管理流程

1. 登录后台管理系统
2. 在"活动管理"中创建新活动
3. 在"票券类别"中设置票券限额
4. 查看"待审核名单"并审核通过

### 2. 前台报名流程

1. 访问前台系统
2. 点击"登记报名资料"
3. 选择活动场次和票券类别
4. 填写姓名、Email、手机号
5. 输入验证码（开发环境验证码会在后端控制台显示）
6. 提交报名
7. 如果审核通过，会自动生成票券

### 3. 查询和报到流程

1. 访问前台系统
2. 点击"查询报名资料"
3. 输入手机号和验证码
4. 查看已报名的票券
5. 点击"扫码报到"完成报到

## 开发环境说明

### 短信验证码

在开发环境中，短信验证码会直接输出到后端控制台：
```
📱 短信验证码 [手机号]: 123456 (过期时间: ...)
```

**注意**: 生产环境需要配置真实的短信服务API。

### 数据库

SQLite数据库文件位于 `backend/database/ticket.db`

可以使用SQLite工具查看和管理数据：
```bash
sqlite3 backend/database/ticket.db
```

## 常见问题

### 1. 端口被占用

如果端口被占用，可以修改配置文件：
- 后端: `backend/server.js` 中的 `PORT` 变量
- 前台: `frontend/vite.config.js` 中的 `server.port`
- 后台: `admin/vite.config.js` 中的 `server.port`

### 2. 数据库错误

如果遇到数据库错误，可以删除 `backend/database/ticket.db` 文件，重新启动后端服务会自动创建。

### 3. 依赖安装失败

确保使用正确的Node.js版本（18+），如果仍有问题，可以尝试：
```bash
# 清理缓存
npm cache clean --force

# 删除node_modules后重新安装
rm -rf node_modules frontend/node_modules admin/node_modules backend/node_modules
npm run install:all
```

## 下一步

- 查看 [README.md](README.md) 了解完整的系统架构和功能
- 查看 API 文档了解接口详情
- 根据实际需求修改和扩展系统功能