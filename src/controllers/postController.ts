import { Request, Response } from "express";
import cloudinary from "../utils/cloudinary";
import logger from "../utils/logger";
import Post from "../models/postModel";
import User from "../models/userModel";
import handleError from "../utils/handleError";
import mongoose from "mongoose";

async function createPostHandler(req: Request, res: Response) {
  try {
    const { text, imageUrl } = req.body;
    if (!text) {
      return res.status(400).json({ message: "Post text is required" });
    }
    let cloudinaryResponse = null;
    if (imageUrl) {
      try {
        cloudinaryResponse = await cloudinary.v2.uploader.upload(imageUrl, {
          folder: "postImages",
          quality: "auto",
          fetch_format: "auto",
          optimization: "auto",
        });
      } catch (err) {
        const errMsg = "Unable to upload image";
        logger.error(errMsg);
        return res.status(500).json({ message: errMsg });
      }
    }
    const post = await Post.create({
      creator: req.userAuth?._id,
      text,
      imageUrl: cloudinaryResponse?.secure_url ?? imageUrl,
    });
    if (!post) {
      const errMsg = "Unable to create post";
      logger.error(errMsg);
      return res.status(500).json({ message: errMsg });
    }
    return res.status(201).json({ message: "Post created", data: post });
  } catch (err) {
    handleError(err, res);
  }
}

async function updatePostHandler(req: Request, res: Response) {
  try {
    if (!req.params.id || !mongoose.Types.ObjectId.isValid(req.params.id)) {
      const errMsg = "Invalid post id";
      logger.error(errMsg);
      return res.status(400).json({ message: errMsg });
    }
    const post = await Post.findById(req.params.id);
    if (!post) {
      const errMsg = "Post not found";
      logger.error(errMsg);
      return res.status(404).json({ message: errMsg });
    }
    if (post.creator.equals(req.userAuth?._id)) {
      let cloudinaryResponse = null;
      if (req.body.imageUrl) {
        try {
          cloudinaryResponse = await cloudinary.v2.uploader.upload(
            req.body.imageUrl,
            {
              folder: "postImages",
              quality: "auto",
              fetch_format: "auto",
              optimization: "auto",
            }
          );
        } catch (err) {
          const errMsg = "Unable to upload image";
          logger.error(errMsg);
          return res.status(500).json({ message: errMsg });
        }
      }
      const updatedData = {
        ...req.body,
        imageUrl: cloudinaryResponse?.secure_url ?? req.body.imageUrl,
      };
      const updatedPost = await Post.findByIdAndUpdate(
        req.params.id,
        { $set: updatedData },
        { new: true, runValidators: true }
      );
      if (!updatedPost) {
        const errMsg = "Unable to update post";
        logger.error(errMsg);
        return res.status(500).json({ message: errMsg });
      }
      return res
        .status(200)
        .json({ message: "Post updated", data: updatedPost });
    } else {
      const errMsg = "You are not authorized to update this post";
      logger.error(errMsg);
      return res.status(403).json({ message: errMsg });
    }
  } catch (err) {
    handleError(err, res);
  }
}

async function toggleLikePostHandler(req: Request, res: Response) {
  try {
    if (!req.params.id || !mongoose.Types.ObjectId.isValid(req.params.id)) {
      const errMsg = "Invalid post id";
      logger.error(errMsg);
      return res.status(400).json({ message: errMsg });
    }
    const existingPost = await Post.findById(req.params.id);
    if (!existingPost) {
      const errMsg = "Post not found";
      logger.error(errMsg);
      return res.status(404).json({ message: errMsg });
    }
    const post = await Post.findByIdAndUpdate(
      req.params.id,
      {
        //The issue is that req.userAuth?._id might be undefined or a string, but existingPost.likes.includes expects an ObjectId.
        // To fix this, you should ensure that req.userAuth?._id is converted to an ObjectId before using it.
        [existingPost.likes.includes(
          new mongoose.Types.ObjectId(req.userAuth?._id)
        )
          ? "$pull"
          : "$push"]: {
          likes: new mongoose.Types.ObjectId(req.userAuth?._id),
        },
      },
      { new: true, runValidators: true }
    );
    if (!post) {
      const errMsg = "Unable to perform this action";
      logger.error(errMsg);
      return res.status(500).json({ message: errMsg });
    }
    const isLiked = post.likes.includes(
      new mongoose.Types.ObjectId(req.userAuth?._id)
    );
    return res.status(200).json({
      message: isLiked ? "Post liked" : "Post disliked",
      data: post,
    });
  } catch (err) {
    handleError(err, res);
  }
}

