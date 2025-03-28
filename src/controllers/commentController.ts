import { Request, Response, NextFunction } from "express";
import Comment from "../models/commentModel";
import logger from "../utils/logger";
import mongoose from "mongoose";

function setPostUserIds(req: Request, res: Response, next: NextFunction) {
  if (!req.body.post) req.body.post = req.params.postId;
  if (!req.body.creator) req.body.creator = req.userAuth?._id;
  next();
}

async function createCommentHandler(req: Request, res: Response) {
  try {
    const comment = await Comment.create(req.body);
    await comment.populate({
      path: "creator",
      select: "userName profileImage",
    });
    return res.status(201).json({ message: "Comment created", data: comment });
  } catch (err) {
    const errMsg = "Unable to create comment";
    logger.error(errMsg);
    return res.status(500).json({ message: errMsg });
  }
}

async function updateCommentHandler(req: Request, res: Response) {
  try {
    if (!req.params.id || !mongoose.Types.ObjectId.isValid(req.params.id)) {
      const errMsg = "Invalid comment ID";
      logger.error(errMsg);
      return res.status(400).json({ message: errMsg });
    }
    const comment = await Comment.findById(req.params.id);
    if (!comment) {
      const errMsg = "Comment not found";
      logger.error(errMsg);
      return res.status(404).json({ message: errMsg });
    }
    if (comment.creator.equals(req.userAuth?._id)) {
      const updatedComment = await Comment.findByIdAndUpdate(
        req.params.id,
        { $set: req.body },
        {
          new: true,
          runValidators: true,
        }
      );
      if (!updatedComment) {
        const errMsg = "Failed to update comment";
        logger.error(errMsg);
        return res.status(404).json({ message: errMsg });
      }
      return res
        .status(200)
        .json({ message: "Comment updated", data: updatedComment });
    } else {
      const errMsg = "You can only update your own comment";
      logger.error(errMsg);
      return res.status(403).json({ message: errMsg });
    }
  } catch (err) {
    const errMsg = "Unable to update comment";
    logger.error(errMsg);
    return res.status(500).json({ message: errMsg });
  }
}

async function toggleLikeCommentHandler(req: Request, res: Response) {
  try {
    if (!req.params.id || !mongoose.Types.ObjectId.isValid(req.params.id)) {
      const errMsg = "Invalid comment ID";
      logger.error(errMsg);
      return res.status(400).json({ message: errMsg });
    }
    const existingComment = await Comment.findById(req.params.id);
    if (!existingComment) {
      const errMsg = "Comment not found";
      logger.error(errMsg);
      return res.status(404).json({ message: errMsg });
    }
    const comment = await Comment.findByIdAndUpdate(
      req.params.id,
      {
        [existingComment.likes.includes(
          new mongoose.Types.ObjectId(req.userAuth?._id)
        )
          ? "$pull"
          : "$push"]: {
          likes: new mongoose.Types.ObjectId(req.userAuth?._id),
        },
      },
      { new: true, runValidators: true }
    );
    if (!comment) {
      const errMsg = "Unable to perform this action";
      logger.error(errMsg);
      return res.status(500).json({ message: errMsg });
    }
    const isLiked = comment.likes.includes(
      new mongoose.Types.ObjectId(req.userAuth?._id)
    );
    return res.status(200).json({
      message: isLiked ? "Comment liked" : "Comment disliked",
      data: comment,
    });
  } catch (err) {
    const errMsg = "Unable to like comment";
    logger.error(errMsg);
    return res.status(500).json({ message: errMsg });
  }
}

async function getUserCommentsHandler(req: Request, res: Response) {
  try {
    if (req.userAuth?._id.toString() === req.params.userId) {
      const comments = await Comment.find({ creator: req.params.userId })
        .sort({ createdAt: -1 })
        .populate({
          path: "creator",
          select: "userName profileImage",
        });
      if (!comments) {
        const errMsg = "No comments found";
        logger.error(errMsg);
        return res.status(404).json({ message: errMsg });
      }
      return res.status(200).json({
        message: "Comments fetched successfully",
        data: comments,
      });
    } else {
      const errMsg = "You are not authorized to view this user's comments";
      logger.error(errMsg);
      return res.status(403).json({ message: errMsg });
    }
  } catch (err) {
    const errMsg = "Unable to fetch comments";
    logger.error(errMsg);
    return res.status(500).json({ message: errMsg });
  }
}

async function deleteCommentHandler(req: Request, res: Response) {
  try {
    if (!req.params.id || !mongoose.Types.ObjectId.isValid(req.params.id)) {
      const errMsg = "Invalid comment ID";
      logger.error(errMsg);
      return res.status(400).json({ message: errMsg });
    }
    const comment = await Comment.findById(req.params.id);
    if (!comment) {
      const errMsg = "Comment not found";
      logger.error(errMsg);
      return res.status(404).json({ message: errMsg });
    }
    if (comment.creator.equals(req.userAuth?._id) || req.userAuth?.isAdmin) {
      await comment.deleteOne({ _id: req.params.id });
      return res.status(200).json({ message: "Comment deleted" });
    } else {
      const errMsg = "You can only delete your own comment";
      logger.error(errMsg);
      return res.status(403).json({ message: errMsg });
    }
  } catch (err) {
    const errMsg = "Unable to delete comment";
    logger.error(errMsg);
    return res.status(500).json({ message: errMsg });
  }
}

export {
  setPostUserIds,
  createCommentHandler,
  updateCommentHandler,
  toggleLikeCommentHandler,
  getUserCommentsHandler,
  deleteCommentHandler,
};
