import express from 'express';
import { dbRun, dbGet, dbAll } from '../database/init.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// 取得所有活動（後台）
router.get('/events', async (req, res) => {
  try {
    const events = await dbAll(
      'SELECT * FROM events ORDER BY created_at DESC'
    );

    res.json({
      success: true,
      events: events || []
    });
  } catch (error) {
    console.error('取得活動列表错误:', error);
    res.status(500).json({ error: '取得失败' });
  }
});

// 建立活動
router.post('/events', async (req, res) => {
  try {
    const {
      name,
      description,
      event_date,
      ticket_collection_start,
      ticket_collection_end,
      checkin_start,
      checkin_end,
      allow_web_collection = false
    } = req.body;

    if (!name) {
      return res.status(400).json({ error: '活動名称不能為空' });
    }

    const result = await dbRun(
      `INSERT INTO events 
       (name, description, event_date, ticket_collection_start, 
        ticket_collection_end, checkin_start, checkin_end, allow_web_collection)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name, description, event_date, ticket_collection_start,
        ticket_collection_end, checkin_start, checkin_end, 
        allow_web_collection ? 1 : 0
      ]
    );

    const event = await dbGet('SELECT * FROM events WHERE id = ?', [result.lastID]);

    res.json({
      success: true,
      message: '活動建立成功',
      event
    });
  } catch (error) {
    console.error('建立活動错误:', error);
    res.status(500).json({ error: '建立失败' });
  }
});

// 更新活動
router.put('/events/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      event_date,
      ticket_collection_start,
      ticket_collection_end,
      checkin_start,
      checkin_end,
      allow_web_collection
    } = req.body;

    await dbRun(
      `UPDATE events 
       SET name = ?, description = ?, event_date = ?, 
           ticket_collection_start = ?, ticket_collection_end = ?,
           checkin_start = ?, checkin_end = ?, allow_web_collection = ?
       WHERE id = ?`,
      [
        name, description, event_date, ticket_collection_start,
        ticket_collection_end, checkin_start, checkin_end,
        allow_web_collection ? 1 : 0, id
      ]
    );

    const event = await dbGet('SELECT * FROM events WHERE id = ?', [id]);

    res.json({
      success: true,
      message: '活動更新成功',
      event
    });
  } catch (error) {
    console.error('更新活動错误:', error);
    res.status(500).json({ error: '更新失敗' });
  }
});

// 取得票券類別列表（後台）
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
    res.status(500).json({ error: '取得失败' });
  }
});

// 建立票券類別
router.post('/categories', async (req, res) => {
  try {
    const {
      name,
      description,
      total_limit,
      daily_limit,
      per_phone_limit
    } = req.body;

    if (!name) {
      return res.status(400).json({ error: '類別名稱不能為空' });
    }

    const result = await dbRun(
      `INSERT INTO ticket_categories 
       (name, description, total_limit, daily_limit, per_phone_limit)
       VALUES (?, ?, ?, ?, ?)`,
      [name, description, total_limit || 0, daily_limit || 0, per_phone_limit || 1]
    );

    const category = await dbGet('SELECT * FROM ticket_categories WHERE id = ?', [result.lastID]);

    res.json({
      success: true,
      message: '票券類別建立成功',
      category
    });
  } catch (error) {
    console.error('建立票券類別错误:', error);
    res.status(500).json({ error: '建立失败' });
  }
});

// 更新票券類別
router.put('/categories/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      total_limit,
      daily_limit,
      per_phone_limit
    } = req.body;

    await dbRun(
      `UPDATE ticket_categories 
       SET name = ?, description = ?, total_limit = ?, 
           daily_limit = ?, per_phone_limit = ?
       WHERE id = ?`,
      [name, description, total_limit || 0, daily_limit || 0, per_phone_limit || 1, id]
    );

    const category = await dbGet('SELECT * FROM ticket_categories WHERE id = ?', [id]);

    res.json({
      success: true,
      message: '票券類別更新成功',
      category
    });
  } catch (error) {
    console.error('更新票券類別错误:', error);
    res.status(500).json({ error: '更新失敗' });
  }
});

// 取得待審核名單
router.get('/pending-list', async (req, res) => {
  try {
    const pendingList = await dbAll(
      `SELECT pl.*, e.name as event_name, tc.name as category_name
       FROM pending_list pl
       JOIN events e ON pl.event_id = e.id
       JOIN ticket_categories tc ON pl.ticket_category_id = tc.id
       WHERE pl.status = 'pending'
       ORDER BY pl.created_at DESC`
    );

    res.json({
      success: true,
      pendingList: pendingList || []
    });
  } catch (error) {
    console.error('取得待審核名單错误:', error);
    res.status(500).json({ error: '取得失败' });
  }
});

// 審核通过並開票
router.post('/pending-list/:id/approve', async (req, res) => {
  try {
    const { id } = req.params;
    const { admin_id, admin_notes } = req.body;

    // 取得待審核記錄
    const pending = await dbGet('SELECT * FROM pending_list WHERE id = ?', [id]);

    if (!pending) {
      return res.status(404).json({ error: '記錄不存在' });
    }

    if (pending.status !== 'pending') {
      return res.status(400).json({ error: '该記錄已處理' });
    }

    // 建立票券
    const tokenId = uuidv4();
    const barcode = 'TJM' + Date.now().toString() + Math.floor(Math.random() * 1000).toString().padStart(3, '0');

    const ticketResult = await dbRun(
      `INSERT INTO tickets 
       (token_id, registration_id, user_id, event_id, ticket_category_id, 
        phone, barcode, collection_method, checkin_status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'unchecked')`,
      [
        tokenId, pending.registration_id, null, pending.event_id,
        pending.ticket_category_id, pending.phone, barcode, 'admin'
      ]
    );

    // 更新報名状态
    await dbRun(
      'UPDATE registrations SET status = ? WHERE id = ?',
      ['confirmed', pending.registration_id]
    );

    // 更新待審核名單状态
    await dbRun(
      `UPDATE pending_list 
       SET status = ?, reviewed_by = ?, reviewed_at = ?, admin_notes = ?
       WHERE id = ?`,
      ['approved', admin_id, new Date().toISOString(), admin_notes, id]
    );

    const ticket = await dbGet('SELECT * FROM tickets WHERE id = ?', [ticketResult.lastID]);

    res.json({
      success: true,
      message: '審核通过，票券已產生',
      ticket
    });
  } catch (error) {
    console.error('審核开票错误:', error);
    res.status(500).json({ error: '審核失败' });
  }
});

// 審核拒绝
router.post('/pending-list/:id/reject', async (req, res) => {
  try {
    const { id } = req.params;
    const { admin_id, admin_notes } = req.body;

    const pending = await dbGet('SELECT * FROM pending_list WHERE id = ?', [id]);

    if (!pending) {
      return res.status(404).json({ error: '記錄不存在' });
    }

    // 更新待審核名單状态
    await dbRun(
      `UPDATE pending_list 
       SET status = ?, reviewed_by = ?, reviewed_at = ?, admin_notes = ?
       WHERE id = ?`,
      ['rejected', admin_id, new Date().toISOString(), admin_notes, id]
    );

    // 更新報名状态
    await dbRun(
      'UPDATE registrations SET status = ? WHERE id = ?',
      ['rejected', pending.registration_id]
    );

    res.json({
      success: true,
      message: '審核已拒絕'
    });
  } catch (error) {
    console.error('審核拒绝错误:', error);
    res.status(500).json({ error: '操作失敗' });
  }
});

// 取得票券统计
router.get('/statistics', async (req, res) => {
  try {
    const { event_id } = req.query;

    let tickets;
    if (event_id) {
      tickets = await dbAll(
        `SELECT t.*, tc.name as category_name, e.name as event_name
         FROM tickets t
         JOIN ticket_categories tc ON t.ticket_category_id = tc.id
         JOIN events e ON t.event_id = e.id
         WHERE t.event_id = ?
         ORDER BY t.created_at DESC`,
        [event_id]
      );
    } else {
      tickets = await dbAll(
        `SELECT t.*, tc.name as category_name, e.name as event_name
         FROM tickets t
         JOIN ticket_categories tc ON t.ticket_category_id = tc.id
         JOIN events e ON t.event_id = e.id
         ORDER BY t.created_at DESC`
      );
    }

    // 統計資訊
    const total = tickets.length;
    const checked = tickets.filter(t => t.checkin_status === 'checked').length;
    const unchecked = total - checked;

    res.json({
      success: true,
      statistics: {
        total,
        checked,
        unchecked
      },
      tickets
    });
  } catch (error) {
    console.error('取得統計資訊错误:', error);
    res.status(500).json({ error: '取得失败' });
  }
});

export default router;