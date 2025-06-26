import { Router } from "express";
import { parentLogin } from "../../controllers/parent/parentController.js";

const router = Router();

router.post('/parent-login', parentLogin);

export default router;