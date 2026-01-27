import { firestore } from '../firebase.js';

const COLLECTION = 'events';

export async function getAllEvents() {
  const snap = await firestore
    .collection(COLLECTION)
    .orderBy('created_at', 'desc')
    .get();

  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function getEventById(id) {
  const doc = await firestore.collection(COLLECTION).doc(String(id)).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() };
}

export async function createEvent(data) {
  const now = new Date().toISOString();
  const docRef = await firestore.collection(COLLECTION).add({
    ...data,
    created_at: now
  });
  const doc = await docRef.get();
  return { id: doc.id, ...doc.data() };
}

export async function updateEvent(id, data) {
  const docRef = firestore.collection(COLLECTION).doc(String(id));
  await docRef.update({
    ...data
  });
  const doc = await docRef.get();
  return { id: doc.id, ...doc.data() };
}

