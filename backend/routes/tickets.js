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
    console.error('取得活動列表錯誤:', error);
    res.status(500).json({ error: '取得失敗' });
  }
});

// 取得票券類別列表
router.get('/categories', async (req, res) => {
  try {
    const { event_id } = req.query;
    
    let sql = 'SELECT * FROM ticket_categories';
    const params = [];
    
    if (event_id) {
      sql += ' WHERE event_id = ?';
      params.push(event_id);
    }
    
    sql += ' ORDER BY id';
    
    const categories = await dbAll(sql, params);

    res.json({
      success: true,
      categories: categories || []
    });
  } catch (error) {
    console.error('取得票券類別錯誤:', error);
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

    // 取得該活動的票券類別
    const categories = await dbAll(
      'SELECT * FROM ticket_categories WHERE event_id = ? ORDER BY id',
      [id]
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
    console.error('取得活動詳情錯誤:', error);
    res.status(500).json({ error: '取得失敗' });
  }
});

export default router;