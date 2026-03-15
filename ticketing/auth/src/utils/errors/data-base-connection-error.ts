import { CustomError } from "./custom-error.js";

export class DatabaseConnectionError extends CustomError {
  statusCode = 500;

  constructor(originalError?: Error | string) {
    const errorMessage = originalError
      ? `Database connection failed: ${originalError instanceof Error ? originalError.message : originalError}`
      : "Database connection failed";

    super(errorMessage);
    Object.setPrototypeOf(this, DatabaseConnectionError.prototype);
  }

  serializeErrors() {
    return [{ message: "Error connecting to database" }];
  }
}
