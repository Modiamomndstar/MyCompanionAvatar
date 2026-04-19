import * as cookie from "cookie";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { Session } from "@contracts/constants";
import { users } from "@db/schema";
import { createRouter, authedQuery, publicQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { getSessionCookieOptions } from "./lib/cookies";
import { hashPassword, verifyPassword } from "./lib/password";
import { signSessionToken } from "./lib/session";

export const authRouter = createRouter({
  // Get current user info
  me: authedQuery.query((opts) => opts.ctx.user),

  // Register a new user
  register: publicQuery
    .input(z.object({
      email: z.string().email(),
      password: z.string().min(6),
      name: z.string().min(1)
    }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      
      // Check if user already exists
      const existing = await db.select().from(users).where(eq(users.email, input.email)).limit(1);
      if (existing.length > 0) {
        throw new Error("User with this email already exists");
      }

      const passwordHash = await hashPassword(input.password);
      
      // Create user (starting credits: 10)
      const result = await db.insert(users).values({
        email: input.email,
        passwordHash: passwordHash,
        name: input.name,
        credits: 10,
        lastSignInAt: new Date(),
      });

      const userId = Number(result[0].insertId);
      const token = await signSessionToken({ userId, email: input.email });

      // Set cookie
      const cookieOpts = getSessionCookieOptions(ctx.req.headers);
      ctx.resHeaders.append(
        "set-cookie",
        cookie.serialize(Session.cookieName, token, {
          ...cookieOpts,
          maxAge: Session.maxAgeMs / 1000,
        })
      );

      return { success: true };
    }),

  // Login existing user
  login: publicQuery
    .input(z.object({
      email: z.string().email(),
      password: z.string()
    }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();

      const userResult = await db.select().from(users).where(eq(users.email, input.email)).limit(1);
      const user = userResult[0];

      if (!user || !user.passwordHash) {
        throw new Error("Invalid email or password");
      }

      const isValid = await verifyPassword(input.password, user.passwordHash);
      if (!isValid) {
        throw new Error("Invalid email or password");
      }

      const token = await signSessionToken({ userId: user.id, email: user.email });

      // Set cookie
      const cookieOpts = getSessionCookieOptions(ctx.req.headers);
      ctx.resHeaders.append(
        "set-cookie",
        cookie.serialize(Session.cookieName, token, {
          ...cookieOpts,
          maxAge: Session.maxAgeMs / 1000,
        })
      );

      return { success: true };
    }),

  // Logout
  logout: authedQuery.mutation(async ({ ctx }) => {
    const opts = getSessionCookieOptions(ctx.req.headers);
    ctx.resHeaders.append(
      "set-cookie",
      cookie.serialize(Session.cookieName, "", {
        ...opts,
        maxAge: 0,
      }),
    );
    return { success: true };
  }),

  // Update settings (NSFW Toggle, etc)
  updateSettings: authedQuery
    .input(z.object({ nsfwEnabled: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      await db
        .update(users)
        .set({ nsfwEnabled: input.nsfwEnabled })
        .where(eq(users.id, ctx.user.id));
      return { success: true };
    }),
});
