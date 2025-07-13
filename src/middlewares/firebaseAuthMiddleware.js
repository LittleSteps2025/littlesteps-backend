import admin from 'firebase-admin';
import pool from '../config/db.js'; // Use .js extension for ES modules

// Initialize Firebase Admin (only once in the app)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(), // or use service account
  });
}

const authenticateUser = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const idToken = authHeader.split('Bearer ')[1];

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const email = decodedToken.email;

    const userRes = await pool.query('SELECT user_id FROM users WHERE email = $1', [email]);
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
