import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { firestore } from '../firebase.js';
import { getAllEvents, createEvent, updateEvent, getEventById } from '../db/events.js';
import {
  getAllCategoriesByEvent,
  getCategoriesByEvent,
  createCategory,
  updateCategory,
  getCategoryById
} from '../db/ticketCategories.js';
import {
  createTicket,
  findTicketsByEvent,
  findAllTickets
} from '../db/ticketsData.js';
import {
  createPending,
  getPendingById,
  getPendingList,
  updatePending
} from '../db/pendingList.js';
import { getRegistrationById, updateRegistrationStatus } from '../db/registrations.js';

const router = express.Router();

// 取得所有活動（後台） - 改用 Firebase
router.get('/events', async (req, res) => {
  try {
    const events = await getAllEvents();

    res.json({
      success: true,
      events: events || []
    });
  } catch (error) {
    console.error('取得活動列表錯誤:', error);
    res.status(500).json({ error: '取得失敗' });
  }
});

// 建立活動 - 改用 Firebase
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
      location = '',
      vip_per_phone_limit = 0,
      general_per_phone_limit = 0
    } = req.body;

    if (!name) {
      return res.status(400).json({ error: '活動名稱不能為空' });
    }

    const event = await createEvent({
      name,
      description,
      event_date,
      ticket_collection_start,
      ticket_collection_end,
      checkin_start,
      checkin_end,
      allow_web_collection: !!allow_web_collection,
      max_attendees: Number(max_attendees) || 0,
      location: location || '',
      vip_per_phone_limit: Number(vip_per_phone_limit) || 0,
      general_per_phone_limit: Number(general_per_phone_limit) || 0
    });

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

// 更新活動 - 改用 Firebase
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
      location,
      vip_per_phone_limit,
      general_per_phone_limit
    } = req.body;

    const maxAttendees = max_attendees !== null && max_attendees !== undefined 
      ? Number(max_attendees) 
      : 0;
    const eventLocation = location !== null && location !== undefined 
      ? String(location) 
      : '';
    const vipLimit = vip_per_phone_limit !== null && vip_per_phone_limit !== undefined 
      ? Number(vip_per_phone_limit) 
      : 0;
    const generalLimit = general_per_phone_limit !== null && general_per_phone_limit !== undefined 
      ? Number(general_per_phone_limit) 
      : 0;

    console.log('更新活動數據:', { id, max_attendees: maxAttendees, location: eventLocation, vip_per_phone_limit: vipLimit, general_per_phone_limit: generalLimit });

    const event = await updateEvent(id, {
      name,
      description,
      event_date,
      ticket_collection_start,
      ticket_collection_end,
      checkin_start,
      checkin_end,
      allow_web_collection: !!allow_web_collection,
      max_attendees: maxAttendees,
      location: eventLocation,
      vip_per_phone_limit: vipLimit,
      general_per_phone_limit: generalLimit
    });

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
    const { event_id } = req.query;
    
    // 先載入活動資料，方便附加 event_name / max_attendees
    const events = await getAllEvents();
    const eventMap = {};
    events.forEach((e) => {
      eventMap[String(e.id)] = e;
    });

    let categories = [];
    if (event_id) {
      categories = await getAllCategoriesByEvent(event_id);
    } else {
      const snap = await firestore.collection('ticket_categories').get();
      categories = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      categories.sort((a, b) => {
        const soA = a.sort_order ?? 0;
        const soB = b.sort_order ?? 0;
        if (soA !== soB) return soA - soB;
        return (a.id || '').localeCompare(b.id || '');
      });
    }

    const enriched = categories.map((c) => {
      const ev = eventMap[String(c.event_id)] || null;
      return {
        ...c,
        event_name: ev?.name || '',
        max_attendees: ev?.max_attendees || 0
      };
    });

    res.json({
      success: true,
      categories: enriched || []
    });
  } catch (error) {
    console.error('取得票券類別錯誤:', error);
    res.status(500).json({ error: '取得失敗' });
  }
});

