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
    console.error('取得活動列表錯誤:', error);
    res.status(500).json({ error: '取得失敗' });
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
      allow_web_collection = false,
      max_attendees = 0,
      location = ''
    } = req.body;

    if (!name) {
      return res.status(400).json({ error: '活動名稱不能為空' });
    }

    const result = await dbRun(
      `INSERT INTO events 
       (name, description, event_date, ticket_collection_start, 
        ticket_collection_end, checkin_start, checkin_end, allow_web_collection,
        max_attendees, location)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name, description, event_date, ticket_collection_start,
        ticket_collection_end, checkin_start, checkin_end, 
        allow_web_collection ? 1 : 0, max_attendees || 0, location || ''
      ]
    );

    const event = await dbGet('SELECT * FROM events WHERE id = ?', [result.lastID]);

    res.json({
      success: true,
      message: '活動建立成功',
      event
    });
  } catch (error) {
    console.error('建立活動錯誤:', error);
    res.status(500).json({ error: '建立失敗' });
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
      allow_web_collection,
      max_attendees,
      location
    } = req.body;

    // 確保資料類型正確
    const maxAttendees = max_attendees !== null && max_attendees !== undefined 
      ? Number(max_attendees) 
      : 0;
    const eventLocation = location !== null && location !== undefined 
      ? String(location) 
      : '';

    console.log('更新活動數據:', { id, max_attendees: maxAttendees, location: eventLocation }); // 調試用

    await dbRun(
      `UPDATE events 
       SET name = ?, description = ?, event_date = ?, 
           ticket_collection_start = ?, ticket_collection_end = ?,
           checkin_start = ?, checkin_end = ?, allow_web_collection = ?,
           max_attendees = ?, location = ?
       WHERE id = ?`,
      [
        name, description, event_date, ticket_collection_start,
        ticket_collection_end, checkin_start, checkin_end,
        allow_web_collection ? 1 : 0, maxAttendees, eventLocation, id
      ]
    );

    const event = await dbGet('SELECT * FROM events WHERE id = ?', [id]);

    res.json({
      success: true,
      message: '活動更新成功',
      event
    });
  } catch (error) {
    console.error('更新活動錯誤:', error);
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
    console.error('取得票券類別錯誤:', error);
    res.status(500).json({ error: '取得失敗' });
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
    console.error('建立票券類別錯誤:', error);
    res.status(500).json({ error: '建立失敗' });
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
    console.error('更新票券類別錯誤:', error);
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
    console.error('取得待審核名單錯誤:', error);
    res.status(500).json({ error: '取得失敗' });
  }
});

// 審核通過並開票
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
      return res.status(400).json({ error: '該記錄已處理' });
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

    // 更新報名狀態
    await dbRun(
      'UPDATE registrations SET status = ? WHERE id = ?',
      ['confirmed', pending.registration_id]
    );

    // 更新待審核名單狀態
    await dbRun(
      `UPDATE pending_list 
       SET status = ?, reviewed_by = ?, reviewed_at = ?, admin_notes = ?
       WHERE id = ?`,
      ['approved', admin_id, new Date().toISOString(), admin_notes, id]
    );

    const ticket = await dbGet('SELECT * FROM tickets WHERE id = ?', [ticketResult.lastID]);

    res.json({
      success: true,
      message: '審核通過，票券已產生',
      ticket
    });
  } catch (error) {
    console.error('審核開票錯誤:', error);
    res.status(500).json({ error: '審核失敗' });
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

    // 更新待審核名單狀態
    await dbRun(
      `UPDATE pending_list 
       SET status = ?, reviewed_by = ?, reviewed_at = ?, admin_notes = ?
       WHERE id = ?`,
      ['rejected', admin_id, new Date().toISOString(), admin_notes, id]
    );

    // 更新報名狀態
    await dbRun(
      'UPDATE registrations SET status = ? WHERE id = ?',
      ['rejected', pending.registration_id]
    );

    res.json({
      success: true,
      message: '審核已拒絕'
    });
  } catch (error) {
    console.error('審核拒绝錯誤:', error);
    res.status(500).json({ error: '操作失敗' });
  }
});

// 取得票券統計
router.get('/statistics', async (req, res) => {
  try {
    const { event_id } = req.query;

    let tickets;
    let max_attendees = 0;
    let pendingCount = 0;

    if (event_id) {
      tickets = await dbAll(
        `SELECT t.*, tc.name as category_name, e.name as event_name, e.max_attendees,
                COALESCE(u.name, pl.name) as user_name,
                COALESCE(u.email, pl.email) as email,
                COALESCE(r.created_at, pl.created_at) as registration_time
         FROM tickets t
         JOIN ticket_categories tc ON t.ticket_category_id = tc.id
         JOIN events e ON t.event_id = e.id
         LEFT JOIN users u ON t.user_id = u.id
         LEFT JOIN registrations r ON t.registration_id = r.id
         LEFT JOIN pending_list pl ON r.id = pl.registration_id
         WHERE t.event_id = ?
         ORDER BY t.created_at DESC`,
        [event_id]
      );
      
      // 取得活動的票數上限
      const event = await dbGet('SELECT max_attendees FROM events WHERE id = ?', [event_id]);
      max_attendees = event ? (event.max_attendees || 0) : 0;
      
      // 取得該活動的待審核數
      const pendingCountResult = await dbGet(
        `SELECT COUNT(*) as count FROM pending_list WHERE event_id = ? AND status = 'pending'`,
        [event_id]
      );
      pendingCount = pendingCountResult ? (pendingCountResult.count || 0) : 0;
    } else {
      tickets = await dbAll(
        `SELECT t.*, tc.name as category_name, e.name as event_name, e.max_attendees,
                COALESCE(u.name, pl.name) as user_name,
                COALESCE(u.email, pl.email) as email,
                COALESCE(r.created_at, pl.created_at) as registration_time
         FROM tickets t
         JOIN ticket_categories tc ON t.ticket_category_id = tc.id
         JOIN events e ON t.event_id = e.id
         LEFT JOIN users u ON t.user_id = u.id
         LEFT JOIN registrations r ON t.registration_id = r.id
         LEFT JOIN pending_list pl ON r.id = pl.registration_id
         ORDER BY t.created_at DESC`
      );
      
      // 取得所有待審核數
      const pendingCountResult = await dbGet(
        `SELECT COUNT(*) as count FROM pending_list WHERE status = 'pending'`
      );
      pendingCount = pendingCountResult ? (pendingCountResult.count || 0) : 0;
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
        unchecked,
        max_attendees,
        pendingCount
      },
      tickets
    });
  } catch (error) {
    console.error('取得統計資訊錯誤:', error);
    res.status(500).json({ error: '取得失敗' });
  }
});

// 取得所有活動的統計資訊（用於儀表板）
router.get('/statistics/by-events', async (req, res) => {
  try {
    const events = await dbAll('SELECT * FROM events ORDER BY event_date DESC');
    
    const eventStats = await Promise.all(events.map(async (event) => {
      const tickets = await dbAll(
        `SELECT * FROM tickets WHERE event_id = ?`,
        [event.id]
      );
      
      const pendingCountResult = await dbGet(
        `SELECT COUNT(*) as count FROM pending_list WHERE event_id = ? AND status = 'pending'`,
        [event.id]
      );

      const total = tickets.length;
      const checked = tickets.filter(t => t.checkin_status === 'checked').length;
      const unchecked = total - checked;
      const pendingCount = pendingCountResult ? (pendingCountResult.count || 0) : 0;

      return {
        event_id: event.id,
        event_name: event.name,
        event_date: event.event_date,
        max_attendees: event.max_attendees || 0,
        totalTickets: total,
        checkedTickets: checked,
        uncheckedTickets: unchecked,
        pendingCount: pendingCount
      };
    }));

    res.json({
      success: true,
      eventStats
    });
  } catch (error) {
    console.error('取得活動統計資訊錯誤:', error);
    res.status(500).json({ error: '取得失敗' });
  }
});

export default router;