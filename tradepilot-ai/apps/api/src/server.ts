import express from "express";
import cors from "cors";
import helmet from "helmet";
import { env } from "./config/env.js";
import { router } from "./routes/index.js";

const app = express();
app.use(helmet());
app.use(cors({ origin: env.webOrigin.split(",").map((x) => x.trim()), credentials: true }));
app.use(express.json({ limit: "1mb" }));
app.use("/api", router);

app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  const err = error as Error & { issues?: unknown; attempts?: unknown };
  const status = err.name === "ZodError" ? 400 : 500;
  res.status(status).json({
    error: err.message || "Internal server error",
    ...(err.issues ? { issues: err.issues } : {}),
    ...(err.attempts ? { attempts: err.attempts } : {})
  });
});

app.listen(env.port, () => {
  console.log(`TradePilot API listening on http://localhost:${env.port}`);
});
