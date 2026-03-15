import { CustomError } from "./custom-error.js";
import type { ValidationError } from "express-validator";

export class RequestValidationError extends CustomError {
  statusCode = 400;

  constructor(private errors: ValidationError[]) {
    super(`Invalid request parameters: ${JSON.stringify(errors)}`);
    Object.setPrototypeOf(this, RequestValidationError.prototype);
  }

  serializeErrors() {
    return this.errors.map((err) => {
      const result: { message: string; field?: string } = {
        message: err.msg,
      };

      if (err.type === "field" && err.path) {
        result.field = err.path;
      }

      return result;
    });
  }
}
