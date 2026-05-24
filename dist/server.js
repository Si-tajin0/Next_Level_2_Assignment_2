

   import { createRequire } from 'module';

   const require = createRequire(import.meta.url);

  

// src/app.ts
import express from "express";

// src/middleware/logger.ts
import fs from "fs";
var logger = (req, res, next) => {
  const timestamp = (/* @__PURE__ */ new Date()).toISOString();
  const method = req.method;
  const path = req.path;
  const ip = req.ip;
  const log = `
[${timestamp}] ${method} ${path} - IP: ${ip}
`;
  fs.appendFile("logger.txt", log, (err) => {
  });
  next();
};

// src/config/index.ts
import dotenv from "dotenv";
import { env } from "process";
dotenv.config({ quiet: true });
var config = {
  port: env.PORT,
  database_url: env.DATABASE_URL,
  node_env: env.NODE_ENV,
  jwt_secret: env.JWT_SECRET,
  refresh_secret: env.REFRESH_SECRET
};
var config_default = config;

// src/middleware/globalErrorHandler.ts
var globalErrorHandler = (err, req, res, next) => {
  res.status(500).json({
    success: false,
    message: err instanceof Error ? err.message : "Internal Server Error",
    stack: config_default.node_env === "development" && err instanceof Error ? err.stack : void 0
  });
};

// src/modules/auth/auth.route.ts
import { Router } from "express";

// src/modules/auth/auth.service.ts
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

// src/db/index.ts
import { Pool } from "pg";
var pool = new Pool({
  connectionString: config_default.database_url
});
var initDB = async () => {
  try {
    await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(100) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      role VARCHAR(20) NOT NULL DEFAULT 'contributor' CHECK (role IN ('contributor', 'maintainer')),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
    await pool.query(`
    CREATE TABLE IF NOT EXISTS issues(
      id SERIAL PRIMARY KEY,
      title VARCHAR(150) NOT NULL,
      description TEXT NOT NULL CHECK (LENGTH(description) >= 20),
      type VARCHAR(20) NOT NULL CHECK (type IN ('bug', 'feature_request')),
      status VARCHAR(20) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved')),
      reporter_id INTEGER NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP

    )
  `);
    console.log("Database Connected Successfully");
  } catch (error) {
    console.log("Database intialization error", error);
  }
};

// src/modules/auth/auth.service.ts
var signupUserIntoDB = async (payload) => {
  const { name, email, password, role = "contributor" } = payload;
  const existingUser = await pool.query(
    "SELECT * FROM users WHERE email = $1",
    [email]
  );
  if (existingUser.rows.length > 0) {
    throw new Error("Email already registered");
  }
  const hashedPassword = await bcrypt.hash(password, 10);
  const result = await pool.query(
    "INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role, created_at, updated_at",
    [name, email, hashedPassword, role]
  );
  return result.rows[0];
};
var loginUserIntoDB = async (payload) => {
  const { email, password } = payload;
  const result = await pool.query("SELECT * FROM users WHERE email = $1", [
    email
  ]);
  const user = result.rows[0];
  if (!user) {
    throw new Error("User not found");
  }
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw new Error("Invalid password");
  }
  const jwtPayload = {
    id: user.id,
    name: user.name,
    role: user.role,
    email: user.email
  };
  const accessToken = jwt.sign(jwtPayload, config_default.jwt_secret, {
    expiresIn: "7d"
  });
  return {
    accessToken,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      created_at: user.created_at,
      updated_at: user.updated_at
    }
  };
};
var authService = {
  signupUserIntoDB,
  loginUserIntoDB
};

// src/utils/sendResponce.ts
function sendResponse(res, { message, data, error }, status = 200) {
  res.status(status).json({
    success: error ? false : true,
    message,
    data: error ? void 0 : data
  });
}

// src/modules/auth/auth.controller.ts
var signupUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) {
      return sendResponse(
        res,
        {
          message: "Name, Email, and Password are required",
          error: true
        },
        400
      );
    }
    const result = await authService.signupUserIntoDB({
      name,
      email,
      password,
      role
    });
    sendResponse(
      res,
      {
        message: "User Registerd Successfully",
        data: result
      },
      201
    );
  } catch (error) {
    sendResponse(
      res,
      { message: error.message || "Signup Failed", error: true },
      400
    );
  }
};
var loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return sendResponse(
        res,
        {
          message: "Email and Password are Required",
          error: true
        },
        400
      );
    }
    const result = await authService.loginUserIntoDB({ email, password });
    sendResponse(
      res,
      {
        message: "login Successful",
        data: result
      },
      200
    );
  } catch (error) {
    sendResponse(
      res,
      {
        message: error.message || "Login Faild",
        error: true
      },
      401
    );
  }
};
var authController = {
  signupUser,
  loginUser
};

// src/modules/auth/auth.route.ts
var router = Router();
router.post("/signup", authController.signupUser);
router.post("/login", authController.loginUser);
var authRoute = router;

// src/modules/issues/issues.route.ts
import { Router as Router2 } from "express";

