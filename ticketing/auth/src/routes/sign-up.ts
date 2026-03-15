import { Router, type Request, type Response } from "express";
import { body, validationResult } from "express-validator";

const router = Router();
router.post(
  "/",
  [
    body("email").isEmail().withMessage("Email must be valid."),
    body("password")
      .trim()
      .isLength({ min: 4, max: 20 })
      .withMessage("Password must be between 4 and 20 characters."),
  ],
  (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.send(errors.array());
    }
    const { email, password } = req.body;
    
    return res.send({ email, password });
  },
);
export { router as signUpRouter };
