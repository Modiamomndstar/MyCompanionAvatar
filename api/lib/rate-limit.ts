import type { MiddlewareHandler } from "hono";

type Bucket = {
  count: number;
  resetAt: number;
};

/**
 * Simple in-memory fixed-window rate limiter for single-instance deployments.
 * For multi-instance horizontal scaling, replace the Map with Redis.
 */
export function rateLimit(opts: {
  windowMs: number;
  max: number;
  keyPrefix?: string;
}): MiddlewareHandler {
  const store = new Map<string, Bucket>();

  return async (c, next) => {
    const now = Date.now();
    const ip =
      c.req.header("x-forwarded-for")?.split(",")[0]?.trim() ||
      c.req.header("x-real-ip") ||
      "unknown";
    const key = `${opts.keyPrefix ?? "rl"}:${ip}`;

    const bucket = store.get(key);
    if (!bucket || now > bucket.resetAt) {
      store.set(key, { count: 1, resetAt: now + opts.windowMs });
    } else {
      bucket.count += 1;
      if (bucket.count > opts.max) {
        const retryAfter = Math.ceil((bucket.resetAt - now) / 1000);
        c.header("Retry-After", String(Math.max(1, retryAfter)));
        return c.json(
          { error: "Too many requests. Please try again shortly." },
          429
        );
      }
    }

    // Periodic cleanup to prevent unbounded growth
    if (store.size > 10_000) {
      for (const [k, v] of store.entries()) {
        if (now > v.resetAt) store.delete(k);
      }
    }

    await next();
  };
}
