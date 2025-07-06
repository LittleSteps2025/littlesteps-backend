import express from 'express';
import { parentLogin, verifyParentToken } from '../controllers/parent/parentController.js';

const router = express.Router();

// Parent authentication routes
router.post('/parent-login', parentLogin);

// Example of a protected route (you can use this pattern for other parent endpoints)
router.get('/profile', verifyParentToken, (req, res) => {
  res.json({
    success: true,
    message: 'Parent profile access granted',
    data: {
      parentId: req.parent.id,
      email: req.parent.email
    }
  });
});

export default router;
