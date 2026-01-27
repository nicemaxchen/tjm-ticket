import { firestore } from '../firebase.js';

const COLLECTION = 'tickets';

export async function createTicket(data) {
  const now = new Date().toISOString();
  const docRef = await firestore.collection(COLLECTION).add({
    ...data,
    created_at: now
  });
  const doc = await docRef.get();
  return { id: doc.id, ...doc.data() };
}

export async function updateTicket(id, data) {
  const docRef = firestore.collection(COLLECTION).doc(String(id));
  await docRef.update(data);
  const doc = await docRef.get();
  return { id: doc.id, ...doc.data() };
}

export async function findTicketsByPhone(phone) {
  const snap = await firestore
    .collection(COLLECTION)
    .where('phone', '==', phone)
    .orderBy('created_at', 'desc')
    .get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function findTicketsByEvent(eventId) {
  const snap = await firestore
    .collection(COLLECTION)
    .where('event_id', '==', String(eventId))
    .get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function findAllTickets() {
  const snap = await firestore.collection(COLLECTION).get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function findTicketByTokenOrBarcode({ tokenId, barcode }) {
  if (tokenId) {
    const snap = await firestore
      .collection(COLLECTION)
      .where('token_id', '==', tokenId)
      .limit(1)
      .get();
    if (!snap.empty) {
      const doc = snap.docs[0];
      return { id: doc.id, ...doc.data() };
    }
  }
  if (barcode) {
    const snap = await firestore
      .collection(COLLECTION)
      .where('barcode', '==', barcode)
      .limit(1)
      .get();
    if (!snap.empty) {
      const doc = snap.docs[0];
      return { id: doc.id, ...doc.data() };
    }
  }
  return null;
}

