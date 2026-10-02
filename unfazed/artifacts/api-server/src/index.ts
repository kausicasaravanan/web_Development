import app from "./app";
import { logger } from "./lib/logger";
import mongoose from "mongoose";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

const mongoUri = process.env.MONGO_URI;
if (!mongoUri) {
  throw new Error("MONGO_URI must be set before the API server can start.");
}

if (!process.env.SESSION_SECRET) {
  throw new Error("SESSION_SECRET must be set before the API server can start.");
}

try {
  await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 10000 });
  logger.info("MongoDB connection established");

  app.listen(port, (err) => {
    if (err) {
      logger.error({ err }, "Error listening on port");
      process.exit(1);
    }

    logger.info({ port }, "Server listening");
  });
} catch (err) {
  logger.error({ err }, "Unable to connect to MongoDB");
  process.exit(1);
}