async function getPostTimelineHandler(req: Request, res: Response) {
  try {
    if (!req.userAuth?._id) {
      const errMsg = "Cennot get posts. You are not logged in";
      logger.error(errMsg);
      return res.status(404).json({ message: errMsg });
    }
    const user = await User.findById(req.userAuth?._id);
    if (!user) {
      const errMsg = "User not found";
      logger.error(errMsg);
      return res.status(404).json({ message: errMsg });
    }
    const posts = await Post.find({
      $or: [
        { creator: req.userAuth?._id },
        { creator: { $in: user.following || [] } },
        { creator: { $in: user.followers || [] } },
      ],
    })
      .select("-__v")
      .sort({ createdAt: -1 })
      .populate([{ path: "comments", strictPopulate: false }]);
    if (!posts) {
      const errMsg = "Unable to get posts";
      logger.error(errMsg);
      return res.status(500).json({ message: errMsg });
    }
    return res.status(200).json({ message: "Posts fetched", data: posts });
  } catch (err) {
    handleError(err, res);
  }
}

async function getPostHandler(req: Request, res: Response) {
  try {
    if (!req.params.id || !mongoose.Types.ObjectId.isValid(req.params.id)) {
      const errMsg = "Invalid post id";
      logger.error(errMsg);
      return res.status(400).json({ message: errMsg });
    }
    const post = await Post.findById(req.params.id)
      .select("-__v")
      .populate([{ path: "comments", strictPopulate: false }]);
    if (!post) {
      const errMsg = "Post not found";
      logger.error(errMsg);
      return res.status(404).json({ message: errMsg });
    }
    return res.status(200).json({ message: "Post fetched", data: post });
  } catch (err) {
    handleError(err, res);
  }
}

async function deletePostHandler(req: Request, res: Response) {
  try {
    if (!req.params.id || !mongoose.Types.ObjectId.isValid(req.params.id)) {
      const errMsg = "Invalid post id";
      logger.error(errMsg);
      return res.status(400).json({ message: errMsg });
    }
    const post = await Post.findById(req.params.id);
    if (!post) {
      const errMsg = "Post not found";
      logger.error(errMsg);
      return res.status(404).json({ message: errMsg });
    }
    if (post.creator.equals(req.userAuth?._id) || req.userAuth?.isAdmin) {
      if (post.imageUrl && post.imageUrl.includes("/")) {
        let publicId = post.imageUrl.split("/").pop()?.split(".")[0];
        if (publicId) {
          try {
            await cloudinary.v2.uploader.destroy(publicId);
            logger.info("Pst image deleted from cloudinary");
          } catch (err) {
            const errMsg = "Unable to delete post image from cloudinary";
            logger.error(errMsg);
            return res.status(500).json({ message: errMsg });
          }
        }
      }
      await post.deleteOne({ _id: req.params.id });
      return res.status(200).json({ message: "Post deleted" });
    } else {
      const errMsg = "You are not authorized to delete this post";
      logger.error(errMsg);
      return res.status(403).json({ message: errMsg });
    }
  } catch (err) {
    handleError(err, res);
  }
}

export {
  createPostHandler,
  updatePostHandler,
  toggleLikePostHandler,
  getPostTimelineHandler,
  getPostHandler,
  deletePostHandler,
};
