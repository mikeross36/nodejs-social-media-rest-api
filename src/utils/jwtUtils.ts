import { Request } from "express";
import jwt from "jsonwebtoken";

const jwtSecretKey = process.env.JWT_SECRET_KEY;
const jwtExpiresIn = process.env.JWT_EXPIRES;

function signToken(userId: string) {
  if (!userId) {
    throw new Error("Failed to generate token");
  }
  if (!jwtSecretKey) {
    throw new Error("JWT secret key is not defined");
  }
  return jwt.sign(
    { userId, iat: Math.floor(Date.now() / 1000) },
    jwtSecretKey,
    { expiresIn: `${Number(jwtExpiresIn)}m`, algorithm: "HS256" }
  );
}

function verifyToken(token: string) {
  try {
    if (!token || typeof token !== "string") {
      throw new Error("Token parameter not provided");
    }
    if (!jwtSecretKey) {
      throw new Error("JWT secret key is not configured");
    }
    const verified = jwt.verify(token, jwtSecretKey);
    return verified;
  } catch (err) {
    throw new Error("Failed to verify token");
  }
}

function getRequestToken(req: Request) {
  const token = req.headers.authorization?.split(" ")[1] ?? req.cookies?.jwt;
  if (!token || typeof token !== "string") {
    return null;
  }
  return token;
}

export { signToken, verifyToken, getRequestToken };
