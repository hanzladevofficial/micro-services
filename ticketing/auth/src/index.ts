import express from "express";
import morgan from "morgan";

// Middlewares
import { errorHandler } from "./middlewares/error-handler.js";

// Routes
import { userRouter } from "./routes/index.js";
import { NotFound } from "./utils/errors/index.js";

const app = express();

// Custom token for Morgan
morgan.token("error-message", (req, res) => {
  return res.locals.errorMessage || "-";
});

// Use custom format
app.use(morgan(":method :url :status :response-time ms - :error-message"));

app.use(express.json());

const apiRouter = express.Router();
apiRouter.use("/users", userRouter);
apiRouter.get("/users/testing", (req, res) => {
  res.json({ message: "hello world" });
});

app.use("/api", apiRouter);

app.use("*", (req, _res, next) => {
  next(new NotFound(req.originalUrl));
});

app.use(errorHandler);

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
