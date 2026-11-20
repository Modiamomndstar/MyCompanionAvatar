import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import { cors } from "hono/cors";
import { secureHeaders } from "hono/secure-headers";
import type { HttpBindings } from "@hono/node-server";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { sql } from "drizzle-orm";
import { appRouter } from "./router";
import { createContext } from "./context";
import { env } from "./lib/env";
import { rateLimit } from "./lib/rate-limit";
import { getDb } from "./queries/connection";

const app = new Hono<{ Bindings: HttpBindings }>();

app.use("*", secureHeaders());

app.use(
  "/api/*",
  cors({
    origin: (origin) => {
      if (!origin) return env.corsOrigins[0] ?? "*";
      if (env.corsOrigins.includes(origin) || env.corsOrigins.includes("*")) {
        return origin;
      }
      return "";
    },
    credentials: true,
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(bodyLimit({ maxSize: 10 * 1024 * 1024 }));

// Health check endpoint (for Docker, load balancers, uptime monitors)
app.get("/api/health", async (c) => {
  try {
    await getDb().execute(sql`SELECT 1`);
    return c.json({
      status: "ok",
      service: "MyCompanionAvatar",
      timestamp: new Date().toISOString(),
    });
  } catch {
    return c.json(
      {
        status: "degraded",
        service: "MyCompanionAvatar",
        database: "unreachable",
        timestamp: new Date().toISOString(),
      },
      503
    );
  }
});

// Rate limiting on API endpoints
app.use(
  "/api/trpc/*",
  rateLimit({
    windowMs: 60 * 1000,
    max: 120,
    keyPrefix: "trpc",
  })
);

// tRPC endpoint
app.use("/api/trpc/*", async (c) => {
  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req: c.req.raw,
    router: appRouter,
    createContext,
  });
});

app.all("/api/*", (c) => c.json({ error: "Not Found" }, 404));

export default app;

if (env.isProduction) {
  const { serve } = await import("@hono/node-server");
  const { serveStaticFiles } = await import("./lib/vite");
  serveStaticFiles(app);

  serve({ fetch: app.fetch, port: env.port }, () => {
    console.log(`MyCompanionAvatar server running on port ${env.port}`);
  });
}
