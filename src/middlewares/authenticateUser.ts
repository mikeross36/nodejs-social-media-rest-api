import { Request, Response, NextFunction } from "express";
import { getRequestToken, verifyToken } from "../utils/jwtUtils";
import User from "../models/userModel";
import logger from "../utils/logger";
import handleError from "../utils/handleError";
import { JsonWebTokenError } from "jsonwebtoken";

declare global {
  namespace Express {
    interface Request {
      userAuth?: {
        _id: string;
        isAdmin?: boolean;
      };
    }
  }
}

const errMsg = "Invalid or expired token or you just not logged in";

export default async function authenticateUser(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const token = getRequestToken(req);
    if (!token) {
      return res.status(401).json({ message: errMsg });
    }
    const verified = verifyToken(token);
    if (!verified || typeof verified === "string") {
      return res.status(401).json({ message: errMsg });
    }
    const user = await User.findById(verified.userId).select("+password");
    if (!user) {
      return res.status(401).json({ message: errMsg });
    }
    req.userAuth = user;
    res.locals.user = user;
    next();
  } catch (err) {
    if (err instanceof JsonWebTokenError) {
      logger.error(err.message);
      return res.status(401).json({ message: errMsg });
    }
  }
}
