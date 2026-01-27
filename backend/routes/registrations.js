import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getEventById } from '../db/events.js';
import { getCategoryById, getAllCategoriesByEvent } from '../db/ticketCategories.js';
import { findUserByPhone, createUser, updateUser } from '../db/users.js';
import { createRegistration, updateRegistrationStatus, getRegistrationById } from '../db/registrations.js';
import {
  createTicket,
  updateTicket,
  findTicketsByPhone,
  findTicketsByEvent,
  findTicketByTokenOrBarcode
} from '../db/ticketsData.js';
import {
  createPending,
  getPendingById,
  getPendingList,
  getPendingByPhoneAndStatus,
  updatePending
} from '../db/pendingList.js';
import { firestore } from '../firebase.js';

const router = express.Router();

// 查詢報名資料（根據手機號）
router.post('/query', async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({ error: '手機號不能為空' });
    }

    // 已開票票券
    const ticketsRaw = await findTicketsByPhone(phone);

    // 待審查與被拒絕
    const [pendingList, rejectedList] = await Promise.all([
      getPendingByPhoneAndStatus(phone, 'pending'),
      getPendingByPhoneAndStatus(phone, 'rejected')
    ]);

    // 收集需要的 event/category id
    const eventIds = new Set();
    const categoryIds = new Set();

    ticketsRaw.forEach((t) => {
      if (t.event_id) eventIds.add(String(t.event_id));
      if (t.ticket_category_id) categoryIds.add(String(t.ticket_category_id));
    });
    pendingList.forEach((p) => {
      if (p.event_id) eventIds.add(String(p.event_id));
      if (p.ticket_category_id) categoryIds.add(String(p.ticket_category_id));
    });
    rejectedList.forEach((p) => {
      if (p.event_id) eventIds.add(String(p.event_id));
      if (p.ticket_category_id) categoryIds.add(String(p.ticket_category_id));
    });

    const eventIdArr = Array.from(eventIds);
    const categoryIdArr = Array.from(categoryIds);

    const eventsMap = {};
    const categoriesMap = {};

    // 載入所有相關活動
    await Promise.all(
      eventIdArr.map(async (id) => {
        const ev = await getEventById(id);
        if (ev) eventsMap[String(id)] = ev;
      })
    );

    // 載入所有相關類別
    await Promise.all(
      categoryIdArr.map(async (id) => {
        const cat = await getCategoryById(id);
        if (cat) categoriesMap[String(id)] = cat;
      })
    );

    const enrichTicket = (t) => {
      const ev = t.event_id ? eventsMap[String(t.event_id)] : null;
      const cat = t.ticket_category_id ? categoriesMap[String(t.ticket_category_id)] : null;
      return {
        ...t,
        event_name: ev?.name || '',
        event_date: ev?.event_date || null,
        event_location: ev?.location || '',
        category_name: cat?.name || ''
      };
    };

    const tickets = ticketsRaw.map(enrichTicket);

    const enrichPending = (p) => {
      const ev = p.event_id ? eventsMap[String(p.event_id)] : null;
      const cat = p.ticket_category_id ? categoriesMap[String(p.ticket_category_id)] : null;
      return {
        ...p,
        event_name: ev?.name || '',
        event_location: ev?.location || '',
        category_name: cat?.name || '',
        registration_status: p.status
      };
    };

    const pendingRegistrations = pendingList.map(enrichPending);
    const rejectedRegistrations = rejectedList.map((p) => ({
      ...enrichPending(p),
      rejection_reason: p.admin_notes || ''
    }));

    res.json({
      success: true,
      tickets,
      pendingRegistrations,
      rejectedRegistrations
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
      organization_title = null,
      is_from_liff = false,
      liff_user_id = null
    } = req.body;

    if (!event_id || !ticket_category_id || !name || !email || !phone) {
      return res.status(400).json({ 
        error: '必填欄位不完整',
        required: ['event_id', 'ticket_category_id', 'name', 'email', 'phone']
      });
    }

    const event = await getEventById(event_id);
    if (!event) {
      return res.status(404).json({ error: '活動不存在' });
    }

    const category = await getCategoryById(ticket_category_id);
    if (!category) {
      return res.status(404).json({ error: '票券類別不存在' });
    }

    const identityType = category.identity_type || 'general';
    const limitField = identityType === 'vip' ? 'vip_per_phone_limit' : 'general_per_phone_limit';
    const eventLimit = event[limitField] || 0;

    if (eventLimit > 0) {
      // 取得該活動所有票券與待審核，計算該手機在此身份類別的數量
      const [allTicketsForEvent, pendingForEvent] = await Promise.all([
        findTicketsByEvent(event_id),
        getPendingList({ eventId: event_id, status: 'pending' })
      ]);

      const categories = await getAllCategoriesByEvent(event_id);
      const categoryIdentityMap = {};
      categories.forEach((cat) => {
        categoryIdentityMap[String(cat.id)] = cat.identity_type || 'general';
      });

      const phoneTicketCount = allTicketsForEvent.filter((t) => {
        if (t.phone !== phone) return false;
        const idType = categoryIdentityMap[String(t.ticket_category_id)] || 'general';
        return idType === identityType;
      }).length;

      const pendingCount = pendingForEvent.filter((p) => {
        if (p.phone !== phone) return false;
        const idType = categoryIdentityMap[String(p.ticket_category_id)] || 'general';
        return idType === identityType;
      }).length;

      const totalCount = phoneTicketCount + pendingCount;

      if (totalCount >= eventLimit) {
        return res.status(400).json({ 
          error: `該手機號已超過限額（每手機號限${eventLimit}張）` 
        });
      }
    }

    // 使用者
    let user = await findUserByPhone(phone);
    if (!user) {
      user = await createUser({
        liff_user_id,
        name,
        email,
        phone,
        organization_title
      });
    } else {
      user = await updateUser(user.id, {
        name,
        email,
        liff_user_id: liff_user_id || user.liff_user_id,
        organization_title
      });
    }

    // 報名記錄
    const registration = await createRegistration({
      user_id: user.id,
      event_id: String(event_id),
      ticket_category_id: String(ticket_category_id),
      phone,
      is_from_liff: is_from_liff ? 1 : 0,
      status: 'pending'
    });

    // 需要審核：直接進入待審核名單
    if (category.requires_review) {
      await createPending({
        registration_id: registration.id,
        name,
        email,
        phone,
        organization_title,
        event_id: String(event_id),
        ticket_category_id: String(ticket_category_id),
        status: 'pending'
      });

      return res.json({
        success: false,
        message: '報名已提交，需要審核',
        requires_review: true
      });
    }

    const canCollect = await checkTicketCollectionFirebase({
      event,
      category,
      eventId: event_id,
      categoryId: ticket_category_id,
      phone
    });

    let ticket = null;
    let collectionLink = null;

    if (canCollect.success) {
      const tokenId = uuidv4();
      const barcode = generateBarcode();

      ticket = await createTicket({
        token_id: tokenId,
        registration_id: registration.id,
        user_id: user.id,
        event_id: String(event_id),
        ticket_category_id: String(ticket_category_id),
        phone,
        barcode,
        collection_method: 'web',
        checkin_status: 'unchecked'
      });

      await updateRegistrationStatus(registration.id, 'confirmed');

      collectionLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/checkin/${tokenId}`;

      console.log(`📧 發送報到連結到 ${email}: ${collectionLink}`);
      console.log(`📱 發送報到連結到 ${phone}: ${collectionLink}`);
    } else {
      await createPending({
        registration_id: registration.id,
        name,
        email,
        phone,
        organization_title,
        event_id: String(event_id),
        ticket_category_id: String(ticket_category_id),
        status: 'pending'
      });
    }

    res.json({
      success: canCollect.success,
      message: canCollect.success ? '報名成功，票券已產生' : canCollect.reason,
      ticket: ticket
        ? {
            ...ticket,
            checkin_link: collectionLink
          }
        : null,
      requires_review: !canCollect.success
    });
  } catch (error) {
    console.error('登記報名資料錯誤:', error);
    res.status(500).json({ error: '登記失敗' });
  }
});

// Firestore 版檢查是否可以取票
async function checkTicketCollectionFirebase({ event, category, eventId, categoryId, phone }) {
  const now = new Date();

  if (event.ticket_collection_start && new Date(event.ticket_collection_start) > now) {
    return { success: false, reason: '取票尚未開放' };
  }

  if (event.ticket_collection_end && new Date(event.ticket_collection_end) < now) {
    return { success: false, reason: '取票時間已結束' };
  }

  if (!event.allow_web_collection) {
    return { success: false, reason: '該活動不開放Web直接取票' };
  }

  // 類別餘票
  const allTicketsForEvent = await findTicketsByEvent(eventId);
  const issuedCount = allTicketsForEvent.filter(
    (t) => String(t.ticket_category_id) === String(categoryId)
  ).length;

  if (category.total_limit > 0 && issuedCount >= category.total_limit) {
    return { success: false, reason: '該類票券已售罄' };
  }

  const identityType = category.identity_type || 'general';
  const limitField = identityType === 'vip' ? 'vip_per_phone_limit' : 'general_per_phone_limit';
  const eventLimit = event[limitField] || 0;

  if (eventLimit > 0) {
    const pendingForEvent = await getPendingList({ eventId, status: 'pending' });

    const categories = await getAllCategoriesByEvent(eventId);
    const categoryIdentityMap = {};
    categories.forEach((cat) => {
      categoryIdentityMap[String(cat.id)] = cat.identity_type || 'general';
    });

    const phoneTicketCount = allTicketsForEvent.filter((t) => {
      if (t.phone !== phone) return false;
      const idType = categoryIdentityMap[String(t.ticket_category_id)] || 'general';
      return idType === identityType;
    }).length;

    const pendingCount = pendingForEvent.filter((p) => {
      if (p.phone !== phone) return false;
      const idType = categoryIdentityMap[String(p.ticket_category_id)] || 'general';
      return idType === identityType;
    }).length;

    const totalCount = phoneTicketCount + pendingCount;

    if (totalCount >= eventLimit) {
      const identityTypeName = identityType === 'vip' ? '貴賓' : '一般';
      return {
        success: false,
        reason: `該手機號已超過${identityTypeName}身份限額（每手機號限${eventLimit}張）`
      };
    }
  }

  return { success: true };
}

// 產生條碼
function generateBarcode() {
  return (
    'TJM' +
    Date.now().toString() +
    Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, '0')
  );
}

// 取得票券詳情（根據token_id）
router.get('/ticket/:tokenId', async (req, res) => {
  try {
    const { tokenId } = req.params;

    const ticket = await findTicketByTokenOrBarcode({ tokenId, barcode: null });

    if (!ticket) {
      return res.status(404).json({ error: '票券不存在' });
    }

    const [event, category] = await Promise.all([
      ticket.event_id ? getEventById(ticket.event_id) : null,
      ticket.ticket_category_id ? getCategoryById(ticket.ticket_category_id) : null
    ]);

    let user = null;
    if (ticket.user_id) {
      const doc = await firestore.collection('users').doc(String(ticket.user_id)).get();
      if (doc.exists) user = { id: doc.id, ...doc.data() };
    }

    const enriched = {
      ...ticket,
      event_name: event?.name || '',
      event_date: event?.event_date || null,
      checkin_start: event?.checkin_start || null,
      checkin_end: event?.checkin_end || null,
      event_location: event?.location || '',
      max_attendees: event?.max_attendees || 0,
      category_name: category?.name || '',
      user_name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || ticket.phone
    };

    res.json({
      success: true,
      ticket: enriched
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

    const ticket = await findTicketByTokenOrBarcode({
      tokenId: token_id || '',
      barcode: barcode || ''
    });

    if (!ticket) {
      return res.status(404).json({ error: '票券不存在' });
    }

    const event = ticket.event_id ? await getEventById(ticket.event_id) : null;

    if (!event) {
      return res.status(400).json({ error: '對應活動不存在' });
    }

    if (ticket.checkin_status === 'checked') {
      return res.json({
        success: false,
        message: '該票券已完成報到',
        ticket
      });
    }

    const now = new Date();
    if (event.checkin_start && new Date(event.checkin_start) > now) {
      return res.status(400).json({ error: '報到尚未開放' });
    }

    if (event.checkin_end && new Date(event.checkin_end) < now) {
      return res.status(400).json({ error: '報到時間已結束' });
    }

    const updated = await updateTicket(ticket.id, {
      checkin_status: 'checked',
      checkin_time: now.toISOString()
    });

    res.json({
      success: true,
      message: '報到成功',
      ticket: updated
    });
  } catch (error) {
    console.error('報到錯誤:', error);
    res.status(500).json({ error: '報到失敗' });
  }
});

export default router;
