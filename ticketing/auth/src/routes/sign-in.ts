import { Router } from "express";
const router = Router();
router.post("/sign-in", (req, res) => {
  res.send("hi there!");
});
export { router as signInRouter };
