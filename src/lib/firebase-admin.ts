
import * as admin from 'firebase-admin';

function parseServiceAccount(value: string | undefined) {
  if (!value) return null;

  const trimmed = value.trim();
  const normalized = trimmed.startsWith('"') && trimmed.endsWith('"')
    ? trimmed.slice(1, -1)
    : trimmed;

  try {
    return JSON.parse(normalized.replace(/\\n/g, '\n'));
  } catch (error) {
    return null;
  }
}

function buildServiceAccountFromEnv() {
  const fromJson = parseServiceAccount(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
  if (fromJson) {
    return fromJson;
  }

  const privateKey = process.env.GOOGLE_PRIVATE_KEY || process.env.FIREBASE_PRIVATE_KEY;
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL || process.env.FIREBASE_CLIENT_EMAIL;
  const projectId = process.env.GOOGLE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

  if (!privateKey || !clientEmail || !projectId) {
    return null;
  }

  return {
    type: 'service_account',
    project_id: projectId,
    private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID || process.env.FIREBASE_PRIVATE_KEY_ID || '',
    private_key: privateKey.replace(/\\n/g, '\n').trim(),
    client_email: clientEmail,
    client_id: process.env.GOOGLE_CLIENT_ID || process.env.FIREBASE_CLIENT_ID || '',
    auth_uri: 'https://accounts.google.com/o/oauth2/auth',
    token_uri: 'https://oauth2.googleapis.com/token',
    auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
    client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${encodeURIComponent(clientEmail)}`,
  };
}

let serviceAccount: any = null;

serviceAccount = buildServiceAccountFromEnv();

if (!admin.apps.length) {
  if (serviceAccount) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: `https://${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.GOOGLE_PROJECT_ID}.firebaseio.com`,
    });
  } else {
    admin.initializeApp();
  }
}

const db = admin.firestore();

export { admin, db };
