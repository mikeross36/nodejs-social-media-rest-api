import mongoose from "mongoose";

export type UserType = {
  _id: string;
  userName: string;
  email: string;
  password: string;
  profileImage?: string;
  isAdmin?: boolean;
  gender?: string;
  description?: string;
  city?: string;
  country?: string;
  followers?: string[];
  following?: string[];
  blockList?: string[];
  createdAt?: Date;
  updatedAt?: Date;
  matchPasswords(enteredPassword: string): Promise<boolean>;
};
