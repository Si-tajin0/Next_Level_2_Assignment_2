import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { sendResponse } from "../utils/sendResponce";
import config from "../config";
import type { JwtPayload } from "../types";

export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : authHeader;

    if (!token) {
      return sendResponse(
        res,
        { message: "No token provided", error: true },
        401,
      );
    }

    const decoded = jwt.verify(token, config.jwt_secret);
    req.user = decoded as JwtPayload;
    next();
  } catch (error: any) {
    sendResponse(
      res,
      { message: "Invalid or expired token", error: true },
      401,
    );
  }
};

// Only Maintainer
export const maintainerOnly = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (req.user?.role !== "maintainer") {
    return sendResponse(
      res,
      { message: "Only maintainers can access this", error: true },
      403,
    );
  }
  next();
};

// Only Contributor or Maintainer
export const contributorOrMaintainer = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const role = req.user?.role;
  if (role !== "contributor" && role !== "maintainer") {
    return sendResponse(res, { message: "Access denied", error: true }, 403);
  }
  next();
};
