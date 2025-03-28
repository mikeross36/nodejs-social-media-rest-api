import { Request, Response } from "express";
import User from "../models/userModel";
import cloudinary from "../utils/cloudinary";
import logger from "../utils/logger";
import handleError from "../utils/handleError";
import { signToken } from "../utils/jwtUtils";

const jwtExpiresIn = process.env.JWT_EXPIRES;

async function registerUserHandler(req: Request, res: Response) {
  try {
    const { userName, email, password, profileImage } = req.body;
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }
    let cludinaryResponse = null;
    if (profileImage) {
      try {
        cludinaryResponse = await cloudinary.v2.uploader.upload(profileImage, {
          folder: "profileImages",
          quality: "auto",
          fetch_format: "auto",
          optimization: "auto",
        });
      } catch (err) {
        logger.error(err instanceof Error ? err.stack : err);
        return res
          .status(500)
          .json({ message: "Failed to upload profile image" });
      }
    }
    const user = await User.create({
      userName,
      email,
      password,
      profileImage: cludinaryResponse?.secure_url ?? profileImage,
    });
    if (!user) {
      return res.status(400).json({ message: "Failed to create user" });
    }
    return res
      .status(201)
      .json({ message: "User created successfully", data: user });
  } catch (err) {
    handleError(err, res);
  }
}

async function loginUserHandler(req: Request, res: Response) {
  try {
    const errMsg = "Invalid email or password";
    const user = await User.findOne({ email: req.body.email }).select(
      "+password"
    );
    if (!user || !(await user.matchPasswords(req.body.password))) {
      return res.status(401).json({ message: errMsg });
    }
    const token = signToken(user._id);
    if (!token) {
      return res.status(500).json({ message: "Failed to generate token" });
    }
    const cookieOptions = {
      expires: new Date(Date.now() + Number(jwtExpiresIn) * 60 * 1000),
      httpOnly: true,
      sameSite: "none" as const,
      secure: process.env.NODE_ENV === "production",
    };
    res.cookie("jwt", token, cookieOptions);
    return res.status(200).json({ message: "User logged in ", data: token });
  } catch (err) {
    handleError(err, res);
  }
}

async function logoutUserHandler(req: Request, res: Response) {
  try {
    const user = req.userAuth;
    if (!user) {
      return res
        .status(401)
        .json({ message: "Failed to logout. Invalid user info" });
    }
    const cookieOptions = {
      httpOnly: true,
      sameSite: "none" as const,
      secure: process.env.NODE_ENV === "production",
    };
    res.clearCookie("jwt", cookieOptions);
    return res.status(200).json({ message: "User logged out" });
  } catch (err) {
    handleError(err, res);
  }
}

async function changePasswordHandler(req: Request, res: Response) {
  try {
    if (!res.locals.user) {
      return res.status(401).json({ message: "Unauthorized! User not found" });
    }
    const user = res.locals.user;
    if (!user || !(await user.matchPasswords(req.body.currentPassword))) {
      return res
        .status(401)
        .json({ message: "Unauthorized! Invalid current password" });
    }
    try {
      user.password = req.body.password;
      await user.save();
      return res.status(200).json({ message: "Password changed successfully" });
    } catch (err) {
      logger.error(err instanceof Error ? err.stack : err);
      return res.status(401).json({ message: "Error changing password" });
    }
  } catch (err) {
    handleError(err, res);
  }
}
export {
  registerUserHandler,
  loginUserHandler,
  logoutUserHandler,
  changePasswordHandler,
};
