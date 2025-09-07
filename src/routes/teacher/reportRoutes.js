

import express from 'express';
import { getReports, getallReports, getReportByChildId, updateArrivalTime,updateStatusFields ,submitReport,getReportByReportId} from '../../controllers/teacher/reportController.js';
// import authenticateUser from '../../middlewares/firebaseAuthMiddleware.js';
import authenticateUser from '../../middlewares/firebaseAuthMiddleware.js';




const router = express.Router();


//localhost:5001/api/routes


router.get('/', authenticateUser, getReports);
router.get('/allreports', getallReports);

router.get("/:report_id", getReportByReportId); 

// router.get('/:child_id', getReportByChildId);
router.put('/:report_id/arrival', updateArrivalTime);  // Correct this path

router.put('/child/:report_id/status', updateStatusFields);
// router.get('/guardians/:childId', getGuardiansByChildId);
// reportRoutes.js
// router.put('/:report_id/submit', submitReport);


// router.put("/:report_id/submit", submitReport);
// router.put("/:report_id/submit", authenticateUser, submitReport);
router.put('/:report_id/submit', authenticateUser, submitReport);





export default router;
