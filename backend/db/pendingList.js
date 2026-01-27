import { firestore } from '../firebase.js';

const COLLECTION = 'pending_list';

export async function createPending(data) {
  const now = new Date().toISOString();
  const docRef = await firestore.collection(COLLECTION).add({
    ...data,
    created_at: now,
    status: data.status || 'pending'
  });
  const doc = await docRef.get();
  return { id: doc.id, ...doc.data() };
}

export async function getPendingById(id) {
  const doc = await firestore.collection(COLLECTION).doc(String(id)).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() };
}

export async function updatePending(id, data) {
  const docRef = firestore.collection(COLLECTION).doc(String(id));
  await docRef.update(data);
  const doc = await docRef.get();
  return { id: doc.id, ...doc.data() };
}

export async function getPendingList({ eventId, status } = {}) {
  let query = firestore.collection(COLLECTION);
  if (status) {
    query = query.where('status', '==', status);
  }
  if (eventId) {
    query = query.where('event_id', '==', String(eventId));
  }
  const snap = await query.orderBy('created_at', 'desc').get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function getPendingByPhoneAndStatus(phone, status) {
  let query = firestore
    .collection(COLLECTION)
    .where('phone', '==', phone)
    .where('status', '==', status);

  const snap = await query.orderBy('created_at', 'desc').get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

