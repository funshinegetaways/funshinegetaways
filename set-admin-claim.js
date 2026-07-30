
// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' });

const admin = require('firebase-admin');
const readline = require('readline');

// Check if the service account key is available in environment variables
if (!process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
  console.error('Error: The FIREBASE_SERVICE_ACCOUNT_JSON environment variable is not set.');
  console.error('Please ensure your .env.local file is correctly configured.');
  process.exit(1);
}

let serviceAccount;
try {
  serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
} catch (e) {
  console.error('Error: Failed to parse the FIREBASE_SERVICE_ACCOUNT_JSON environment variable.');
  console.error('Please check if it is a valid JSON string.');
  process.exit(1);
}

// Initialize the Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('This script will set a custom claim on a Firebase user, granting them admin privileges.');
rl.question('Enter the email of the user to make an admin: ', async (email) => {
  if (!email) {
    console.error('No email provided. Exiting.');
    rl.close();
    return;
  }

  try {
    const user = await admin.auth().getUserByEmail(email);
    await admin.auth().setCustomUserClaims(user.uid, { isAdmin: true });
    console.log(`Successfully set admin claim for user: ${email}`);
  } catch (error) {
    if (error.code === 'auth/user-not-found') {
      console.error(`Error: No user found with the email: ${email}`);
    } else {
      console.error('An unexpected error occurred:', error.message);
    }
  }

  rl.close();
});