// 更新類別排序（必須在 /categories/:id 之前）
router.put('/categories/update-order', async (req, res) => {
  try {
    const { categoryIds } = req.body;

    if (!Array.isArray(categoryIds)) {
      return res.status(400).json({ error: 'categoryIds 必須是陣列' });
    }

    for (let i = 0; i < categoryIds.length; i++) {
      await updateCategory(categoryIds[i], { sort_order: i + 1 });
    }

    res.json({
      success: true,
      message: '排序更新成功'
    });
  } catch (error) {
    console.error('更新類別排序錯誤:', error);
    res.status(500).json({ error: '更新排序失敗' });
  }
});

// 建立票券類別
router.post('/categories', async (req, res) => {
  try {
    const {
      event_id,
      name,
      description,
      total_limit,
      daily_limit,
      identity_type,
      requires_review,
      allow_collection
    } = req.body;

    if (!name) {
      return res.status(400).json({ error: '類別名稱不能為空' });
    }

    if (!event_id) {
      return res.status(400).json({ error: '活動ID不能為空' });
    }

    // 驗證活動是否存在
    const event = await getEventById(event_id);
    if (!event) {
      return res.status(400).json({ error: '活動不存在' });
    }

    // 驗證總限額不超過活動上限
    if (event.max_attendees > 0 && total_limit > 0) {
      const existingCategories = await getAllCategoriesByEvent(event_id);
      const currentSum = existingCategories
        .filter((c) => (c.total_limit || 0) > 0)
        .reduce((sum, cat) => sum + (cat.total_limit || 0), 0);
      const newSum = currentSum + total_limit;
      
      if (newSum > event.max_attendees) {
        return res.status(400).json({ 
          error: `所有類別總限額 (${newSum}) 不能超過活動上限 (${event.max_attendees})` 
        });
      }
    }

    // 驗證身份類別
    const validIdentityType = identity_type === 'vip' ? 'vip' : 'general';

    // 取得該活動的最大 sort_order，新類別排在最後
    const existingForEvent = await getAllCategoriesByEvent(event_id);
    const maxOrder =
      existingForEvent.reduce(
        (max, c) => (c.sort_order && c.sort_order > max ? c.sort_order : max),
        0
      ) || 0;
    const newSortOrder = maxOrder + 1;

    const category = await createCategory({
      event_id: String(event_id),
      name,
      description,
      total_limit: total_limit || 0,
      daily_limit: daily_limit || 0,
      identity_type: validIdentityType,
      requires_review: !!requires_review,
      allow_collection:
        allow_collection !== undefined ? !!allow_collection : true,
      sort_order: newSortOrder
    });

    res.json({
      success: true,
      message: '票券類別建立成功',
      category
    });
  } catch (error) {
    console.error('建立票券類別錯誤:', error);
    res.status(500).json({ 
      error: '建立失敗',
      message: error.message || '未知錯誤'
    });
  }
});

// 更新票券類別
router.put('/categories/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      event_id,
      name,
      description,
      total_limit,
      daily_limit,
      identity_type,
      requires_review,
      allow_collection
    } = req.body;

    // 取得當前類別資訊
    const currentCategory = await getCategoryById(id);
    if (!currentCategory) {
      return res.status(404).json({ error: '票券類別不存在' });
    }

    // 確定要使用的 event_id（如果提供了新的，使用新的；否則使用原有的）
    const targetEventId = event_id || currentCategory.event_id;
    
    // 驗證活動是否存在
    const event = await getEventById(targetEventId);
    if (!event) {
      return res.status(400).json({ error: '活動不存在' });
    }

    // 驗證總限額不超過活動上限
    if (event.max_attendees > 0 && total_limit !== undefined && total_limit > 0) {
      const existingCategories = await getAllCategoriesByEvent(targetEventId);
      const currentSum = existingCategories
        .filter((c) => String(c.id) !== String(id))
        .filter((c) => (c.total_limit || 0) > 0)
        .reduce((sum, cat) => sum + (cat.total_limit || 0), 0);
      const newSum = currentSum + total_limit;
      
      if (newSum > event.max_attendees) {
        return res.status(400).json({ 
          error: `所有類別總限額 (${newSum}) 不能超過活動上限 (${event.max_attendees})` 
        });
      }
    }

    const updateData = {};

    if (event_id !== undefined) {
      updateData.event_id = String(event_id);
    }
    if (name !== undefined) {
      updateData.name = name;
    }
    if (description !== undefined) {
      updateData.description = description;
    }
    if (total_limit !== undefined) {
      updateData.total_limit = total_limit || 0;
    }
    if (daily_limit !== undefined) {
      updateData.daily_limit = daily_limit || 0;
    }
    if (identity_type !== undefined) {
      const validIdentityType = identity_type === 'vip' ? 'vip' : 'general';
      updateData.identity_type = validIdentityType;
    }
    if (requires_review !== undefined) {
      updateData.requires_review = !!requires_review;
    }
    if (allow_collection !== undefined) {
      updateData.allow_collection = !!allow_collection;
    }

    const category = await updateCategory(id, updateData);

    res.json({
      success: true,
      message: '票券類別更新成功',
      category
    });
  } catch (error) {
    console.error('更新票券類別錯誤:', error);
    res.status(500).json({ 
      error: '更新失敗',
      message: error.message || '未知錯誤'
    });
  }
});

