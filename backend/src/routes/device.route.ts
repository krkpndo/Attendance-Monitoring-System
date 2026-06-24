import { Router } from "express";
import { authenticateDevice } from "../middlewares/auth.middleware";

const router = Router();

router.use(authenticateDevice);

router.post('/attendance/tap');

export default router;