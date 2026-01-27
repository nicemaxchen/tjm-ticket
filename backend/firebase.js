import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let app;

if (!admin.apps.length) {
  const serviceAccountPath =
    process.env.FIREBASE_SERVICE_ACCOUNT_PATH || './firebase-service-account.json';

  const serviceAccount = JSON.parse(
    readFileSync(join(__dirname, serviceAccountPath), 'utf8')
  );

  app = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: process.env.FIREBASE_PROJECT_ID || serviceAccount.project_id
  });
} else {
  app = admin.app();
}

export const firestore = admin.firestore();
export default app;

