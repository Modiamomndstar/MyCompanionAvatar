import { relations } from "drizzle-orm";
import { users, characters, conversations, messages } from "./schema";

export const usersRelations = relations(users, ({ many }) => ({
  characters: many(characters),
  conversations: many(conversations),
}));

export const charactersRelations = relations(characters, ({ one, many }) => ({
  creator: one(users, {
    fields: [characters.creatorId],
    references: [users.id],
  }),
  conversations: many(conversations),
}));

export const conversationsRelations = relations(conversations, ({ one, many }) => ({
  user: one(users, {
    fields: [conversations.userId],
    references: [users.id],
  }),
  character: one(characters, {
    fields: [conversations.characterId],
    references: [characters.id],
  }),
  messages: many(messages),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  conversation: one(conversations, {
    fields: [messages.conversationId],
    references: [conversations.id],
  }),
}));
