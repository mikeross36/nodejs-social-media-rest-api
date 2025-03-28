import express, { RequestHandler } from "express";
import { validateUserId } from "../validations/userValidation";
import authenticateUser from "../middlewares/authenticateUser";
import {
  followUserHander,
  unfollowUserHander,
  blockUserHander,
  unblockUserHander,
  getBlockedUsersHander,
  getUserHandler,
  updateUserHandler,
  deleteUserHandler,
} from "../controllers/userController";

const userRouter = express.Router();

userRouter.use(authenticateUser as RequestHandler);

userRouter.get(
  "/blocked-users",
  getBlockedUsersHander as unknown as RequestHandler
);

userRouter.get(
  "/:id",
  validateUserId,
  getUserHandler as unknown as RequestHandler
);
userRouter.put(
  "/:id/follow",
  validateUserId,
  followUserHander as unknown as RequestHandler
);
userRouter.put(
  "/:id/unfollow",
  validateUserId,
  unfollowUserHander as unknown as RequestHandler
);
userRouter.put(
  "/:id/block",
  validateUserId,
  blockUserHander as unknown as RequestHandler
);
userRouter.put(
  "/:id/unblock",
  validateUserId,
  unblockUserHander as unknown as RequestHandler
);
userRouter.patch(
  "/:id/update",
  validateUserId,
  updateUserHandler as unknown as RequestHandler
);
userRouter.delete(
  "/:id",
  validateUserId,
  deleteUserHandler as unknown as RequestHandler
);

export default userRouter;
