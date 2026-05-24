import { Router } from "express";
import { authMiddleware, maintainerOnly } from "../../middleware/auth";
import { metricsController } from "./metrics.controller";

const router = Router();

router.get("/", authMiddleware, maintainerOnly, metricsController.getMetrics);

export const metricsRouter = router;