// 刪除票券類別
router.delete('/categories/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // 檢查類別是否存在
    const category = await getCategoryById(id);
    if (!category) {
      return res.status(404).json({ error: '票券類別不存在' });
    }

    // 檢查是否有相關的報名記錄或票券
    const regSnap = await firestore
      .collection('registrations')
      .where('ticket_category_id', '==', String(id))
      .limit(1)
      .get();
    const ticketSnap = await firestore
      .collection('tickets')
      .where('ticket_category_id', '==', String(id))
      .limit(1)
      .get();

    if (!regSnap.empty || !ticketSnap.empty) {
      return res.status(400).json({ 
        error: '該類別已有報名記錄或票券，無法刪除' 
      });
    }

    await firestore.collection('ticket_categories').doc(String(id)).delete();

    res.json({
      success: true,
      message: '票券類別刪除成功'
    });
  } catch (error) {
    console.error('刪除票券類別錯誤:', error);
    res.status(500).json({ error: '刪除失敗' });
  }
});

// 取得待審核名單
router.get('/pending-list', async (req, res) => {
  try {
    const { event_id } = req.query;

    const pendingList = await getPendingList({
      eventId: event_id || undefined,
      status: 'pending'
    });

    // 補上 event_name / category_name
    const events = await getAllEvents();
    const eventMap = {};
    events.forEach((e) => {
      eventMap[String(e.id)] = e;
    });

    const categoriesSnap = await firestore.collection('ticket_categories').get();
    const categoryMap = {};
    categoriesSnap.docs.forEach((d) => {
      const data = { id: d.id, ...d.data() };
      categoryMap[String(data.id)] = data;
    });

    const enriched = pendingList.map((p) => {
      const ev = eventMap[String(p.event_id)] || null;
      const cat = categoryMap[String(p.ticket_category_id)] || null;
      return {
        ...p,
        event_name: ev?.name || '',
        category_name: cat?.name || ''
      };
    });

    res.json({
      success: true,
      pendingList: enriched || []
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
    const pending = await getPendingById(id);

    if (!pending) {
      return res.status(404).json({ error: '記錄不存在' });
    }

    if (pending.status !== 'pending') {
      return res.status(400).json({ error: '該記錄已處理' });
    }

    // 建立票券
    const tokenId = uuidv4();
    const barcode =
      'TJM' +
      Date.now().toString() +
      Math.floor(Math.random() * 1000)
        .toString()
        .padStart(3, '0');

    const ticket = await createTicket({
      token_id: tokenId,
      registration_id: pending.registration_id,
      user_id: null,
      event_id: String(pending.event_id),
      ticket_category_id: String(pending.ticket_category_id),
      phone: pending.phone,
      barcode,
      collection_method: 'admin',
      checkin_status: 'unchecked'
    });

    // 更新報名與待審核狀態
    await Promise.all([
      updateRegistrationStatus(pending.registration_id, 'confirmed'),
      updatePending(id, {
        status: 'approved',
        reviewed_by: admin_id || null,
        reviewed_at: new Date().toISOString(),
        admin_notes
      })
    ]);

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

    const pending = await getPendingById(id);

    if (!pending) {
      return res.status(404).json({ error: '記錄不存在' });
    }

    await Promise.all([
      updatePending(id, {
        status: 'rejected',
        reviewed_by: admin_id || null,
        reviewed_at: new Date().toISOString(),
        admin_notes
      }),
      updateRegistrationStatus(pending.registration_id, 'rejected')
    ]);

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
      const event = await getEventById(event_id);
      if (!event) {
        return res.status(404).json({ error: '活動不存在' });
      }

      const [ticketsRaw, pendingList] = await Promise.all([
        findTicketsByEvent(event_id),
        getPendingList({ eventId: event_id, status: 'pending' })
      ]);

      const categories = await getAllCategoriesByEvent(event_id);
      const categoryMap = {};
      categories.forEach((c) => {
        categoryMap[String(c.id)] = c;
      });

      // 取得註冊與使用者資料
      const registrationIds = new Set();
      ticketsRaw.forEach((t) => {
        if (t.registration_id) registrationIds.add(String(t.registration_id));
      });

      const registrationsMap = {};
      await Promise.all(
        Array.from(registrationIds).map(async (rid) => {
          const reg = await getRegistrationById(rid);
          if (reg) registrationsMap[String(rid)] = reg;
        })
      );

      const userIds = new Set();
      Object.values(registrationsMap).forEach((reg) => {
        if (reg.user_id) userIds.add(String(reg.user_id));
      });
      const usersMap = {};
      await Promise.all(
        Array.from(userIds).map(async (uid) => {
          const doc = await firestore.collection('users').doc(String(uid)).get();
          if (doc.exists) usersMap[String(uid)] = { id: doc.id, ...doc.data() };
        })
      );

      tickets = ticketsRaw
        .map((t) => {
          const reg = t.registration_id ? registrationsMap[String(t.registration_id)] : null;
          const user = reg && reg.user_id ? usersMap[String(reg.user_id)] : null;
          const cat = categoryMap[String(t.ticket_category_id)] || null;

          return {
            ...t,
            category_name: cat?.name || '',
            identity_type: cat?.identity_type || 'general',
            event_name: event.name,
            max_attendees: event.max_attendees || 0,
            user_name: user?.name || '',
            email: user?.email || '',
            organization_title: user?.organization_title || '',
            registration_time: reg?.created_at || t.created_at
          };
        })
        .sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));

      max_attendees = event.max_attendees || 0;
      pendingCount = pendingList.length;
    } else {
      const [ticketsRaw, allPending] = await Promise.all([
        findAllTickets(),
        getPendingList({ status: 'pending' })
      ]);

      const events = await getAllEvents();
      const eventMap = {};
      events.forEach((e) => {
        eventMap[String(e.id)] = e;
      });

      const categoriesSnap = await firestore.collection('ticket_categories').get();
      const categoryMap = {};
      categoriesSnap.docs.forEach((d) => {
        const data = { id: d.id, ...d.data() };
        categoryMap[String(data.id)] = data;
      });

      const registrationIds = new Set();
      ticketsRaw.forEach((t) => {
        if (t.registration_id) registrationIds.add(String(t.registration_id));
      });

      const registrationsMap = {};
      await Promise.all(
        Array.from(registrationIds).map(async (rid) => {
          const reg = await getRegistrationById(rid);
          if (reg) registrationsMap[String(rid)] = reg;
        })
      );

      const userIds = new Set();
      Object.values(registrationsMap).forEach((reg) => {
        if (reg.user_id) userIds.add(String(reg.user_id));
      });
      const usersMap = {};
      await Promise.all(
        Array.from(userIds).map(async (uid) => {
          const doc = await firestore.collection('users').doc(String(uid)).get();
          if (doc.exists) usersMap[String(uid)] = { id: doc.id, ...doc.data() };
        })
      );

      tickets = ticketsRaw
        .map((t) => {
          const ev = t.event_id ? eventMap[String(t.event_id)] : null;
          const reg = t.registration_id ? registrationsMap[String(t.registration_id)] : null;
          const user = reg && reg.user_id ? usersMap[String(reg.user_id)] : null;
          const cat = categoryMap[String(t.ticket_category_id)] || null;

          return {
            ...t,
            category_name: cat?.name || '',
            identity_type: cat?.identity_type || 'general',
            event_name: ev?.name || '',
            max_attendees: ev?.max_attendees || 0,
            user_name: user?.name || '',
            email: user?.email || '',
            organization_title: user?.organization_title || '',
            registration_time: reg?.created_at || t.created_at
          };
        })
        .sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));

      pendingCount = allPending.length;
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

// 取得同手機號申請數量（已申請 / 審查中），可選 event_id 篩選活動
router.get('/stats/phone-counts', async (req, res) => {
  try {
    const { event_id } = req.query;

    let tickets;
    let pending;

    if (event_id) {
      tickets = await findTicketsByEvent(event_id);
      pending = await getPendingList({ eventId: event_id, status: 'pending' });
    } else {
      tickets = await findAllTickets();
      pending = await getPendingList({ status: 'pending' });
    }

    const phoneCounts = {};
    tickets.forEach((t) => {
      if (!t.phone) return;
      if (!phoneCounts[t.phone]) phoneCounts[t.phone] = { approved: 0, pending: 0 };
      phoneCounts[t.phone].approved += 1;
    });

    pending.forEach((p) => {
      if (!p.phone) return;
      if (!phoneCounts[p.phone]) phoneCounts[p.phone] = { approved: 0, pending: 0 };
      phoneCounts[p.phone].pending += 1;
    });

    res.json({ success: true, phoneCounts });
  } catch (error) {
    console.error('取得同手機申請數錯誤:', error);
    res.status(500).json({ error: '取得失敗' });
  }
});

// 取得所有活動的統計資訊（用於儀表板）
router.get('/statistics/by-events', async (req, res) => {
  try {
    const events = await getAllEvents();
    
    const eventStats = await Promise.all(events.map(async (event) => {
      const tickets = await findTicketsByEvent(event.id);
      const pendingList = await getPendingList({ eventId: event.id, status: 'pending' });

      const categories = await getAllCategoriesByEvent(event.id);
      const categoryMap = {};
      categories.forEach((c) => {
        categoryMap[String(c.id)] = c;
      });
      
      const total = tickets.length;
      const checked = tickets.filter(t => t.checkin_status === 'checked').length;
      const unchecked = total - checked;
      const pendingCount = pendingList.length;

      const vipTickets = tickets.filter((t) => {
        const cat = categoryMap[String(t.ticket_category_id)];
        return (cat?.identity_type || 'general') === 'vip';
      });
      const generalTickets = tickets.filter((t) => {
        const cat = categoryMap[String(t.ticket_category_id)];
        return (cat?.identity_type || 'general') === 'general';
      });
      const vipChecked = vipTickets.filter(t => t.checkin_status === 'checked').length;
      const vipUnchecked = vipTickets.length - vipChecked;
      const generalChecked = generalTickets.filter(t => t.checkin_status === 'checked').length;
      const generalUnchecked = generalTickets.length - generalChecked;
      
      const vipPending = pendingList.filter((p) => {
        const cat = categoryMap[String(p.ticket_category_id)];
        return (cat?.identity_type || 'general') === 'vip';
      }).length;
      const generalPending = pendingList.filter((p) => {
        const cat = categoryMap[String(p.ticket_category_id)];
        return (cat?.identity_type || 'general') === 'general';
      }).length;

      return {
        event_id: event.id,
        event_name: event.name,
        event_date: event.event_date,
        max_attendees: event.max_attendees || 0,
        totalTickets: total,
        checkedTickets: checked,
        uncheckedTickets: unchecked,
        pendingCount: pendingCount,
        // 貴賓身份統計
        vipTotal: vipTickets.length,
        vipChecked: vipChecked,
        vipUnchecked: vipUnchecked,
        vipPending: vipPending,
        // 一般身份統計
        generalTotal: generalTickets.length,
        generalChecked: generalChecked,
        generalUnchecked: generalUnchecked,
        generalPending: generalPending
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