import { Router } from "express";
const router = Router();
router.post("/sign-out", (req, res) => {
  res.send("hi there!");
});
export { router as signOutRouter };
