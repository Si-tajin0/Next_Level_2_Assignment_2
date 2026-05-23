import type { NextFunction, Request, Response } from "express";
import fs from "fs";

export const logger = (req: Request, res: Response, next: NextFunction) => {
  const timestamp = new Date().toISOString();
  const method = req.method;
  const path = req.path;
  const ip = req.ip;

  const log = `\n[${timestamp}] ${method} ${path} - IP: ${ip}\n`;
  fs.appendFile("logger.txt", log, (err) => {});
  next();
};
