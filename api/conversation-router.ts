import { z } from "zod";
import { createRouter, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { conversations, characters, messages } from "@db/schema";
import { eq, desc, and } from "drizzle-orm";

export const conversationRouter = createRouter({
  list: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    const convos = await db
      .select()
      .from(conversations)
      .where(eq(conversations.userId, ctx.user.id))
      .orderBy(desc(conversations.updatedAt));

    // Get character info for each conversation
    const result = await Promise.all(
      convos.map(async (convo) => {
        const charResult = await db
          .select()
          .from(characters)
          .where(eq(characters.id, convo.characterId));
        return {
          ...convo,
          character: charResult[0] ?? null,
        };
      })
    );

    return result;
  }),

  getById: authedQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = getDb();
      const convoResult = await db
        .select()
        .from(conversations)
        .where(
          and(
            eq(conversations.id, input.id),
            eq(conversations.userId, ctx.user.id)
          )
        );

      if (convoResult.length === 0) return null;

      const convo = convoResult[0];
      const charResult = await db
        .select()
        .from(characters)
        .where(eq(characters.id, convo.characterId));

      return {
        ...convo,
        character: charResult[0] ?? null,
      };
    }),

  create: authedQuery
    .input(
      z.object({
        characterId: z.number(),
        customization: z
          .object({
            avatarOverride: z.string().optional(),
            style: z.enum(["anime", "realistic", "classic"]).optional(),
            personalityModifier: z.string().optional(),
          })
          .optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();

      // Check if conversation already exists
      const existing = await db
        .select()
        .from(conversations)
        .where(
          and(
            eq(conversations.userId, ctx.user.id),
            eq(conversations.characterId, input.characterId)
          )
        );

      if (existing.length > 0) {
        return existing[0];
      }

      const result = await db.insert(conversations).values({
        userId: ctx.user.id,
        characterId: input.characterId,
        customization: input.customization,
        unreadCount: 0,
      });

      const newConvoId = Number(result[0].insertId);
      const convoResult = await db
        .select()
        .from(conversations)
        .where(eq(conversations.id, newConvoId));

      // Create welcome message from character
      const charResult = await db
        .select()
        .from(characters)
        .where(eq(characters.id, input.characterId));

      if (charResult[0]?.greeting) {
        await db.insert(messages).values({
          conversationId: newConvoId,
          role: "assistant",
          content: charResult[0].greeting,
        });
      }

      return convoResult[0];
    }),

  delete: authedQuery
    .input(z.object({ id: z.number() }))
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
