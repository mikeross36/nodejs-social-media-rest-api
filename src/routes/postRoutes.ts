import express, { RequestHandler } from "express";
import authenticateUser from "../middlewares/authenticateUser";
import commentRouter from "./commentRouter";
import { body, param } from "express-validator";
import {
  createPostHandler,
  updatePostHandler,
  toggleLikePostHandler,
  getPostTimelineHandler,
  getPostHandler,
  deletePostHandler,
} from "../controllers/postController";

const validatePostId = [
  param("id")
    .notEmpty()
    .withMessage("Post id is required")
    .isMongoId()
    .withMessage("Invalid post id"),
];

const postRouter = express.Router();

// http://localhost:5000/api/v1/posts/123456789012345678901234/comments
postRouter.use("/:postId/comments", commentRouter);

postRouter.use(authenticateUser as RequestHandler);

postRouter.post(
  "/",
  body("text").notEmpty().withMessage("Post text is required"),
  createPostHandler as RequestHandler
);
postRouter.get(
  "/timeline",
  getPostTimelineHandler as unknown as RequestHandler
);

postRouter.patch(
  "/:id/update",
  validatePostId,
  updatePostHandler as unknown as RequestHandler
);
postRouter.put(
  "/:id/like",
  validatePostId,
  toggleLikePostHandler as unknown as RequestHandler
);
postRouter.get(
  "/:id",
  validatePostId,
  getPostHandler as unknown as RequestHandler
);

postRouter.delete(
  "/:id",
  validatePostId,
  deletePostHandler as unknown as RequestHandler
);

export default postRouter;
