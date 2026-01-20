import express from 'express';
import { dbRun, dbGet, dbAll } from '../database/init.js';

const router = express.Router();

// 取得所有活動列表
router.get('/events', async (req, res) => {
  try {
    const events = await dbAll(
      'SELECT * FROM events ORDER BY event_date DESC'
    );

    res.json({
      success: true,
      events: events || []
    });
  } catch (error) {
    console.error('取得活動列表错误:', error);
    res.status(500).json({ error: '取得失敗' });
  }
});

// 取得票券類別列表
router.get('/categories', async (req, res) => {
  try {
    const categories = await dbAll(
      'SELECT * FROM ticket_categories ORDER BY id'
    );

    res.json({
      success: true,
      categories: categories || []
    });
  } catch (error) {
    console.error('取得票券類別错误:', error);
    res.status(500).json({ error: '取得失敗' });
  }
});

// 取得活動詳情
router.get('/events/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const event = await dbGet('SELECT * FROM events WHERE id = ?', [id]);

    if (!event) {
      return res.status(404).json({ error: '活動不存在' });
    }

    // 取得该活動的票券類別
    const categories = await dbAll(
      'SELECT * FROM ticket_categories ORDER BY id'
    );

    res.json({
      success: true,
      event: {
        ...event,
        allow_web_collection: Boolean(event.allow_web_collection)
      },
      categories
    });
  } catch (error) {
    console.error('取得活動詳情错误:', error);
    res.status(500).json({ error: '取得失敗' });
  }
});

export default router;