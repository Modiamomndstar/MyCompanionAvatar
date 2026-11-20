import * as cookie from "cookie";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { Session } from "@contracts/constants";
import { users } from "@db/schema";
import { TRPCError } from "@trpc/server";
import { createRouter, authedQuery, publicQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { findUserById, toSafeUser } from "./queries/users";
import { getSessionCookieOptions } from "./lib/cookies";
import { hashPassword, verifyPassword } from "./lib/password";
import { signSessionToken } from "./lib/session";
import { env } from "./lib/env";

export const authRouter = createRouter({
  // Get current user info (never includes passwordHash)
  me: authedQuery.query((opts) => opts.ctx.user),

  // Register a new user
  register: publicQuery
    .input(
      z.object({
        email: z.string().trim().email(),
        password: z.string().min(8, "Password must be at least 8 characters"),
        name: z.string().trim().min(1, "Name is required").max(100),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const email = input.email.toLowerCase();

      const existing = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (existing.length > 0) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "An account with this email already exists",
        });
      }

      const passwordHash = await hashPassword(input.password);
      const role = email === env.ownerEmail ? "admin" : "user";

      const result = await db.insert(users).values({
        email,
        passwordHash,
        name: input.name,
        role,
        credits: 10,
        lastSignInAt: new Date(),
      });

      const userId = Number(result[0].insertId);
      const token = await signSessionToken({ userId, email });

      const cookieOpts = getSessionCookieOptions(ctx.req.headers);
      ctx.resHeaders.append(
        "set-cookie",
        cookie.serialize(Session.cookieName, token, {
          ...cookieOpts,
          maxAge: Session.maxAgeMs / 1000,
        })
      );

      const createdUser = await findUserById(userId);
      return {
        success: true,
        token,
        user: createdUser ? toSafeUser(createdUser) : null,
      };
    }),

  // Login existing user
  login: publicQuery
    .input(
      z.object({
        email: z.string().trim().email(),
        password: z.string().min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const email = input.email.toLowerCase();

      const userResult = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);
      const user = userResult[0];

      if (!user || !user.passwordHash) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid email or password",
        });
      }

      const isValid = await verifyPassword(input.password, user.passwordHash);
      if (!isValid) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid email or password",
        });
      }

      await db
        .update(users)
        .set({ lastSignInAt: new Date() })
        .where(eq(users.id, user.id));

      const token = await signSessionToken({
        userId: user.id,
        email: user.email,
      });

      const cookieOpts = getSessionCookieOptions(ctx.req.headers);
      ctx.resHeaders.append(
        "set-cookie",
        cookie.serialize(Session.cookieName, token, {
          ...cookieOpts,
          maxAge: Session.maxAgeMs / 1000,
        })
      );

      return {
        success: true,
        token,
        user: toSafeUser(user),
      };
    }),

  // Logout
  logout: authedQuery.mutation(async ({ ctx }) => {
    const opts = getSessionCookieOptions(ctx.req.headers);
    ctx.resHeaders.append(
      "set-cookie",
      cookie.serialize(Session.cookieName, "", {
        ...opts,
        maxAge: 0,
      })
    );
    return { success: true };
  }),

  // Update settings (NSFW toggle, display name, etc.)
  updateSettings: authedQuery
    .input(
      z.object({
        nsfwEnabled: z.boolean().optional(),
        name: z.string().trim().min(1).max(100).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const updates: Partial<{ nsfwEnabled: boolean; name: string }> = {};
      if (input.nsfwEnabled !== undefined) {
        updates.nsfwEnabled = input.nsfwEnabled;
      }
      if (input.name !== undefined) {
        updates.name = input.name;
      }

      if (Object.keys(updates).length > 0) {
        await db.update(users).set(updates).where(eq(users.id, ctx.user.id));
      }
      return { success: true };
    }),

  // Delete account (required by Apple App Store, Google Play & GDPR)
  deleteAccount: authedQuery.mutation(async ({ ctx }) => {
    const db = getDb();
    await db.delete(users).where(eq(users.id, ctx.user.id));

    const opts = getSessionCookieOptions(ctx.req.headers);
    ctx.resHeaders.append(
      "set-cookie",
      cookie.serialize(Session.cookieName, "", {
        ...opts,
        maxAge: 0,
      })
    );
    return { success: true };
  }),
});
