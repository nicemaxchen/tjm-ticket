import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import { createVerification, getLatestUnverified, markVerified } from '../db/smsVerifications.js';
import { findAdminByUsername } from '../db/admins.js';

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

    // 儲存驗證碼到 Firestore
    await createVerification({
      phone,
      code,
      expires_at: expiresAt.toISOString()
    });

    // 實際專案中這裡應該呼叫簡訊服務API
    console.log(`📱 簡訊驗證碼 [${phone}]: ${code} (過期時間: ${expiresAt})`);

    const isDev = !process.env.NODE_ENV || process.env.NODE_ENV !== 'production';
    
    res.json({
      success: true,
      message: '驗證碼已發送',
      code: isDev ? code : undefined
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

    const verification = await getLatestUnverified(phone);

    if (!verification) {
      return res.status(400).json({ error: '驗證碼不存在或已使用' });
    }

    if (new Date(verification.expires_at) < new Date()) {
      return res.status(400).json({ error: '驗證碼已過期' });
    }

    if (verification.code !== code) {
      return res.status(400).json({ error: '驗證碼錯誤' });
    }

    await markVerified(verification.id);

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

    const admin = await findAdminByUsername(username);

    if (!admin) {
      return res.status(401).json({ error: '使用者名稱或密碼錯誤' });
    }

    // 目前資料中密碼是明文，暫維持原本邏輯
    if (admin.password !== password) {
      return res.status(401).json({ error: '使用者名稱或密碼錯誤' });
    }

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