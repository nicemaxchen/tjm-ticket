import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import ticketRoutes from './routes/tickets.js';
import registrationRoutes from './routes/registrations.js';
import adminRoutes from './routes/admin.js';
import authRoutes from './routes/auth.js';
import { initDatabase } from './database/init.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// 中介軟體
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 初始化資料庫
initDatabase();

// 初始化範例資料（僅在開發環境）
if (process.env.NODE_ENV !== 'production') {
  import('./database/seed.js').then(({ seedDatabase }) => {
    setTimeout(() => {
      seedDatabase();
    }, 1000); // 延遲1秒執行，確保表已建立
  });
}

// 路由
app.use('/api/tickets', ticketRoutes);
app.use('/api/registrations', registrationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/auth', authRoutes);

// 健康檢查
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'TJM Ticket API Server' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});