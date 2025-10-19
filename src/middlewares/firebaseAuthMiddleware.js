import admin from 'firebase-admin';
import pool from '../config/db.js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read the service account file using the correct path
const serviceAccount = JSON.parse(
  readFileSync(join(__dirname, '../../firebaseServiceAccount.json'))
);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}




// Public endpoints that don't require authentication
const publicEndpoints = [
  '/api/subscriptions',  // Temporarily public for testing
  '/api/complaints',     // Temporarily public for testing
];

const authenticateUser = async (req, res, next) => {
  console.log('Auth middleware - Request path:', req.path);
  
  // Check if the endpoint is public
  if (publicEndpoints.some(endpoint => req.path.startsWith(endpoint))) {
    console.log('Public endpoint detected - skipping authentication');
    return next();
  }

  console.log('Incoming Authorization header:', req.headers.authorization);
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const idToken = authHeader.split('Bearer ')[1];

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const email = decodedToken.email;

   const userRes = await pool.query('SELECT user_id FROM "user" WHERE email = $1', [email]);
const userId = userRes.rows[0]?.user_id;


    if (!userId) return res.status(403).json({ message: 'User not registered in DB' });

    req.user = { userId, email };
    next();
  } catch (error) {
    console.error('Firebase Auth Error:', error);
    res.status(401).json({ message: 'Invalid token' });
  }
};

export default authenticateUser;
