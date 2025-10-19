import express from 'express';
import { getMedicalRecordsPublic ,  createMedicalRecord, updateMedicalRecord, updateChildMedicalData} from '../../controllers/parent/healthRecordController.js';


const router = express.Router();

// Public: fetch by child id without token
router.get('/public/medical-records/:childId', getMedicalRecordsPublic);
// Protected: create a new medical record for a child (body must include child_id and record_date)
router.post('/medical-records', createMedicalRecord);
// Protected: update an existing medical record (identify by child_id + record_date in body)
router.put('/medical-records/:childId', updateMedicalRecord);

// CORRECT - Should use updateChildMedicalData
router.put('/medical-info/:childId', updateChildMedicalData);


export default router;
