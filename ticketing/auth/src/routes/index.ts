import { Router } from "express";
import { currentUserRouter } from "./current-user.js";
import { signInRouter } from "./sign-in.js";
import { signUpRouter } from "./sign-up.js";
import { signOutRouter } from "./sign-out.js";

const router: Router = Router();

// Group all user-related routes under one router
router.use("/current-user", currentUserRouter);
router.use("/sign-in", signInRouter);
router.use("/sign-up", signUpRouter);
router.use("/sign-out", signOutRouter);

export { router as userRouter };
