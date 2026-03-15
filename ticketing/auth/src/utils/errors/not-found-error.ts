import { CustomError } from "./custom-error.js";

export class NotFound extends CustomError {
  statusCode = 404;
  constructor(public requestedRoute?: string) {
    const message = requestedRoute
      ? `Route '${requestedRoute}' doesn't exist`
      : "Route doesn't exist";
    super(message);
    Object.setPrototypeOf(this, NotFound.prototype);
  }
  serializeErrors() {
    return [{ message: this.message }];
  }
}
