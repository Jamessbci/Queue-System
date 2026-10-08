import express from "express";
import cookieParser from "cookie-parser";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createAuthRoutes } from "./server/authRoutes.js";
import { createQueueRoutes } from "./server/queueRoutes.js";
import { createStorage } from "./server/storage.js";

const app = express();
const port = Number(process.env.PORT) || 3001;
const dataDirectory = process.env.QUEUE_DATA_DIR || join(dirname(fileURLToPath(import.meta.url)), "data");
const storage = createStorage(dataDirectory);
const auth = createAuthRoutes(storage, storage.getAuthSecret());

app.use(express.json());
app.use(cookieParser());
app.use("/api/auth", auth.router);
app.use("/api", createQueueRoutes({
  storage,
  authenticate: auth.authenticate,
  requireRoles: auth.requireRoles,
}));

app.listen(port, () => {
  console.log(`Queue API listening on http://localhost:${port}`);
});
