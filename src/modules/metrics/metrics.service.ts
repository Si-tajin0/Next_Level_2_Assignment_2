import { pool } from "../../db";

const getMetricsFromDB = async () => {
  // Total issues
  const totalIssues = await pool.query("SELECT COUNT(*) FROM issues");

  // Issues by status
  const openIssues = await pool.query(
    "SELECT COUNT(*) FROM issues WHERE status = 'open'",
  );
  const inProgressIssues = await pool.query(
    "SELECT COUNT(*) FROM issues WHERE status = 'in_progress'",
  );
  const resolvedIssues = await pool.query(
    "SELECT COUNT(*) FROM issues WHERE status = 'resolved'",
  );

  // Issues by type
  const bugCount = await pool.query(
    "SELECT COUNT(*) FROM issues WHERE type = 'bug'",
  );
  const featureRequestCount = await pool.query(
    "SELECT COUNT(*) FROM issues WHERE type = 'feature_request'",
  );

  // Total users
  const totalUsers = await pool.query("SELECT COUNT(*) FROM users");

  return {
    totalIssues: parseInt(totalIssues.rows[0].count),
    openIssues: parseInt(openIssues.rows[0].count),
    inProgressIssues: parseInt(inProgressIssues.rows[0].count),
    resolvedIssues: parseInt(resolvedIssues.rows[0].count),
    bugCount: parseInt(bugCount.rows[0].count),
    featureRequestCount: parseInt(featureRequestCount.rows[0].count),
    totalUsers: parseInt(totalUsers.rows[0].count),
  };
};

export const metricsService = {
  getMetricsFromDB,
};
