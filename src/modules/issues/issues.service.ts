import { pool } from "../../db";
import type {
  CreateIssueRequest,
  Issue,
  IssueWithReporter,
  UpdateIssueRequest,
} from "../../types";

// Create issue
const createIssueIntoDB = async (
  payload: CreateIssueRequest & { reporter_id: number },
): Promise<Issue> => {
  const { title, description, type, reporter_id } = payload;

  if (description.length < 20) {
    throw new Error("Description must be at least 20 characters");
  }

  const result = await pool.query(
    "INSERT INTO issues (title, description, type, reporter_id) VALUES ($1, $2, $3, $4) RETURNING *",
    [title, description, type, reporter_id],
  );

  return result.rows[0];
};

// Get all issues
const getAllIssuesFromDB = async (filters: {
  sort?: string;
  type?: string;
  status?: string;
}): Promise<IssueWithReporter[]> => {
  let query = "SELECT * FROM issues WHERE 1=1";
  const params: (string | number)[] = [];

  if (filters.type) {
    query += " AND type = $" + (params.length + 1);
    params.push(filters.type);
  }

  if (filters.status) {
    query += " AND status = $" + (params.length + 1);
    params.push(filters.status);
  }

  // ORDER BY আগে add করো
  query +=
    filters.sort === "oldest"
      ? " ORDER BY created_at ASC"
      : " ORDER BY created_at DESC";

  const result = await pool.query(query, params);

  // Get reporter info
  const issues = await Promise.all(
    result.rows.map(async (issue) => {
      const reporter = await pool.query(
        "SELECT id, name, role FROM users WHERE id = $1",
        [issue.reporter_id],
      );
      const { reporter_id, created_at, updated_at, ...rest } = issue;
      return {
        ...rest,
        reporter: reporter.rows[0],
        created_at,
        updated_at,
      };
    }),
  );

  return issues;
};

// Get single issue
const getSingleIssueFromDB = async (id: number): Promise<Issue> => {
  const result = await pool.query("SELECT * FROM issues WHERE id = $1", [id]);

  if (result.rows.length === 0) {
    throw new Error("Issue not found");
  }

  const issue = result.rows[0];
  const reporter = await pool.query(
    "SELECT id, name, role FROM users WHERE id = $1",
    [issue.reporter_id],
  );

  const { reporter_id, created_at, updated_at, ...rest } = issue;
  return {
    ...rest,
    reporter: reporter.rows[0],
    created_at,
    updated_at,
  };
};

// Update issue
const updateIssueFromDB = async (
  id: number,
  payload: UpdateIssueRequest,
  user: { id: number; role: string },
): Promise<Issue> => {
  const issue = await pool.query("SELECT * FROM issues WHERE id = $1", [id]);

  if (issue.rows.length === 0) {
    throw new Error("Issue not found");
  }

  const existingIssue = issue.rows[0];

  // Permission check
  if (user.role !== "maintainer" && user.id !== existingIssue.reporter_id) {
    throw new Error("You can only update your own issues");
  }

  if (user.role !== "maintainer" && existingIssue.status !== "open") {
    throw new Error("Contributors can only update open issues");
  }

  const { title, description, type } = payload;
  const status =
    user.role === "maintainer" ? payload.status : existingIssue.status;

  const result = await pool.query(
    "UPDATE issues SET title = COALESCE($1, title), description = COALESCE($2, description), type = COALESCE($3, type), status = COALESCE($4, status), updated_at = CURRENT_TIMESTAMP WHERE id = $5 RETURNING *",
    [title, description, type, status, id],
  );

  return result.rows[0];
};

//update issue status from database
const updateIssueStatusFromDB = async (id: number, status: string) => {
  const result = await pool.query(
    "UPDATE issues SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *",
    [status, id],
  );

  if (result.rows.length === 0) {
    throw new Error("Issue not found");
  }

  return result.rows[0];
};

// Delete issue
const deleteIssueFromDB = async (id: number) => {
  const result = await pool.query("DELETE FROM issues WHERE id = $1", [id]);

  if (result.rowCount === 0) {
    throw new Error("Issue not found");
  }
};

export const issuesService = {
  createIssueIntoDB,
  getAllIssuesFromDB,
  getSingleIssueFromDB,
  updateIssueFromDB,
  deleteIssueFromDB,
  updateIssueStatusFromDB,
};
