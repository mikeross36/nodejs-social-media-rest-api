import { Request, Response } from "express";
import User from "../models/userModel";
import logger from "../utils/logger";
import cloudinary from "../utils/cloudinary";
import Post from "../models/postModel";
import Comment from "../models/commentModel";
import handleError from "../utils/handleError";

async function followUserHander(req: Request, res: Response) {
  if (
    req.userAuth &&
    req.userAuth._id &&
    req.params &&
    req.params.id &&
    req.userAuth._id.toString() !== req.params.id
  ) {
    try {
      const user = await User.findById(req.params.id);
      if (!user) {
        const errMsg = "User not found";
        logger.error(errMsg);
        return res.status(404).json({ message: errMsg });
      }
      if (!user.followers?.includes(req.userAuth._id)) {
        const meAsUser = await User.findById(req.userAuth._id);
        await user.updateOne({ $push: { followers: req.userAuth._id } });
        await meAsUser?.updateOne({ $push: { following: req.params.id } });
        return res.status(200).json({ message: "User followed successfully" });
      } else {
        const errMsg = "You are already following this user";
        logger.error(errMsg);
        return res.status(400).json({ message: errMsg });
      }
    } catch (err) {
      const errMsg = "Unable to follow this user";
      logger.error(errMsg);
      return res.status(500).json({ message: errMsg });
    }
  } else {
    const errMsg = "You cannot follow yourself";
    logger.error(errMsg);
    return res.status(403).json({ message: errMsg });
  }
}

async function unfollowUserHander(req: Request, res: Response) {
  if (
    req.userAuth &&
    req.userAuth._id &&
    req.params &&
    req.params.id &&
    req.userAuth._id.toString() !== req.params.id
  ) {
    try {
      const user = await User.findById(req.params.id);
      if (!user) {
        const errMsg = "User not found";
        logger.error(errMsg);
        return res.status(404).json({ message: errMsg });
      }
      if (user.followers?.includes(req.userAuth._id)) {
        const meAsUser = await User.findById(req.userAuth._id);
        await user.updateOne({ $pull: { followers: req.userAuth._id } });
        await meAsUser?.updateOne({ $pull: { following: req.params.id } });
        return res
          .status(200)
          .json({ message: "User unfollowed successfully" });
      } else {
        const errMsg = "You are not following this user";
        logger.error(errMsg);
        return res.status(400).json({ message: errMsg });
      }
    } catch (err) {
      const errMsg = "Unable to unfollow this user";
      logger.error(errMsg);
      return res.status(500).json({ message: errMsg });
    }
  } else {
    const errMsg = "You cannot unfollow yourself";
    logger.error(errMsg);
    return res.status(403).json({ message: errMsg });
  }
}

async function blockUserHander(req: Request, res: Response) {
  if (
    req.userAuth &&
    req.userAuth._id &&
    req.params &&
    req.params.id &&
    req.userAuth._id.toString() !== req.params.id &&
    !req.body.isAdmin
  ) {
    try {
      const user = await User.findById(req.params.id);
      if (!user) {
        const errMsg = "User not found";
        logger.error(errMsg);
        return res.status(404).json({ message: errMsg });
      }
      const meAsUser = await User.findById(req.userAuth._id);
      if (!meAsUser?.blockList?.includes(req.params.id)) {
        await meAsUser?.updateOne({
          $pull: { followers: req.params.id },
          $push: { blockList: req.params.id },
        });
        await user.updateOne({ $pull: { following: req.userAuth._id } });
        return res.status(200).json({ message: "User blocked successfully" });
      } else {
        const errMsg = "You have already blocked this user";
        logger.error(errMsg);
        return res.status(400).json({ message: errMsg });
      }
    } catch (err) {
      const errMsg = "Unable to block this user";
      logger.error(errMsg);
      return res.status(500).json({ message: errMsg });
    }
  } else {
    const errMsg = "You cannot block yourself or admin";
    logger.error(errMsg);
    return res.status(403).json({ message: errMsg });
  }
}

async function unblockUserHander(req: Request, res: Response) {
  if (
    req.userAuth &&
    req.userAuth._id &&
    req.params &&
    req.params.id &&
    req.userAuth._id.toString() !== req.params.id
  ) {
    try {
      const user = await User.findById(req.params.id);
      if (!user) {
        const errMsg = "User not found";
        logger.error(errMsg);
        return res.status(404).json({ message: errMsg });
      }
      const meAsUser = await User.findById(req.userAuth._id);
      if (meAsUser?.blockList?.includes(req.params.id)) {
        await meAsUser?.updateOne({
          $pull: { blockList: req.params.id },
          $push: { followers: req.params.id },
        });
        await user.updateOne({ $push: { following: req.userAuth._id } });
        return res.status(200).json({ message: "User unblocked successfully" });
      } else {
        const errMsg = "You have not blocked this user";
        logger.error(errMsg);
        return res.status(400).json({ message: errMsg });
      }
    } catch (err) {
      const errMsg = "Unable to unblock this user";
      logger.error(errMsg);
      return res.status(500).json({ message: errMsg });
    }
  } else {
    const errMsg = "You cannot unblock yourself";
    logger.error(errMsg);
    return res.status(403).json({ message: errMsg });
  }
}

