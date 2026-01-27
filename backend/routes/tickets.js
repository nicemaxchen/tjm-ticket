import express from 'express';
import { getAllEvents, getEventById } from '../db/events.js';
import { getCategoriesByEvent } from '../db/ticketCategories.js';

const router = express.Router();

// 取得所有活動列表（前台）
router.get('/events', async (req, res) => {
  try {
    const events = await getAllEvents();
    // 前台原本是依 event_date 排序，這裡在程式端排序
    const sorted = [...events].sort((a, b) => {
      const ad = a.event_date || '';
      const bd = b.event_date || '';
      return bd.localeCompare(ad);
    });

    res.json({
      success: true,
      events: sorted
    });
  } catch (error) {
    console.error('取得活動列表錯誤:', error);
    res.status(500).json({ error: '取得失敗' });
  }
});

// 取得票券類別列表（只返回開放索票的類別）
router.get('/categories', async (req, res) => {
  try {
    const { event_id } = req.query;
    
    if (!event_id) {
      return res.status(400).json({ error: 'event_id 不能為空' });
    }

    const categories = await getCategoriesByEvent(event_id, { onlyCollectable: true });

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

    const event = await getEventById(id);

    if (!event) {
      return res.status(404).json({ error: '活動不存在' });
    }

    // 取得該活動的票券類別（只返回開放索票的類別）
    const categories = await getCategoriesByEvent(id, { onlyCollectable: true });

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