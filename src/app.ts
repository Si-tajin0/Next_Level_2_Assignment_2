import express, {
  type Application,
  type Request,
  type Response,
} from "express";
import { logger } from "./middleware/logger";
import { globalErrorHandler } from "./middleware/globalErrorHandler";
import { authRoute } from "./modules/auth/auth.route";
import { issuesRouter } from "./modules/issues/issues.route";
import { metricsRouter } from "./modules/metrics/meteics.route";

const app: Application = express();

app.use(express.json());
app.use(logger);

app.get("/", (req: Request, res: Response) => {
  // res.send("Hello World");
  res.status(200).json({
    message: "Assignment 2",
    author: "SI TAJIN",
  });
});

app.use("/api/auth", authRoute);
app.use("/api/issues", issuesRouter);
app.use("/api/metrics", metricsRouter);

// Global Error Handling Middleware
app.use(globalErrorHandler);

export default app;