// src/modules/issues/issues.service.ts
var createIssueIntoDB = async (payload) => {
  const { title, description, type, reporter_id } = payload;
  if (description.length < 20) {
    throw new Error("Description must be at least 20 characters");
  }
  const result = await pool.query(
    "INSERT INTO issues (title, description, type, reporter_id) VALUES ($1, $2, $3, $4) RETURNING *",
    [title, description, type, reporter_id]
  );
  return result.rows[0];
};
var getAllIssuesFromDB = async (filters) => {
  let query = "SELECT * FROM issues WHERE 1=1";
  const params = [];
  if (filters.type) {
    query += " AND type = $" + (params.length + 1);
    params.push(filters.type);
  }
  if (filters.status) {
    query += " AND status = $" + (params.length + 1);
    params.push(filters.status);
  }
  query += filters.sort === "oldest" ? " ORDER BY created_at ASC" : " ORDER BY created_at DESC";
  const result = await pool.query(query, params);
  const issues = await Promise.all(
    result.rows.map(async (issue) => {
      const reporter = await pool.query(
        "SELECT id, name, role FROM users WHERE id = $1",
        [issue.reporter_id]
      );
      const { reporter_id, created_at, updated_at, ...rest } = issue;
      return {
        ...rest,
        reporter: reporter.rows[0],
        created_at,
        updated_at
      };
    })
  );
  return issues;
};
var getSingleIssueFromDB = async (id) => {
  const result = await pool.query("SELECT * FROM issues WHERE id = $1", [id]);
  if (result.rows.length === 0) {
    throw new Error("Issue not found");
  }
  const issue = result.rows[0];
  const reporter = await pool.query(
    "SELECT id, name, role FROM users WHERE id = $1",
    [issue.reporter_id]
  );
  const { reporter_id, created_at, updated_at, ...rest } = issue;
  return {
    ...rest,
    reporter: reporter.rows[0],
    created_at,
    updated_at
  };
};
var updateIssueFromDB = async (id, payload, user) => {
  const issue = await pool.query("SELECT * FROM issues WHERE id = $1", [id]);
  if (issue.rows.length === 0) {
    throw new Error("Issue not found");
  }
  const existingIssue = issue.rows[0];
  if (user.role !== "maintainer" && user.id !== existingIssue.reporter_id) {
    throw new Error("You can only update your own issues");
  }
  if (user.role !== "maintainer" && existingIssue.status !== "open") {
    throw new Error("Contributors can only update open issues");
  }
  const { title, description, type } = payload;
  const status = user.role === "maintainer" ? payload.status : existingIssue.status;
  const result = await pool.query(
    "UPDATE issues SET title = COALESCE($1, title), description = COALESCE($2, description), type = COALESCE($3, type), status = COALESCE($4, status), updated_at = CURRENT_TIMESTAMP WHERE id = $5 RETURNING *",
    [title, description, type, status, id]
  );
  return result.rows[0];
};
var updateIssueStatusFromDB = async (id, status) => {
  const result = await pool.query(
    "UPDATE issues SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *",
    [status, id]
  );
  if (result.rows.length === 0) {
    throw new Error("Issue not found");
  }
  return result.rows[0];
};
var deleteIssueFromDB = async (id) => {
  const result = await pool.query("DELETE FROM issues WHERE id = $1", [id]);
  if (result.rowCount === 0) {
    throw new Error("Issue not found");
  }
};
var issuesService = {
  createIssueIntoDB,
  getAllIssuesFromDB,
  getSingleIssueFromDB,
  updateIssueFromDB,
  deleteIssueFromDB,
  updateIssueStatusFromDB
};

