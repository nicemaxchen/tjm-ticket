import express from 'express';
import { dbRun, dbGet, dbAll } from '../database/init.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// 查詢報名資料（根據手機號）
router.post('/query', async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({ error: '手機號不能為空' });
    }

    // 查詢該手機號下的所有已報名票券
    const tickets = await dbAll(
      `SELECT t.*, e.name as event_name, e.event_date, 
              tc.name as category_name,
              u.name as user_name, u.email
       FROM tickets t
       JOIN events e ON t.event_id = e.id
       JOIN ticket_categories tc ON t.ticket_category_id = tc.id
       LEFT JOIN users u ON t.user_id = u.id
       WHERE t.phone = ?
       ORDER BY t.created_at DESC`,
      [phone]
    );

    res.json({
      success: true,
      tickets: tickets || []
    });
  } catch (error) {
    console.error('查詢報名資料錯誤:', error);
    res.status(500).json({ error: '查詢失敗' });
  }
});

// 登記報名資料
router.post('/register', async (req, res) => {
  try {
    const { 
      event_id, 
      ticket_category_id, 
      name, 
      email, 
      phone,
      is_from_liff = false,
      liff_user_id = null
    } = req.body;

    // 驗證必填欄位
    if (!event_id || !ticket_category_id || !name || !email || !phone) {
      return res.status(400).json({ 
        error: '必填欄位不完整',
        required: ['event_id', 'ticket_category_id', 'name', 'email', 'phone']
      });
    }

    // 檢查活動是否存在
    const event = await dbGet('SELECT * FROM events WHERE id = ?', [event_id]);
    if (!event) {
      return res.status(404).json({ error: '活動不存在' });
    }

    // 檢查票券類別是否存在
    const category = await dbGet(
      'SELECT * FROM ticket_categories WHERE id = ?', 
      [ticket_category_id]
    );
    if (!category) {
      return res.status(404).json({ error: '票券類別不存在' });
    }

    // 建立或取得使用者
    let user = await dbGet('SELECT * FROM users WHERE phone = ?', [phone]);
    
    if (!user) {
      const result = await dbRun(
        'INSERT INTO users (liff_user_id, name, email, phone) VALUES (?, ?, ?, ?)',
        [liff_user_id, name, email, phone]
      );
      user = await dbGet('SELECT * FROM users WHERE id = ?', [result.lastID]);
    } else {
      // 更新使用者資訊
      await dbRun(
        'UPDATE users SET name = ?, email = ?, liff_user_id = ? WHERE id = ?',
        [name, email, liff_user_id || user.liff_user_id, user.id]
      );
      user = await dbGet('SELECT * FROM users WHERE id = ?', [user.id]);
    }

    // 建立報名記錄
    const regResult = await dbRun(
      `INSERT INTO registrations 
       (user_id, event_id, ticket_category_id, phone, is_from_liff, status)
       VALUES (?, ?, ?, ?, ?, 'pending')`,
      [user.id, event_id, ticket_category_id, phone, is_from_liff ? 1 : 0]
    );

    const registrationId = regResult.lastID;

    // 檢查是否可以直接取票
    const canCollect = await checkTicketCollection(
      event_id, 
      ticket_category_id, 
      phone,
      event
    );

    let ticket = null;
    let collectionLink = null;

    if (canCollect.success) {
      // 建立票券
      const tokenId = uuidv4();
      const barcode = generateBarcode();
      
      const ticketResult = await dbRun(
        `INSERT INTO tickets 
         (token_id, registration_id, user_id, event_id, ticket_category_id, 
          phone, barcode, collection_method, checkin_status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'unchecked')`,
        [tokenId, registrationId, user.id, event_id, ticket_category_id, 
         phone, barcode, 'web']
      );

      ticket = await dbGet(
        'SELECT * FROM tickets WHERE id = ?',
        [ticketResult.lastID]
      );

      // 更新報名狀態
      await dbRun(
        'UPDATE registrations SET status = ? WHERE id = ?',
        ['confirmed', registrationId]
      );

      // 產生報到連結
      collectionLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/checkin/${tokenId}`;

      // 發送郵件和簡訊（模擬）
      console.log(`📧 發送報到連結到 ${email}: ${collectionLink}`);
      console.log(`📱 發送報到連結到 ${phone}: ${collectionLink}`);
    } else {
      // 加入待審核名單
      await dbRun(
        `INSERT INTO pending_list 
         (registration_id, name, email, phone, event_id, ticket_category_id, status)
         VALUES (?, ?, ?, ?, ?, ?, 'pending')`,
        [registrationId, name, email, phone, event_id, ticket_category_id]
      );
    }

    res.json({
      success: canCollect.success,
      message: canCollect.success ? '報名成功，票券已產生' : canCollect.reason,
      ticket: ticket ? {
        ...ticket,
        checkin_link: collectionLink
      } : null,
      requires_review: !canCollect.success
    });

  } catch (error) {
    console.error('登記報名資料錯誤:', error);
    res.status(500).json({ error: '登記失敗' });
  }
});

// 檢查是否可以取票
async function checkTicketCollection(eventId, categoryId, phone, event) {
  // 檢查開放取票時間
  const now = new Date();
  
  if (event.ticket_collection_start && new Date(event.ticket_collection_start) > now) {
    return { success: false, reason: '取票尚未開放' };
  }

  if (event.ticket_collection_end && new Date(event.ticket_collection_end) < now) {
    return { success: false, reason: '取票時間已結束' };
  }

  // 檢查是否允許Web取票
  if (!event.allow_web_collection) {
    return { success: false, reason: '該活動不開放Web直接取票' };
  }

  // 檢查票券類別餘票
  const category = await dbGet(
    'SELECT * FROM ticket_categories WHERE id = ?',
    [categoryId]
  );

  const issuedCount = await dbGet(
    `SELECT COUNT(*) as count FROM tickets 
     WHERE ticket_category_id = ? AND event_id = ?`,
    [categoryId, eventId]
  );

  if (category.total_limit > 0 && issuedCount.count >= category.total_limit) {
    return { success: false, reason: '該類票券已售罄' };
  }

  // 檢查同一手機號是否超過限額
  const phoneTicketCount = await dbGet(
    `SELECT COUNT(*) as count FROM tickets 
     WHERE phone = ? AND ticket_category_id = ? AND event_id = ?`,
    [phone, categoryId, eventId]
  );

  if (category.per_phone_limit > 0 && 
      phoneTicketCount.count >= category.per_phone_limit) {
    return { 
      success: false, 
      reason: `該手機號已超過限額（每手機號限${category.per_phone_limit}張）` 
    };
  }

  return { success: true };
}

// 產生條碼
function generateBarcode() {
  return 'TJM' + Date.now().toString() + Math.floor(Math.random() * 1000).toString().padStart(3, '0');
}

// 取得票券詳情（根據token_id）
router.get('/ticket/:tokenId', async (req, res) => {
  try {
    const { tokenId } = req.params;

    const ticket = await dbGet(
      `SELECT t.*, e.name as event_name, e.event_date, e.checkin_start, e.checkin_end,
              tc.name as category_name,
              u.name as user_name, u.email, u.phone
       FROM tickets t
       JOIN events e ON t.event_id = e.id
       JOIN ticket_categories tc ON t.ticket_category_id = tc.id
       LEFT JOIN users u ON t.user_id = u.id
       WHERE t.token_id = ?`,
      [tokenId]
    );

    if (!ticket) {
      return res.status(404).json({ error: '票券不存在' });
    }

    res.json({
      success: true,
      ticket
    });
  } catch (error) {
    console.error('取得票券詳情錯誤:', error);
    res.status(500).json({ error: '取得失敗' });
  }
});

// 報到（掃碼報到）
router.post('/checkin', async (req, res) => {
  try {
    const { token_id, barcode } = req.body;

    if (!token_id && !barcode) {
      return res.status(400).json({ error: 'token_id或barcode不能為空' });
    }

    // 查詢票券
    const ticket = await dbGet(
      `SELECT t.*, e.name as event_name, e.checkin_start, e.checkin_end
       FROM tickets t
       JOIN events e ON t.event_id = e.id
       WHERE t.token_id = ? OR t.barcode = ?`,
      [token_id || '', barcode || '']
    );

    if (!ticket) {
      return res.status(404).json({ error: '票券不存在' });
    }

    // 檢查是否已報到
    if (ticket.checkin_status === 'checked') {
      return res.json({
        success: false,
        message: '該票券已完成報到',
        ticket
      });
    }

    // 檢查報到時間
    const now = new Date();
    if (ticket.checkin_start && new Date(ticket.checkin_start) > now) {
      return res.status(400).json({ error: '報到尚未開放' });
    }

    if (ticket.checkin_end && new Date(ticket.checkin_end) < now) {
      return res.status(400).json({ error: '報到時間已結束' });
    }

    // 更新報到狀態
    await dbRun(
      'UPDATE tickets SET checkin_status = ?, checkin_time = ? WHERE id = ?',
      ['checked', now.toISOString(), ticket.id]
    );

    const updatedTicket = await dbGet(
      'SELECT * FROM tickets WHERE id = ?',
      [ticket.id]
    );

    res.json({
      success: true,
      message: '報到成功',
      ticket: updatedTicket
    });
  } catch (error) {
    console.error('報到錯誤:', error);
    res.status(500).json({ error: '報到失敗' });
  }
});

export default router;
