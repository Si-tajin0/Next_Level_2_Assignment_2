import type { Request, Response } from "express";
import { sendResponse } from "../../utils/sendResponce";
import { issuesService } from "./issues.service";

// create a issue
const createIssue = async (req: Request, res: Response) => {
  try {
    const { title, description, type } = req.body;

    if (!title || !description || !type) {
      return sendResponse(
        res,
        {
          message: "Title, Description, and type are required",
          error: true,
        },
        400,
      );
    }

    const issue = await issuesService.createIssueIntoDB({
      title,
      description,
      type,
      reporter_id: req.user!.id,
    });

    sendResponse(
      res,
      {
        message: "Issue created successfully",
        data: issue,
      },
      201,
    );
  } catch (error: any) {
    sendResponse(
      res,
      {
        message: error.message,
        error: true,
      },
      400,
    );
  }
};

// get all user find
const getAllIssues = async (req: Request, res: Response) => {
  try {
    const { sort = "newest", type, status } = req.query;

    const issues = await issuesService.getAllIssuesFromDB({
      sort: sort as string,
      type: type as string,
      status: status as string,
    });

    sendResponse(
      res,
      { message: "Issues retrieved successfully", data: issues },
      200,
    );
  } catch (error: any) {
    sendResponse(res, { message: error.message, error: true }, 500);
  }
};

// single issues find
const getSingleIssue = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;

    const issue = await issuesService.getSingleIssueFromDB(parseInt(id));

    sendResponse(
      res,
      { message: "Issue retrieved successfully", data: issue },
      200,
    );
  } catch (error: any) {
    sendResponse(res, { message: error.message, error: true }, 404);
  }
};

// update the issues
const updateIssue = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;

    const issue = await issuesService.updateIssueFromDB(
      parseInt(id),
      req.body,
      req.user!,
    );

    sendResponse(
      res,
      { message: "Issue updated successfully", data: issue },
      200,
    );
  } catch (error: any) {
    sendResponse(res, { message: error.message, error: true }, 400);
  }
};
// delete for issues
const deleteIssue = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;

    await issuesService.deleteIssueFromDB(parseInt(id));

    sendResponse(res, { message: "Issue deleted successfully" }, 200);
  } catch (error: any) {
    sendResponse(res, { message: error.message, error: true }, 404);
  }
};

// Update Issues Controller only maitainer

const updateIssueStatus = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { status } = req.body;

    if (!status) {
      return sendResponse(
        res,
        { message: "Status is required", error: true },
        400,
      );
    }

    const issue = await issuesService.updateIssueStatusFromDB(
      parseInt(id, 10),
      status,
    );

    sendResponse(
      res,
      { message: "Issue status updated successfully", data: issue },
      200,
    );
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Something went wrong";
    sendResponse(res, { message, error: true }, 400);
  }
};

export const issuesController = {
  getAllIssues,
  getSingleIssue,
  createIssue,
  updateIssue,
  deleteIssue,
  updateIssueStatus,
};
