import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createRouter, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { conversations, characters, messages } from "@db/schema";
import { eq, desc, and } from "drizzle-orm";

export const conversationRouter = createRouter({
  // Single JOIN query instead of N+1
  list: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    const rows = await db
      .select({
        conversation: conversations,
        character: characters,
      })
      .from(conversations)
      .leftJoin(characters, eq(conversations.characterId, characters.id))
      .where(eq(conversations.userId, ctx.user.id))
      .orderBy(desc(conversations.updatedAt));

    return rows.map((row) => ({
      ...row.conversation,
      character: row.character ?? null,
    }));
  }),

  getById: authedQuery
    .input(z.object({ id: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      const db = getDb();
      const rows = await db
        .select({
          conversation: conversations,
          character: characters,
        })
        .from(conversations)
        .leftJoin(characters, eq(conversations.characterId, characters.id))
        .where(
          and(
            eq(conversations.id, input.id),
            eq(conversations.userId, ctx.user.id)
          )
        )
        .limit(1);

      if (rows.length === 0) return null;

      return {
        ...rows[0].conversation,
        character: rows[0].character ?? null,
      };
    }),

  create: authedQuery
    .input(
      z.object({
        characterId: z.number().int().positive(),
        customization: z
          .object({
            avatarOverride: z.string().optional(),
            style: z.enum(["anime", "realistic", "classic"]).optional(),
            personalityModifier: z.string().max(300).optional(),
          })
          .optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();

      const charResult = await db
        .select()
        .from(characters)
        .where(eq(characters.id, input.characterId))
        .limit(1);

      const character = charResult[0];
      if (!character) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Character not found",
        });
      }

      // Check if conversation already exists
      const existing = await db
        .select()
        .from(conversations)
        .where(
          and(
            eq(conversations.userId, ctx.user.id),
            eq(conversations.characterId, input.characterId)
          )
        )
        .limit(1);

      if (existing.length > 0) {
        return existing[0];
      }

      const result = await db.insert(conversations).values({
        userId: ctx.user.id,
        characterId: input.characterId,
        customization: input.customization,
        lastMessage: character.greeting ?? null,
        unreadCount: 0,
      });

      const newConvoId = Number(result[0].insertId);
      const convoResult = await db
        .select()
        .from(conversations)
        .where(eq(conversations.id, newConvoId))
        .limit(1);

      if (character.greeting) {
        await db.insert(messages).values({
          conversationId: newConvoId,
          role: "assistant",
          content: character.greeting,
        });
      }

      return convoResult[0];
    }),

  delete: authedQuery
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      await db
        .delete(conversations)
        .where(
          and(
            eq(conversations.id, input.id),
            eq(conversations.userId, ctx.user.id)
          )
        );
      return { success: true };
    }),
});
