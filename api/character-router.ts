import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createRouter, publicQuery, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { characters } from "@db/schema";
import { eq, like, or, desc, and } from "drizzle-orm";

export const characterRouter = createRouter({
  list: publicQuery.query(async ({ ctx }) => {
    const db = getDb();
    const showNsfw = ctx.user?.nsfwEnabled ?? false;
    const visibilityFilter = ctx.user
      ? or(
          eq(characters.isPublic, true),
          eq(characters.creatorId, ctx.user.id)
        )
      : eq(characters.isPublic, true);

    return db
      .select()
      .from(characters)
      .where(
        showNsfw
          ? visibilityFilter
          : and(visibilityFilter, eq(characters.isNsfw, false))
      )
      .orderBy(desc(characters.messageCount));
  }),

  byCategory: publicQuery
    .input(z.object({ category: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const db = getDb();
      const showNsfw = ctx.user?.nsfwEnabled ?? false;
      const visibilityFilter = ctx.user
        ? or(
            eq(characters.isPublic, true),
            eq(characters.creatorId, ctx.user.id)
          )
        : eq(characters.isPublic, true);

      return db
        .select()
        .from(characters)
        .where(
          showNsfw
            ? and(visibilityFilter, eq(characters.category, input.category))
            : and(
                visibilityFilter,
                eq(characters.category, input.category),
                eq(characters.isNsfw, false)
              )
        )
        .orderBy(desc(characters.messageCount));
    }),

  getById: publicQuery
    .input(z.object({ id: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      const db = getDb();
      const results = await db
        .select()
        .from(characters)
        .where(eq(characters.id, input.id))
        .limit(1);

      const char = results[0];
      if (!char) return null;
      if (!char.isPublic && char.creatorId !== ctx.user?.id) {
        return null;
      }
      return char;
    }),

  search: publicQuery
    .input(
      z.object({
        query: z.string().max(100),
        category: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = getDb();
      const showNsfw = ctx.user?.nsfwEnabled ?? false;
      const trimmed = input.query.trim();
      const visibilityFilter = ctx.user
        ? or(
            eq(characters.isPublic, true),
            eq(characters.creatorId, ctx.user.id)
          )
        : eq(characters.isPublic, true);

      const conditions = [visibilityFilter];

      if (!showNsfw) {
        conditions.push(eq(characters.isNsfw, false));
      }

      if (input.category && input.category !== "All") {
        conditions.push(eq(characters.category, input.category));
      }

      if (trimmed) {
        const textMatch = or(
          like(characters.name, `%${trimmed}%`),
          like(characters.description, `%${trimmed}%`),
          like(characters.category, `%${trimmed}%`)
        );
        if (textMatch) conditions.push(textMatch);
      }

      return db
        .select()
        .from(characters)
        .where(and(...conditions))
        .orderBy(desc(characters.messageCount));
    }),

  create: authedQuery
    .input(
      z.object({
        name: z.string().trim().min(1).max(255),
        avatar: z.string().min(1).max(2_000_000),
        description: z.string().trim().min(1).max(1000),
        personality: z.string().trim().min(1).max(2000),
        category: z.string().trim().min(1).max(100),
        greeting: z.string().trim().max(1000).optional(),
        physicalDescription: z.string().trim().max(1000).optional(),
        isPublic: z.boolean().default(true),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const result = await db.insert(characters).values({
        ...input,
        creatorId: ctx.user.id,
        messageCount: 0,
      });
      return { id: Number(result[0].insertId) };
    }),

  myCharacters: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    return db
      .select()
      .from(characters)
      .where(eq(characters.creatorId, ctx.user.id))
      .orderBy(desc(characters.createdAt));
  }),

  delete: authedQuery
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const char = await db
        .select({ id: characters.id })
        .from(characters)
        .where(
          and(
            eq(characters.id, input.id),
            eq(characters.creatorId, ctx.user.id)
          )
        )
        .limit(1);

      if (char.length === 0) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Character not found or not authorized",
        });
      }

      await db.delete(characters).where(eq(characters.id, input.id));
      return { success: true };
    }),
});
