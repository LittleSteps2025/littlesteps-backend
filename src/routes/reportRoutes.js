// import express from 'express';
// import { getReports, getReportByChildId,updateArrivalTime } from '../controllers/reportController.js';

// const router = express.Router();

// router.get('/', getReports);
// router.get('/:childId', getReportByChildId);
// router.put('/reports/:childId/arrival', updateArrivalTime); 


// export default router; // ✅ ES module export



import express from 'express';
import { getReports, getReportByChildId, updateArrivalTime,updateStatusFields ,submitReport} from '../controllers/reportController.js';

const router = express.Router();

router.get('/', getReports);
router.get('/:childId', getReportByChildId);
router.put('/:childId/arrival', updateArrivalTime);  // Correct this path

router.put("/:childId/status", updateStatusFields);
// router.get('/guardians/:childId', getGuardiansByChildId);
// reportRoutes.js
router.put('/:childId/submit', submitReport);



export default router;
