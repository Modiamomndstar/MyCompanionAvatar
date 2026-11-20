import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import type { SafeUser } from "@db/schema";
import * as cookie from "cookie";
import { Session } from "@contracts/constants";
import { verifySessionToken } from "./lib/session";
import { findUserById, toSafeUser } from "./queries/users";

export type TrpcContext = {
  req: Request;
  resHeaders: Headers;
  user?: SafeUser;
};

function extractToken(req: Request): string | undefined {
  // 1. Mobile / API clients: Authorization: Bearer <token>
  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const bearer = authHeader.slice(7).trim();
    if (bearer) return bearer;
  }

  // 2. Web clients: httpOnly session cookie
  const cookies = cookie.parse(req.headers.get("cookie") || "");
  return cookies[Session.cookieName];
}

export async function createContext(
  opts: FetchCreateContextFnOptions
): Promise<TrpcContext> {
  const ctx: TrpcContext = { req: opts.req, resHeaders: opts.resHeaders };

  try {
    const token = extractToken(opts.req);

    if (token) {
      const payload = await verifySessionToken(token);
      if (payload) {
        const user = await findUserById(payload.userId);
        if (user) {
          ctx.user = toSafeUser(user);
        }
      }
    }
  } catch (err) {
    console.error("[Auth Context Error]", err);
  }

  return ctx;
}
