import { firestore } from '../firebase.js';

const COLLECTION = 'sms_verifications';

export async function createVerification({ phone, code, expires_at }) {
  const now = new Date().toISOString();
  const docRef = await firestore.collection(COLLECTION).add({
    phone,
    code,
    verified: false,
    expires_at,
    created_at: now
  });
  const doc = await docRef.get();
  return { id: doc.id, ...doc.data() };
}

export async function getLatestUnverified(phone) {
  const snap = await firestore
    .collection(COLLECTION)
    .where('phone', '==', phone)
    .where('verified', '==', false)
    .orderBy('created_at', 'desc')
    .limit(1)
    .get();

  if (snap.empty) return null;
  const doc = snap.docs[0];
  return { id: doc.id, ...doc.data() };
}

export async function markVerified(id) {
  const docRef = firestore.collection(COLLECTION).doc(String(id));
  await docRef.update({ verified: true });
}

