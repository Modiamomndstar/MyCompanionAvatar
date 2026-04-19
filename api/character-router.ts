import { z } from "zod";
import { createRouter, publicQuery, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { characters } from "@db/schema";
import { eq, like, or, desc, and } from "drizzle-orm";

export const characterRouter = createRouter({
  list: publicQuery.query(async ({ ctx }) => {
    const db = getDb();
    const showNsfw = ctx.user?.nsfwEnabled ?? false;
    
    if (showNsfw) {
      return db.select().from(characters).orderBy(desc(characters.messageCount));
    }
    
    return db
      .select()
      .from(characters)
      .where(eq(characters.isNsfw, false))
      .orderBy(desc(characters.messageCount));
  }),

  byCategory: publicQuery
    .input(z.object({ category: z.string() }))
    .query(async ({ ctx, input }) => {
      const db = getDb();
      const showNsfw = ctx.user?.nsfwEnabled ?? false;

      if (showNsfw) {
        return db
          .select()
          .from(characters)
          .where(eq(characters.category, input.category))
          .orderBy(desc(characters.messageCount));
      }

      return db
        .select()
        .from(characters)
        .where(
          and(
            eq(characters.category, input.category),
            eq(characters.isNsfw, false)
          )
        )
        .orderBy(desc(characters.messageCount));
    }),

  getById: publicQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      const results = await db
        .select()
        .from(characters)
        .where(eq(characters.id, input.id));
      return results[0] ?? null;
    }),

  search: publicQuery
    .input(z.object({ query: z.string() }))
    .query(async ({ ctx, input }) => {
      const db = getDb();
      const showNsfw = ctx.user?.nsfwEnabled ?? false;

      const baseFilter = or(
        like(characters.name, `%${input.query}%`),
        like(characters.description, `%${input.query}%`),
        like(characters.category, `%${input.query}%`)
      );

      return db
        .select()
        .from(characters)
        .where(
          showNsfw 
            ? baseFilter 
            : and(baseFilter, eq(characters.isNsfw, false))
        )
        .orderBy(desc(characters.messageCount));
    }),

  create: authedQuery
    .input(
      z.object({
        name: z.string().min(1).max(255),
        avatar: z.string().min(1),
        description: z.string().min(1),
        personality: z.string().min(1),
        category: z.string().min(1),
        greeting: z.string().optional(),
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
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      // Only allow deleting own characters
      const char = await db
        .select()
        .from(characters)
        .where(
          and(
            eq(characters.id, input.id),
            eq(characters.creatorId, ctx.user.id)
          )
        );
      if (char.length === 0) {
        throw new Error("Character not found or not authorized");
      }
      await db.delete(characters).where(eq(characters.id, input.id));
      return { success: true };
    }),
});
