import type { Request, Response } from "express";
import { sendResponse } from "../../utils/sendResponce";
import { metricsService } from "./metrics.service";

const getMetrics = async (req: Request, res: Response) => {
  try {
    const metrics = await metricsService.getMetricsFromDB();

    sendResponse(
      res,
      { message: "System metrics retrieved successfully", data: metrics },
      200,
    );
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Something went wrong";
    sendResponse(res, { message, error: true }, 500);
  }
};

export const metricsController = {
  getMetrics,
};
