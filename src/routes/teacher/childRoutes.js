// routes/teacher/childRoutes.js

import express from 'express';
import {
  getAllChildren,
  getChildById,
  getAllPackages,
  getAllGroups,
  // updateEmergencyNotes,
  getChildrenWithParents,
  saveEmergencyNote,
} from '../../controllers/teacher/childController.js';
import authenticateUser from '../../middlewares/firebaseAuthMiddleware.js';

const router = express.Router();

// ✅ Get all children with optional filters (group, package, month)
// Example: GET /api/child?group=Happy&pkg=Weekend&month=2025-07
router.get('/', getAllChildren);

// ✅ Get a specific child by ID
router.get('/:childId', getChildById);

// ✅ Update emergency notes for a child
// router.put('/:childId/notes', updateEmergencyNotes);

// ✅ Get list of all package names
router.get('/filter/packages', getAllPackages);


router.get('/filter/groups', getAllGroups);

// ✅ Get all children with their parent info (optional for list view)
// Example: GET /api/children/with-parents
router.get('/with-parents', getChildrenWithParents);

router.post('/:childId/notes', authenticateUser, saveEmergencyNote);
// router.get("/package/:child_id", getPackageById);




export default router;
