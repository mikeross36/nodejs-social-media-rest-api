import express, { RequestHandler } from "express";
import {
  validateRegisterUserRequest,
  validateLoginUserRequest,
  validateChangePasswordRequest,
} from "../validations/userValidation";
import {
  registerUserHandler,
  loginUserHandler,
  logoutUserHandler,
  changePasswordHandler,
} from "../controllers/authController";
import authenticateUser from "../middlewares/authenticateUser";

const authRouter = express.Router();

authRouter.post(
  "/register",
  validateRegisterUserRequest as unknown as RequestHandler,
  registerUserHandler as RequestHandler
);

authRouter.post(
  "/login",
  validateLoginUserRequest as unknown as RequestHandler,
  loginUserHandler as RequestHandler
);

authRouter.use(authenticateUser as RequestHandler);

authRouter.post("/logout", logoutUserHandler as RequestHandler);

authRouter.patch(
  "/change-password",
  validateChangePasswordRequest as unknown as RequestHandler,
  changePasswordHandler as RequestHandler
);

export default authRouter;