// src/modules/issues/issues.controller.ts
var createIssue = async (req, res) => {
  try {
    const { title, description, type } = req.body;
    if (!title || !description || !type) {
      return sendResponse(
        res,
        {
          message: "Title, Description, and type are required",
          error: true
        },
        400
      );
    }
    const issue = await issuesService.createIssueIntoDB({
      title,
      description,
      type,
      reporter_id: req.user.id
    });
    sendResponse(
      res,
      {
        message: "Issue created successfully",
        data: issue
      },
      201
    );
  } catch (error) {
    sendResponse(
      res,
      {
        message: error.message,
        error: true
      },
      400
    );
  }
};
var getAllIssues = async (req, res) => {
  try {
    const { sort = "newest", type, status } = req.query;
    const issues = await issuesService.getAllIssuesFromDB({
      sort,
      type,
      status
    });
    sendResponse(
      res,
      { message: "Issues retrieved successfully", data: issues },
      200
    );
  } catch (error) {
    sendResponse(res, { message: error.message, error: true }, 500);
  }
};
var getSingleIssue = async (req, res) => {
  try {
    const id = req.params.id;
    const issue = await issuesService.getSingleIssueFromDB(parseInt(id));
    sendResponse(
      res,
      { message: "Issue retrieved successfully", data: issue },
      200
    );
  } catch (error) {
    sendResponse(res, { message: error.message, error: true }, 404);
  }
};
var updateIssue = async (req, res) => {
  try {
    const id = req.params.id;
    const issue = await issuesService.updateIssueFromDB(
      parseInt(id),
      req.body,
      req.user
    );
    sendResponse(
      res,
      { message: "Issue updated successfully", data: issue },
      200
    );
  } catch (error) {
    sendResponse(res, { message: error.message, error: true }, 400);
  }
};
var deleteIssue = async (req, res) => {
  try {
    const id = req.params.id;
    await issuesService.deleteIssueFromDB(parseInt(id));
    sendResponse(res, { message: "Issue deleted successfully" }, 200);
  } catch (error) {
    sendResponse(res, { message: error.message, error: true }, 404);
  }
};
var updateIssueStatus = async (req, res) => {
  try {
    const id = req.params.id;
    const { status } = req.body;
    if (!status) {
      return sendResponse(
        res,
        { message: "Status is required", error: true },
        400
      );
    }
    const issue = await issuesService.updateIssueStatusFromDB(
      parseInt(id, 10),
      status
    );
    sendResponse(
      res,
      { message: "Issue status updated successfully", data: issue },
      200
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Something went wrong";
    sendResponse(res, { message, error: true }, 400);
  }
};
var issuesController = {
  getAllIssues,
  getSingleIssue,
  createIssue,
  updateIssue,
  deleteIssue,
  updateIssueStatus
};

// src/middleware/auth.ts
import jwt2 from "jsonwebtoken";
var authMiddleware = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return sendResponse(
        res,
        { message: "No token provided", error: true },
        401
      );
    }
    const decoded = jwt2.verify(token, config_default.jwt_secret);
    req.user = decoded;
    next();
  } catch (error) {
    sendResponse(
      res,
      { message: "Invalid or expired token", error: true },
      401
    );
  }
};
var maintainerOnly = (req, res, next) => {
  if (req.user?.role !== "maintainer") {
    return sendResponse(
      res,
      { message: "Only maintainers can access this", error: true },
      403
    );
  }
  next();
};

// src/modules/issues/issues.route.ts
var router2 = Router2();
router2.get("/", issuesController.getAllIssues);
router2.get("/:id", issuesController.getSingleIssue);
router2.post("/", authMiddleware, issuesController.createIssue);
router2.patch("/:id", authMiddleware, issuesController.updateIssue);
router2.delete(
  "/:id",
  authMiddleware,
  maintainerOnly,
  issuesController.deleteIssue
);
router2.patch(
  "/:id/status",
  authMiddleware,
  maintainerOnly,
  issuesController.updateIssueStatus
);
var issuesRouter = router2;

// src/modules/metrics/meteics.route.ts
import { Router as Router3 } from "express";

// src/modules/metrics/metrics.service.ts
var getMetricsFromDB = async () => {
  const totalIssues = await pool.query("SELECT COUNT(*) FROM issues");
  const openIssues = await pool.query(
    "SELECT COUNT(*) FROM issues WHERE status = 'open'"
  );
  const inProgressIssues = await pool.query(
    "SELECT COUNT(*) FROM issues WHERE status = 'in_progress'"
  );
  const resolvedIssues = await pool.query(
    "SELECT COUNT(*) FROM issues WHERE status = 'resolved'"
  );
  const bugCount = await pool.query(
    "SELECT COUNT(*) FROM issues WHERE type = 'bug'"
  );
  const featureRequestCount = await pool.query(
    "SELECT COUNT(*) FROM issues WHERE type = 'feature_request'"
  );
  const totalUsers = await pool.query("SELECT COUNT(*) FROM users");
  return {
    totalIssues: parseInt(totalIssues.rows[0].count),
    openIssues: parseInt(openIssues.rows[0].count),
    inProgressIssues: parseInt(inProgressIssues.rows[0].count),
    resolvedIssues: parseInt(resolvedIssues.rows[0].count),
    bugCount: parseInt(bugCount.rows[0].count),
    featureRequestCount: parseInt(featureRequestCount.rows[0].count),
    totalUsers: parseInt(totalUsers.rows[0].count)
  };
};
var metricsService = {
  getMetricsFromDB
};

// src/modules/metrics/metrics.controller.ts
var getMetrics = async (req, res) => {
  try {
    const metrics = await metricsService.getMetricsFromDB();
    sendResponse(
      res,
      { message: "System metrics retrieved successfully", data: metrics },
      200
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Something went wrong";
    sendResponse(res, { message, error: true }, 500);
  }
};
var metricsController = {
  getMetrics
};

// src/modules/metrics/meteics.route.ts
var router3 = Router3();
router3.get("/", authMiddleware, maintainerOnly, metricsController.getMetrics);
var metricsRouter = router3;

// src/app.ts
var app = express();
app.use(express.json());
app.use(logger);
app.get("/", (req, res) => {
  res.status(200).json({
    message: "Assignment 2",
    author: "SI TAJIN"
  });
});
app.use("/api/auth", authRoute);
app.use("/api/issues", issuesRouter);
app.use("/api/metrics", metricsRouter);
app.use(globalErrorHandler);
var app_default = app;

// src/server.ts
var main = async () => {
  initDB();
  app_default.listen(config_default.port, () => {
    console.log(`Server is running on port ${config_default.port}`);
  });
};
main();
//# sourceMappingURL=server.js.map