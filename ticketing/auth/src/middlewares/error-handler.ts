import type { NextFunction, Request, Response } from "express";
import { CustomError } from "../utils/errors/custom-error.js";
export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  if (err instanceof CustomError) {
    res.locals.errorMessage = err.message;
    return res.status(err.statusCode).json({
      errors: err.serializeErrors(),
    });
  }
  res.locals.errorMessage = "Internal server error";
  console.error("Unknown error:", err);
  return res.status(500).json({
    errors: [{ message: "Something went wrong" }],
  });
};
