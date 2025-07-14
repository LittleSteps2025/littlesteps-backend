

import express from 'express';
import { getReports, getReportByChildId, updateArrivalTime,updateStatusFields ,submitReport,getReportByReportId} from '../../controllers/teacher/reportController.js';

const router = express.Router();


//localhost:5001/api/routes


router.get('/', getReports);
router.get("/:report_id", getReportByReportId); 

// router.get('/:child_id', getReportByChildId);
router.put('/:report_id/arrival', updateArrivalTime);  // Correct this path

router.put('/child/:report_id/status', updateStatusFields);
// router.get('/guardians/:childId', getGuardiansByChildId);
// reportRoutes.js
// router.put('/:report_id/submit', submitReport);


router.put("/:report_id/submit", submitReport);





export default router;
