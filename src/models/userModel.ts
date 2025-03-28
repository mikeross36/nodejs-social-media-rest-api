import mongoose from "mongoose";
import { UserType } from "../@types";
import argon2 from "argon2";

const userSchema = new mongoose.Schema<UserType>(
  {
    userName: {
      type: String,
      required: true,
      minLength: [3, "Username must be at least 3 characters long"],
      maxLength: [20, "Username must be at most 20 characters long"],
      trim: true,
    },
    email: {
      type: String,
      required: true,
      minLength: [3, "Email must be at least 3 characters long"],
      maxLength: [20, "Email must be at most 20 characters long"],
      unique: true,
      trim: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        "Please provide a valid email address",
      ],
    },
    password: {
      type: String,
      required: true,
      minLength: [8, "Password must be at least 8 characters long"],
      maxLength: [20, "Password must be at most 20 characters long"],
      select: false,
    },
    isAdmin: {
      type: Boolean,
      default: false,
    },
    gender: { type: String, enum: ["male", "female", "other"] },
    profileImage: {
      type: String,
      default: process.env.DEFAULT_PROFILE_IMAGE_URL,
    },
    description: {
      type: String,
      minLength: [3, "Description must be at least 3 characters long"],
      maxLength: [200, "Description must be at most 200 characters long"],
      trim: true,
    },
    city: {
      type: String,
      maxLength: [50, "City must be at most 50 charcters long"],
    },
    country: {
      type: String,
      maxLength: [50, "Country must be at most 50 charcters long"],
    },
    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    following: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    blockList: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await argon2.hash(this.password);
  next();
});

userSchema.methods.matchPasswords = async function (enteredPassword: string) {
  return await argon2.verify(this.password, enteredPassword);
};

const User = mongoose.model("User", userSchema);

export default User;
