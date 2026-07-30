
import * as fs from 'fs';
import * as path from 'path';
import * as admin from 'firebase-admin';

// ─── Raw .env.local parser ──────────────────────────────────────────────────────
// Next.js (like dotenv) cannot parse FIREBASE_SERVICE_ACCOUNT_JSON when the value
// is a multi-line JSON block with unescaped inner double-quotes.
// We read the raw file and extract the JSON ourselves as a reliable fallback.

function readEnvFileRaw(): string {
  try {
    const envPath = path.join(process.cwd(), '.env.local');
    if (fs.existsSync(envPath)) {
      return fs.readFileSync(envPath, 'utf8');
    }
  } catch (_) {}
  return '';
}

function extractJsonBlobFromRaw(raw: string, key: string): Record<string, unknown> | null {
  // Match: KEY="{  ...multiline JSON...  }"
  const withQuotes = new RegExp(`${key}="(\\{[\\s\\S]*?\\})"`, 'm');
  const m1 = raw.match(withQuotes);
  if (m1) {
    try { return JSON.parse(m1[1]); } catch (_) {}
  }

  // Match: KEY={ ...multiline JSON... }  (no outer quotes)
  const withoutQuotes = new RegExp(`${key}=(\\{[\\s\\S]*?\\})\\s*$`, 'm');
  const m2 = raw.match(withoutQuotes);
  if (m2) {
    try { return JSON.parse(m2[1]); } catch (_) {}
  }

  return null;
}

// ─── Build service account ──────────────────────────────────────────────────────

function buildServiceAccount(): Record<string, unknown> | null {
  // 1. Try process.env first (works when the env var is correctly formatted)
  const fromEnv = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (fromEnv) {
    const trimmed = fromEnv.trim().replace(/^"([\s\S]*)"$/, '$1');
    try {
      const parsed = JSON.parse(trimmed);
      if (parsed?.client_email && parsed?.private_key) {
        return parsed;
      }
    } catch (_) {}
  }

  // 2. Read raw .env.local and extract the JSON blob directly
  const raw = readEnvFileRaw();
  if (raw) {
    const fromRaw = extractJsonBlobFromRaw(raw, 'FIREBASE_SERVICE_ACCOUNT_JSON');
    if (fromRaw && fromRaw.client_email && fromRaw.private_key) {
      return fromRaw;
    }
  }

  // 3. Fall back to individual FIREBASE_* keys only (NOT GOOGLE_* — those are analytics-only)
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const projectId =
    process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

  if (privateKey && clientEmail && projectId) {
    return {
      type: 'service_account',
      project_id: projectId,
      private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID || '',
      private_key: privateKey.replace(/\\n/g, '\n').trim(),
      client_email: clientEmail,
      client_id: process.env.FIREBASE_CLIENT_ID || '',
      auth_uri: 'https://accounts.google.com/o/oauth2/auth',
      token_uri: 'https://oauth2.googleapis.com/token',
      auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
      client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${encodeURIComponent(clientEmail)}`,
    };
  }

  return null;
}

// ─── Initialize Firebase Admin (singleton) ──────────────────────────────────────

if (!admin.apps.length) {
  const serviceAccount = buildServiceAccount();

  if (serviceAccount) {
    try {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
        databaseURL: `https://${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}.firebaseio.com`,
      });
      console.log('[firebase-admin] Initialized with service account:', serviceAccount.client_email);
    } catch (err) {
      console.error('[firebase-admin] initializeApp failed:', err);
      throw err;
    }
  } else {
    // Last resort: Application Default Credentials (works on GCP/Cloud Run)
    console.warn('[firebase-admin] No service account found — using Application Default Credentials.');
    admin.initializeApp();
  }
}

const db = admin.firestore();

export { admin, db };
