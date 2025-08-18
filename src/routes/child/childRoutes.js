// File: routes/child/childRoutes.js
<<<<<<< HEAD
import express from 'express';
import childController from '../../controllers/child/childController.js';

const router = express.Router();

router.get('/', childController.getAll);
router.get('/:id', childController.getById);
router.post('/', childController.create);
router.put('/:id', childController.update);
router.delete('/:id', childController.delete);
=======
import express from "express";
import childController from "../../controllers/child/childController.js";

const router = express.Router();

// IMPORTANT: More specific routes must come BEFORE parameterized routes
router.get("/packages", childController.getPackages);
router.get("/groups", childController.getGroups); // Move this BEFORE /:id
router.get("/parent", childController.get_all_parents); // Move this BEFORE /:id
router.post("/check-parent-nic", childController.checkVerifiedParent); // Specific routes first
router.post("/check-nic", childController.check_nic);
router.get("/", childController.getAll);
router.get("/:id", childController.getById); // Parameterized routes last
router.post("/", childController.create);
router.put("/:id", childController.update);
router.delete("/:id", childController.delete);
>>>>>>> fd9b2a3f492bc8fdc3ded97b9512b2d647d2953e

export default router;
