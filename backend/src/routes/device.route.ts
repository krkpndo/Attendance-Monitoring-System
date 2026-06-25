import { Router } from "express";
import { authenticateDevice } from "../middlewares/auth.middleware";
import { tapSchema } from "../validators/device.validator";
import * as DeviceController from '../controllers/device.controller';
import { validate } from "../middlewares/validation.middleware";

const router = Router();

router.use(authenticateDevice);

router.post('/attendance/tap', validate(tapSchema), DeviceController.tap);

export default router;