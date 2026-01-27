import { firestore } from '../firebase.js';

const COLLECTION = 'registrations';

export async function createRegistration(data) {
  const now = new Date().toISOString();
  const docRef = await firestore.collection(COLLECTION).add({
    ...data,
    created_at: now
  });
  const doc = await docRef.get();
  return { id: doc.id, ...doc.data() };
}

export async function updateRegistrationStatus(id, status) {
  const docRef = firestore.collection(COLLECTION).doc(String(id));
  await docRef.update({ status });
  const doc = await docRef.get();
  return { id: doc.id, ...doc.data() };
}

export async function getRegistrationById(id) {
  const doc = await firestore.collection(COLLECTION).doc(String(id)).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() };
}

