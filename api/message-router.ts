import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createRouter, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { messages, conversations, characters, users } from "@db/schema";
import { eq, and, gt, sql } from "drizzle-orm";
import { env } from "./lib/env";

type OpenAIChatResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
};

export const messageRouter = createRouter({
  list: authedQuery
    .input(z.object({ conversationId: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      const db = getDb();

      const convoResult = await db
        .select({ id: conversations.id })
        .from(conversations)
        .where(
          and(
            eq(conversations.id, input.conversationId),
            eq(conversations.userId, ctx.user.id)
          )
        )
        .limit(1);

      if (convoResult.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Conversation not found",
        });
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
        conversationId: z.number().int().positive(),
        content: z.string().trim().min(1).max(4000),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();

      const convoResult = await db
        .select()
        .from(conversations)
        .where(
          and(
            eq(conversations.id, input.conversationId),
            eq(conversations.userId, ctx.user.id)
          )
        )
        .limit(1);

      if (convoResult.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Conversation not found",
        });
      }

      const convo = convoResult[0];

      await db.insert(messages).values({
        conversationId: input.conversationId,
        role: "user",
        content: input.content,
      });

      await db
        .update(conversations)
        .set({
          lastMessage: input.content,
          updatedAt: new Date(),
        })
        .where(eq(conversations.id, input.conversationId));

      await db
        .update(characters)
        .set({ messageCount: sql`${characters.messageCount} + 1` })
        .where(eq(characters.id, convo.characterId));

      return { conversationId: input.conversationId };
    }),

  getAIResponse: authedQuery
    .input(z.object({ conversationId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();

      // 1. Verify conversation ownership & load character
      const convoResult = await db
        .select()
        .from(conversations)
        .where(
          and(
            eq(conversations.id, input.conversationId),
            eq(conversations.userId, ctx.user.id)
          )
        )
        .limit(1);

      const convo = convoResult[0];
      if (!convo) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Conversation not found",
        });
      }

      const charResult = await db
        .select()
        .from(characters)
        .where(eq(characters.id, convo.characterId))
        .limit(1);

      const character = charResult[0];
      if (!character) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Character not found",
        });
      }

      // 2. NSFW Compliance Check
      if (character.isNsfw && !ctx.user.nsfwEnabled) {
        return {
          content:
            "I'm sorry, I cannot engage in adult-themed conversations right now. Please enable adult content in your profile settings if you wish to continue.",
          filtered: true,
          creditsRemaining: ctx.user.credits,
        };
      }

      // 3. Atomic credit deduction (prevents race conditions & negative balances)
      const [deductResult] = await db
        .update(users)
        .set({ credits: sql`${users.credits} - 1` })
        .where(and(eq(users.id, ctx.user.id), gt(users.credits, 0)));

      if (!deductResult || deductResult.affectedRows === 0) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "INSUFFICIENT_CREDITS",
        });
      }

      // 4. Get recent chat history for context
      const history = await db
        .select()
        .from(messages)
        .where(eq(messages.conversationId, input.conversationId))
        .orderBy(messages.createdAt);

      const lastMessages = history.slice(-15);

      // 5. Construct System Prompt
      let systemPrompt =
        character.systemPrompt ||
        `You are ${character.name}. ${character.description}. Personality: ${character.personality}.`;

      if (convo.customization) {
        if (convo.customization.personalityModifier) {
          systemPrompt += ` User Request: Please ${convo.customization.personalityModifier}.`;
        }
        if (convo.customization.style) {
          systemPrompt += ` Respond in a ${convo.customization.style} style.`;
        }
      }

      if (character.sharingEnabled && character.physicalDescription) {
        systemPrompt += `\n\nVISUAL SHARING RULE: If the user asks for a photo of you, include the tag [GENERATE_IMAGE: brief description of you in the current scene] in your response. Your physical appearance is: ${character.physicalDescription}. ALWAYS maintain this appearance.`;
      }

      // 6. Generate AI Response
      let aiResponse: string;
      if (env.aiApiKey) {
        try {
          const response = await fetch(`${env.aiBaseUrl}/chat/completions`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${env.aiApiKey}`,
            },
            body: JSON.stringify({
              model: env.aiModel,
              messages: [
                { role: "system", content: systemPrompt },
                ...lastMessages.map((m) => ({
                  role: m.role,
                  content: m.content,
                })),
              ],
              max_tokens: 500,
              temperature: 0.8,
            }),
          });

          if (!response.ok) {
            throw new Error(`AI provider returned ${response.status}`);
          }

          const data = (await response.json()) as OpenAIChatResponse;
          aiResponse =
            data.choices?.[0]?.message?.content?.trim() ||
            "I'm speechless right now—tell me more.";
        } catch (err) {
          // Refund credit if upstream AI call failed
          await db
            .update(users)
            .set({ credits: sql`${users.credits} + 1` })
            .where(eq(users.id, ctx.user.id));
          console.error("[AI Generation Error]", err);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "AI service is temporarily unavailable. Your credit was not deducted.",
          });
        }
      } else {
        aiResponse = `*smiles warmly* As ${character.name}, I'm here with you. (Configure OPENAI_API_KEY in .env for live AI replies.)`;
      }

      // 7. Image Generation Tag Parsing
      const imgMatch = aiResponse.match(/\[GENERATE_IMAGE:\s*(.*?)\]/i);
      const imageUrl: string | undefined = undefined;

      if (imgMatch && character.physicalDescription) {
        aiResponse = aiResponse.replace(imgMatch[0], "").trim();
      }

      // 8. Save Assistant Message & Update Conversation/Character
      await db.insert(messages).values({
        conversationId: input.conversationId,
        role: "assistant",
        content: aiResponse,
        metadata: {
          imageUrl,
          imagePrompt: imgMatch ? imgMatch[1] : undefined,
          type: imgMatch ? "image" : "text",
        },
      });

      await db
        .update(conversations)
        .set({
          lastMessage: aiResponse,
          updatedAt: new Date(),
        })
        .where(eq(conversations.id, input.conversationId));

      await db
        .update(characters)
        .set({ messageCount: sql`${characters.messageCount} + 1` })
        .where(eq(characters.id, convo.characterId));

      const updatedUser = await db
        .select({ credits: users.credits })
        .from(users)
        .where(eq(users.id, ctx.user.id))
        .limit(1);

      return {
        content: aiResponse,
        filtered: false,
        creditsRemaining: updatedUser[0]?.credits ?? Math.max(0, ctx.user.credits - 1),
      };
    }),
});
