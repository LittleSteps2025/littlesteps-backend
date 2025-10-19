import express from 'express';
import { createGuardian , getGuardiansForParent, deleteGuardian} from '../../controllers/parent/guardianController.js';

const router = express.Router();

// GET /api/parent/guardians  - list guardians for logged-in parent
// router.get('/', verifyParentToken, getGuardiansForParent);

// POST /api/parent/guardians - create guardian for logged-in parent
router.post('/guardians', createGuardian);

router.get('/guardians/:parent_id', getGuardiansForParent);

router.delete('/guardians/:guardian_id', deleteGuardian);

export default router;