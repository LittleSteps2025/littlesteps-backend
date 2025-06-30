import { Router } from "express";
import { 
  parentLogin, 
  parentFirebaseLogin,
  verifyOtpAndRegister,
  addParentByAdminController,
  verifyEmailForSignup,
  completeFirebaseRegistrationController,
  resendOtp
} from "../../controllers/parent/parentController.js";

const router = Router();

// Admin routes
router.post('/add-parent', addParentByAdminController);

// Parent sign-up routes
router.post('/verify-email', verifyEmailForSignup);
router.post('/verify-otp', verifyOtpAndRegister);
router.post('/complete-registration', completeFirebaseRegistrationController);
router.post('/resend-otp', resendOtp);

// Login routes
router.post('/login', parentLogin);
router.post('/firebase-login', parentFirebaseLogin);

export default router;