import mongoose, { MongooseError } from "mongoose";
import logger from "../utils/logger";

const mongoDbUserName = process.env.MONGODB_USER_NAME;
const mongoDbPassword = process.env.MONGODB_PASSWORD;
const mongoDbName = process.env.MONGODB_NAME;

const dbUri = `mongodb+srv://${mongoDbUserName}:${mongoDbPassword}@nodecluster.ggolz.mongodb.net/${mongoDbName}?retryWrites=true&w=majority&appName=NodeCluster`;

const RETRY_DELAY = 5000;

async function shutdown() {
  await mongoose.connection.close();
  process.exit(1);
}

async function connectDb() {
  try {
    await mongoose.connect(dbUri, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 10000,
      heartbeatFrequencyMS: 30000,
    });
    logger.info("Database connected...");
  } catch (err) {
    if (err instanceof MongooseError) {
      logger.error(err.message, "Database connection failed");
      const timer = setTimeout(() => {
        connectDb();
        shutdown();
      }, RETRY_DELAY);
      return () => {
        clearTimeout(timer);
        mongoose.connection.on("disconnected", () =>
          logger.warn("Database disconnected, attempting reconnection")
        );
      };
    }
  }
}

export default connectDb;
