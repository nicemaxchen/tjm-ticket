import { firestore } from '../firebase.js';

const COLLECTION = 'ticket_categories';

export async function getCategoriesByEvent(eventId, { onlyCollectable = false } = {}) {
  let query = firestore.collection(COLLECTION).where('event_id', '==', String(eventId));
  if (onlyCollectable) {
    query = query.where('allow_collection', '==', true);
  }
  const snap = await query.get();
  const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  // mimic SQL order by sort_order, id
  return list.sort((a, b) => {
    const soA = a.sort_order ?? 0;
    const soB = b.sort_order ?? 0;
    if (soA !== soB) return soA - soB;
    return (a.id || '').localeCompare(b.id || '');
  });
}

export async function getAllCategoriesByEvent(eventId) {
  return getCategoriesByEvent(eventId, { onlyCollectable: false });
}

export async function createCategory(data) {
  const now = new Date().toISOString();
  const docRef = await firestore.collection(COLLECTION).add({
    ...data,
    created_at: now
  });
  const doc = await docRef.get();
  return { id: doc.id, ...doc.data() };
}

export async function updateCategory(id, data) {
  const docRef = firestore.collection(COLLECTION).doc(String(id));
  await docRef.update(data);
  const doc = await docRef.get();
  return { id: doc.id, ...doc.data() };
}

export async function getCategoryById(id) {
  const doc = await firestore.collection(COLLECTION).doc(String(id)).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() };
}

