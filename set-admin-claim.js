
const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');
const readline = require('readline');

// ─── Raw .env.local parser ──────────────────────────────────────────────────────
// dotenv cannot handle multi-line values that contain unescaped inner quotes.
// We read the raw file and extract the JSON block ourselves.

function readRawEnv(envPath) {
  if (!fs.existsSync(envPath)) return {};
  return fs.readFileSync(envPath, 'utf8');
}

function extractJsonBlob(raw, key) {
  // Match:  KEY="{  ...  }"  where the JSON spans multiple lines
  const pattern = new RegExp(key + '="(\\{[\\s\\S]*?\\})"', 'm');
  const match = raw.match(pattern);
  if (match) {
    try {
      return JSON.parse(match[1]);
    } catch (_) { /* try without outer quotes */ }
  }

  // Also try without surrounding quotes:  KEY={ ... }
  const pattern2 = new RegExp(key + '=(\\{[\\s\\S]*?\\})', 'm');
  const match2 = raw.match(pattern2);
  if (match2) {
    try {
      return JSON.parse(match2[1]);
    } catch (_) {}
  }

  return null;
}

function extractEnvValue(raw, key) {
  const pattern = new RegExp(`^${key}="?([^"\\n]+)"?`, 'm');
  const match = raw.match(pattern);
  return match ? match[1].trim() : undefined;
}

// ─── Build service account ──────────────────────────────────────────────────────

function buildServiceAccount(envPath) {
  const raw = readRawEnv(envPath);

  // Strategy 1: Extract the JSON blob directly from the raw file
  const fromJson = extractJsonBlob(raw, 'FIREBASE_SERVICE_ACCOUNT_JSON');
  if (fromJson && fromJson.client_email && fromJson.private_key) {
    console.log(`   Using service account: ${fromJson.client_email}`);
    return fromJson;
  }

  // Strategy 2: Also try the already-injected process.env (works if set externally)
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    try {
      const parsed = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
      if (parsed && parsed.client_email && parsed.private_key) {
        console.log(`   Using service account: ${parsed.client_email}`);
        return parsed;
      }
    } catch (_) {}
  }

  // Strategy 3: Build from individual FIREBASE_* fields (not GOOGLE_*, which is analytics-only)
  const privateKey =
    extractEnvValue(raw, 'FIREBASE_PRIVATE_KEY') || process.env.FIREBASE_PRIVATE_KEY;
  const clientEmail =
    extractEnvValue(raw, 'FIREBASE_CLIENT_EMAIL') || process.env.FIREBASE_CLIENT_EMAIL;
  const projectId =
    extractEnvValue(raw, 'FIREBASE_PROJECT_ID') ||
    extractEnvValue(raw, 'NEXT_PUBLIC_FIREBASE_PROJECT_ID') ||
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

  if (privateKey && clientEmail && projectId) {
    console.log(`   Using service account: ${clientEmail}`);
    return {
      type: 'service_account',
      project_id: projectId,
      private_key: privateKey.replace(/\\n/g, '\n').trim(),
      client_email: clientEmail,
      auth_uri: 'https://accounts.google.com/o/oauth2/auth',
      token_uri: 'https://oauth2.googleapis.com/token',
      auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
      client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${encodeURIComponent(clientEmail)}`,
    };
  }

  return null;
}

// ─── Main ───────────────────────────────────────────────────────────────────────

const ENV_PATH = path.join(__dirname, '.env.local');
const serviceAccount = buildServiceAccount(ENV_PATH);

if (!serviceAccount) {
  console.error('\n❌  Could not find a valid Firebase Admin service account.');
  console.error('   Make sure FIREBASE_SERVICE_ACCOUNT_JSON is set in .env.local');
  console.error('   with the JSON from the Firebase Console > Project Settings > Service Accounts.\n');
  process.exit(1);
}

try {
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
  console.log('✅  Firebase Admin SDK initialized successfully.\n');
} catch (err) {
  console.error('\n❌  Failed to initialize Firebase Admin SDK:', err.message);
  process.exit(1);
}

// ─── Interactive prompt ─────────────────────────────────────────────────────────

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

console.log('──────────────────────────────────────────────────');
console.log('  Admin Claim Tool – Funshine Getaways');
console.log('──────────────────────────────────────────────────');
console.log('  Grants { isAdmin: true } custom claim to a user.');
console.log('  The user must sign out and back in afterwards.\n');

rl.question('  Enter the email address to promote to admin: ', async (email) => {
  const trimmedEmail = (email || '').trim();

  if (!trimmedEmail) {
    console.error('\n❌  No email provided. Exiting.\n');
    rl.close();
    process.exit(1);
  }

  try {
    const user = await admin.auth().getUserByEmail(trimmedEmail);
    await admin.auth().setCustomUserClaims(user.uid, { isAdmin: true });

    // Verify the claim was set
    const updated = await admin.auth().getUser(user.uid);
    const claims = updated.customClaims || {};

    if (claims.isAdmin === true) {
      console.log(`\n✅  Successfully granted admin to: ${trimmedEmail}`);
      console.log(`   UID: ${user.uid}`);
      console.log('   Custom claims:', JSON.stringify(claims));
      console.log('\n   ⚠️  The user must sign out and sign back in for the claim to take effect.\n');
    } else {
      console.warn('\n⚠️  Claim was set but could not be verified. Please check Firebase Console.\n');
    }
  } catch (error) {
    if (error.code === 'auth/user-not-found') {
      console.error(`\n❌  No user found with email: ${trimmedEmail}`);
      console.error('   The user must register in Firebase Authentication first.\n');
    } else {
      console.error('\n❌  Error:', error.message, '\n');
    }
  }

  rl.close();
  process.exit(0);
});