async function getBlockedUsersHander(req: Request, res: Response) {
  if (req.userAuth && req.userAuth._id) {
    try {
      const user = await User.findOne(
        { _id: req.userAuth._id },
        { blockList: 1 }
      );
      if (!user) {
        const errMsg = "User not found";
        logger.error(errMsg);
        return res.status(404).json({ message: errMsg });
      }
      const blockedUsers = await User.find({
        _id: { $in: user.blockList },
      });
      if (blockedUsers.length === 0) {
        const errMsg = "No blocked users found";
        logger.error(errMsg);
        return res.status(404).json({ message: errMsg });
      }
      await user.populate("blockList", "userName profileImage");
      return res.status(200).json({ data: blockedUsers });
    } catch (err) {
      const errMsg = "Unable to get blocked users";
      logger.error(errMsg);
      return res.status(500).json({ message: errMsg });
    }
  } else {
    const errMsg = "You cannot get blocked users";
    logger.error(errMsg);
    return res.status(403).json({ message: errMsg });
  }
}

async function getUserHandler(req: Request, res: Response) {
  if (req.params && req.params.id) {
    try {
      const user = await User.findById(req.params.id);
      if (!user) {
        const errMsg = "User not found";
        logger.error(errMsg);
        return res.status(404).json({ message: errMsg });
      }
      await user.populate([
        {
          path: "followers",
          select: "userName profileImage",
          strictPopulate: false,
        },
        {
          path: "following",
          select: "userName profileImage",
          strictPopulate: false,
        },
      ]);
      const { updatedAt, ...userData } = user.toObject();
      return res.status(200).json({ data: userData });
    } catch (err) {
      const errMsg = "Unable to get user";
      logger.error(errMsg);
      return res.status(500).json({ message: errMsg });
    }
  } else {
    const errMsg = "You cannot get user";
    logger.error(errMsg);
    return res.status(403).json({ message: errMsg });
  }
}

async function updateUserHandler(req: Request, res: Response) {
  if (
    req.userAuth &&
    req.userAuth._id &&
    req.params &&
    req.params.id &&
    req.userAuth._id.toString() === req.params.id
  ) {
    try {
      let cloudinaryResponse = null;
      if (req.body.profileImage) {
        try {
          cloudinaryResponse = await cloudinary.v2.uploader.upload(
            req.body.profileImage,
            {
              folder: "profileImages",
              quality: "auto",
              fetch_format: "auto",
              optimization: "auto",
            }
          );
        } catch (err) {
          const errMsg = "Unable to upload profile image";
          logger.error(errMsg);
          return res.status(500).json({ message: errMsg });
        }
      }
      const updatedData = {
        ...req.body,
        profileImage: cloudinaryResponse?.secure_url ?? req.body.profileImage,
      };
      const user = await User.findByIdAndUpdate(
        req.params.id,
        { $set: updatedData },
        {
          new: true,
          runValidators: true,
        }
      );
      if (!user) {
        const errMsg = "Failed to update user";
        logger.error(errMsg);
        return res.status(404).json({ message: errMsg });
      }
      return res.status(200).json({ message: "User updated", data: user });
    } catch (err) {
      const errMsg = "Unable to update user";
      logger.error(errMsg);
      return res.status(500).json({ message: errMsg });
    }
  } else {
    const errMsg = "You can only update your own profile";
    logger.error(errMsg);
    return res.status(403).json({ message: errMsg });
  }
}

async function deleteUserHandler(req: Request, res: Response) {
  if (req.userAuth?._id.toString() === req.params.id || req.userAuth?.isAdmin) {
    try {
      const user = await User.findOneAndDelete({
        _id: req.params.id,
        isAdmin: { $ne: true },
      });
      if (!user) {
        return res.status(404).json({ message: "User not found or is admin" });
      }
      if (user.profileImage && user.profileImage.includes("/")) {
        let publicId = user.profileImage.split("/").pop()?.split(".")[0];
        if (
          publicId &&
          process.env.DEFAULT_PROFILE_IMAGE_URL !== user.profileImage
        ) {
          try {
            await cloudinary.v2.uploader.destroy(publicId);
            logger.warn("Profile picture deleted from Cloudinary");
          } catch (err) {
            const errMsg = "Error deleting profile picture from cloudinary";
            logger.error(errMsg);
            return res.status(400).json({ message: errMsg });
          }
        }
      }
      await Promise.all([
        User.updateMany(
          { _id: { $in: user.following } },
          { $pull: { followers: req.params.id } }
        ).catch((err) => logger.error(err.stack)),
        User.updateMany(
          { _id: { $in: user.followers } },
          { $pull: { following: req.params.id, blockList: req.params.id } }
        ).catch((err) => logger.error(err.stack)),
        Post.deleteMany({ creator: req.params.id }).catch((err) =>
          logger.error(err.stack)
        ),
        Post.updateMany(
          { likes: req.params.id },
          { $pull: { likes: req.params.id } }
        ).catch((err) => logger.error(err.stack)),
        Comment.updateMany(
          { likes: req.params.id },
          { $pull: { likes: req.params.id } }
        ).catch((err) => logger.error(err.stack)),
        Comment.deleteMany({ creator: req.params.id }).catch((err) =>
          logger.error(err.stack)
        ),
      ]);
      return res
        .status(200)
        .json({ message: `User with ID ${req.params.id} deleted` });
    } catch (err) {
      handleError(err, res);
    }
  } else {
    return res
      .status(403)
      .json({ message: "You can only delete your own account" });
  }
}

export {
  followUserHander,
  unfollowUserHander,
  blockUserHander,
  unblockUserHander,
  getBlockedUsersHander,
  getUserHandler,
  updateUserHandler,
  deleteUserHandler,
};
