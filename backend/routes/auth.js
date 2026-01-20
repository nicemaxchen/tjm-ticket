import express from 'express';
import { dbRun, dbGet } from '../database/init.js';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';

const router = express.Router();

// 發送簡訊驗證碼
router.post('/sms/send', async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({ error: '手機號不能為空' });
    }

    // 產生6位隨機驗證碼
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    
    // 設定過期時間（10分鐘）
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    // 儲存驗證碼到資料庫
    await dbRun(
      'INSERT INTO sms_verifications (phone, code, expires_at) VALUES (?, ?, ?)',
      [phone, code, expiresAt.toISOString()]
    );

    // 實際專案中這裡應該呼叫簡訊服務API
    console.log(`📱 簡訊驗證碼 [${phone}]: ${code} (過期時間: ${expiresAt})`);

    res.json({
      success: true,
      message: '驗證碼已發送',
      // 開發環境回傳驗證碼，生產環境應移除
      code: process.env.NODE_ENV === 'development' ? code : undefined
    });
  } catch (error) {
    console.error('發送驗證碼錯誤:', error);
    res.status(500).json({ error: '發送驗證碼失敗' });
  }
});

// 驗證簡訊驗證碼
router.post('/sms/verify', async (req, res) => {
  try {
    const { phone, code } = req.body;

    if (!phone || !code) {
      return res.status(400).json({ error: '手機號和驗證碼不能為空' });
    }

    // 查詢最新的驗證碼
    const verification = await dbGet(
      `SELECT * FROM sms_verifications 
       WHERE phone = ? AND verified = 0 
       ORDER BY created_at DESC LIMIT 1`,
      [phone]
    );

    if (!verification) {
      return res.status(400).json({ error: '驗證碼不存在或已使用' });
    }

    // 檢查是否過期
    if (new Date(verification.expires_at) < new Date()) {
      return res.status(400).json({ error: '驗證碼已過期' });
    }

    // 驗證碼比對
    if (verification.code !== code) {
      return res.status(400).json({ error: '驗證碼錯誤' });
    }

    // 標記驗證碼為已使用
    await dbRun(
      'UPDATE sms_verifications SET verified = 1 WHERE id = ?',
      [verification.id]
    );

    res.json({
      success: true,
      message: '驗證成功'
    });
  } catch (error) {
    console.error('驗證碼驗證錯誤:', error);
    res.status(500).json({ error: '驗證失敗' });
  }
});

// 管理員登入
router.post('/admin/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: '使用者名稱和密碼不能為空' });
    }

    const admin = await dbGet(
      'SELECT * FROM admins WHERE username = ?',
      [username]
    );

    if (!admin) {
      return res.status(401).json({ error: '使用者名稱或密碼錯誤' });
    }

    // 驗證密碼（這裡簡化處理，實際應使用bcrypt）
    // const isValid = await bcrypt.compare(password, admin.password);
    // 開發環境簡化密碼驗證
    if (admin.password !== password) {
      return res.status(401).json({ error: '使用者名稱或密碼錯誤' });
    }

    // 產生token（簡化處理）
    const token = uuidv4();

    res.json({
      success: true,
      token,
      admin: {
        id: admin.id,
        username: admin.username,
        name: admin.name
      }
    });
  } catch (error) {
    console.error('登入錯誤:', error);
    res.status(500).json({ error: '登入失敗' });
  }
});

export default router;