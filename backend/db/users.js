import { firestore } from '../firebase.js';

const COLLECTION = 'users';

export async function findUserByPhone(phone) {
  const snap = await firestore
    .collection(COLLECTION)
    .where('phone', '==', phone)
    .limit(1)
    .get();

  if (snap.empty) return null;
  const doc = snap.docs[0];
  return { id: doc.id, ...doc.data() };
}

export async function createUser(data) {
  const now = new Date().toISOString();
  const docRef = await firestore.collection(COLLECTION).add({
    ...data,
    created_at: now
  });
  const doc = await docRef.get();
  return { id: doc.id, ...doc.data() };
}

export async function updateUser(id, data) {
  const docRef = firestore.collection(COLLECTION).doc(String(id));
  await docRef.update(data);
  const doc = await docRef.get();
  return { id: doc.id, ...doc.data() };
}

