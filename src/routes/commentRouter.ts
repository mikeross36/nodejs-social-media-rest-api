import express, { RequestHandler } from "express";
import authenticateUser from "../middlewares/authenticateUser";
import { param } from "express-validator";
import {
  setPostUserIds,
  createCommentHandler,
  updateCommentHandler,
  toggleLikeCommentHandler,
  getUserCommentsHandler,
  deleteCommentHandler,
} from "../controllers/commentController";

const commentRouter = express.Router({ mergeParams: true });

commentRouter.use(authenticateUser as RequestHandler);

commentRouter.post(
  "/",
  [param("id").notEmpty().withMessage("Comment id is required on params")],
  setPostUserIds,
  createCommentHandler as unknown as RequestHandler
);
commentRouter.patch(
  "/:id/update",
  [param("id").notEmpty().withMessage("Comment id is required on params")],
  updateCommentHandler as unknown as RequestHandler
);
commentRouter.put(
  "/:id/like",
  [param("id").notEmpty().withMessage("Comment id is required on params")],
  toggleLikeCommentHandler as unknown as RequestHandler
);
commentRouter.get(
  "/:userId/user-comments",
  [param("id").notEmpty().withMessage("User id is required on params")],
  getUserCommentsHandler as unknown as RequestHandler
);
commentRouter.delete(
  "/:id",
  [param("id").notEmpty().withMessage("Comment id is required on params")],
  deleteCommentHandler as unknown as RequestHandler
);

export default commentRouter;
