
import * as admin from 'firebase-admin';

let serviceAccount: any = null;

if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
  try {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON as string);
  } catch (error) {
    console.warn('Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON; server admin routes will be unavailable.', error);
  }
}

if (!admin.apps.length) {
  if (serviceAccount) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: `https://${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}.firebaseio.com`,
    });
  } else {
    admin.initializeApp();
  }
}

const db = admin.firestore();

export { admin, db };
