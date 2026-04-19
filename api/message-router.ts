import { z } from "zod";
import { createRouter, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { messages, conversations, characters } from "@db/schema";
import { eq, and, sql } from "drizzle-orm";
import { users } from "@db/schema";

export const messageRouter = createRouter({
  list: authedQuery
    .input(z.object({ conversationId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = getDb();

      // Verify conversation belongs to user
      const convoResult = await db
        .select()
        .from(conversations)
        .where(
          and(
            eq(conversations.id, input.conversationId),
            eq(conversations.userId, ctx.user.id)
          )
        );

      if (convoResult.length === 0) {
        throw new Error("Conversation not found");
      }

      return db
        .select()
        .from(messages)
        .where(eq(messages.conversationId, input.conversationId))
        .orderBy(messages.createdAt);
    }),

  send: authedQuery
    .input(
      z.object({
        conversationId: z.number(),
        content: z.string().min(1).max(4000),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();

      // Verify conversation belongs to user
      const convoResult = await db
        .select()
        .from(conversations)
        .where(
          and(
            eq(conversations.id, input.conversationId),
            eq(conversations.userId, ctx.user.id)
          )
        );

      if (convoResult.length === 0) {
        throw new Error("Conversation not found");
      }

      // Insert user message
      await db.insert(messages).values({
        conversationId: input.conversationId,
        role: "user",
        content: input.content,
      });

      // Update conversation last message
      await db
        .update(conversations)
        .set({
          lastMessage: input.content,
          updatedAt: new Date(),
        })
        .where(eq(conversations.id, input.conversationId));

      // Get character info for AI response
      const convo = convoResult[0];
      const charResult = await db
        .select()
        .from(characters)
        .where(eq(characters.id, convo.characterId));

      const character = charResult[0];

      // Get conversation history for context
      const history = await db
        .select()
        .from(messages)
        .where(eq(messages.conversationId, input.conversationId))
        .orderBy(messages.createdAt);

      return {
        character,
        history,
        conversationId: input.conversationId,
      };
    }),

  // This is called after the AI generates a response
  saveAIResponse: authedQuery
    .input(
      z.object({
        conversationId: z.number(),
        content: z.string().min(1),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();

      // Insert AI message
      await db.insert(messages).values({
        conversationId: input.conversationId,
        role: "assistant",
        content: input.content,
      });

      // Update conversation
      await db
        .update(conversations)
        .set({
          lastMessage: input.content,
          updatedAt: new Date(),
        })
        .where(eq(conversations.id, input.conversationId));

      return { success: true };
    }),
  getAIResponse: authedQuery
    .input(z.object({ conversationId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();

      // 1. Verify user has enough credits
      if (ctx.user.credits <= 0) {
        throw new Error("INSUFFICIENT_CREDITS");
      }

      // 2. Get conversation and character info
      const convoResult = await db
        .select()
        .from(conversations)
        .where(
          and(
            eq(conversations.id, input.conversationId),
            eq(conversations.userId, ctx.user.id)
          )
        );

      if (convoResult.length === 0) throw new Error("Conversation not found");
      const convo = convoResult[0];

      const charResult = await db
        .select()
        .from(characters)
        .where(eq(characters.id, convo.characterId));

      const character = charResult[0];
      if (!character) throw new Error("Character not found");

      // 3. NSFW Compliance Check
      if (character.isNsfw && !ctx.user.nsfwEnabled) {
        return {
          content: "I'm sorry, I cannot engage in adult-themed conversations right now. Please enable NSFW content in your profile settings if you wish to continue.",
          filtered: true,
        };
      }

      // 4. Get chat history for context
      const history = await db
        .select()
        .from(messages)
        .where(eq(messages.conversationId, input.conversationId))
        .orderBy(messages.createdAt);

      const lastMessages = history.slice(-10);

      // 5. Construct System Prompt
      let systemPrompt = character.systemPrompt || `You are ${character.name}. ${character.description}. Personality: ${character.personality}.`;
      
      if (convo.customization) {
        const custom = convo.customization as any;
        if (custom.personalityModifier) {
          systemPrompt += ` User Request: Please ${custom.personalityModifier}.`;
        }
        if (custom.style) {
          systemPrompt += ` Respond in a ${custom.style} style.`;
        }
      }

      // 6. Generate Response (using internal fetch to ai-chat or direct logic)
      const apiKey = process.env.OPENAI_API_KEY || process.env.AI_API_KEY;
      let aiResponse: string;

      if (apiKey) {
        try {
          const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
              model: "gpt-3.5-turbo",
              messages: [
                { role: "system", content: systemPrompt },
                ...lastMessages.map((m) => ({ role: m.role, content: m.content })),
              ],
              max_tokens: 150,
              temperature: 0.8,
            }),
          });

          const data = await response.json() as any;
          aiResponse = data.choices?.[0]?.message?.content || "I'm speachless right now.";
        } catch {
          aiResponse = "Let me think about that...";
        }
      } else {
        // Fallback for local testing
        aiResponse = `[*Smiles warmly*] As your ${character.name}, I'm here for you. [Local Test Response]`;
      }

      // 7. Deduct Credit
      await db
        .update(users)
        .set({ credits: sql`${users.credits} - 1` })
        .where(eq(users.id, ctx.user.id));

      // 8. Save Response
      await db.insert(messages).values({
        conversationId: input.conversationId,
        role: "assistant",
        content: aiResponse,
      });

      return {
        content: aiResponse,
        creditsRemaining: ctx.user.credits - 1,
      };
    }),
});
