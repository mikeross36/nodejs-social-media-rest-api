import { Response } from "express";
import logger from "./logger";

function handleError(err: any, res: Response) {
  const errMsg =
    err instanceof Error ? err.message : "Un unknown error occured";
  logger.error(err instanceof Error ? err.stack : errMsg);
  return res.status(500).json({ message: errMsg });
}

export default handleError;
