import { Router } from "express";
import { issuesController } from "./issues.controller";
import { authMiddleware, maintainerOnly } from "../../middleware/auth";

const router = Router();

// Public routes
router.get("/", issuesController.getAllIssues);
router.get("/:id", issuesController.getSingleIssue);

// Protected routes
router.post("/", authMiddleware, issuesController.createIssue);
router.patch("/:id", authMiddleware, issuesController.updateIssue);
router.delete(
  "/:id",
  authMiddleware,
  maintainerOnly,
  issuesController.deleteIssue,
);
router.patch(
  "/:id/status",
  authMiddleware,
  maintainerOnly,
  issuesController.updateIssueStatus,
);

export const issuesRouter = router;
