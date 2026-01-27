import { firestore } from '../firebase.js';

const COLLECTION = 'admins';

export async function findAdminByUsername(username) {
  const snap = await firestore
    .collection(COLLECTION)
    .where('username', '==', username)
    .limit(1)
    .get();

  if (snap.empty) return null;
  const doc = snap.docs[0];
  return { id: doc.id, ...doc.data() };
}

