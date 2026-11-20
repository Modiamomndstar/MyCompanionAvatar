import {
  mysqlTable,
  mysqlEnum,
  serial,
  varchar,
  text,
  timestamp,
  bigint,
  boolean,
  int,
  json,
  index,
  uniqueIndex,
} from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: serial("id").primaryKey(),
  unionId: varchar("unionId", { length: 255 }).unique(),
  googleId: varchar("googleId", { length: 255 }).unique(),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 320 }).notNull().unique(),
  passwordHash: varchar("passwordHash", { length: 255 }),
  avatar: text("avatar"),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
  lastSignInAt: timestamp("lastSignInAt").defaultNow().notNull(),
  credits: int("credits").default(10).notNull(),
  nsfwEnabled: boolean("nsfwEnabled").default(false).notNull(),
  stripeCustomerId: varchar("stripeCustomerId", { length: 255 }),
  paystackCustomerId: varchar("paystackCustomerId", { length: 255 }),
});

export type User = typeof users.$inferSelect;
export type SafeUser = Omit<User, "passwordHash">;
export type InsertUser = typeof users.$inferInsert;

// AI Characters table
export const characters = mysqlTable(
  "characters",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    avatar: text("avatar").notNull(),
    description: text("description").notNull(),
    personality: text("personality").notNull(),
    category: varchar("category", { length: 100 }).notNull(),
    greeting: text("greeting"),
    isPublic: boolean("isPublic").default(true).notNull(),
    creatorId: bigint("creatorId", { mode: "number", unsigned: true }).references(
      () => users.id,
      { onDelete: "cascade" }
    ),
    messageCount: bigint("messageCount", { mode: "number" }).default(0).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt")
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
    systemPrompt: text("systemPrompt"),
    isNsfw: boolean("isNsfw").default(false).notNull(),
    physicalDescription: text("physicalDescription"),
    sharingEnabled: boolean("sharingEnabled").default(true).notNull(),
  },
  (table) => [
    index("characters_category_nsfw_idx").on(table.category, table.isNsfw),
    index("characters_creator_idx").on(table.creatorId),
  ]
);

export type Character = typeof characters.$inferSelect;
export type InsertCharacter = typeof characters.$inferInsert;

// Conversations table
export const conversations = mysqlTable(
  "conversations",
  {
    id: serial("id").primaryKey(),
    userId: bigint("userId", { mode: "number", unsigned: true })
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    characterId: bigint("characterId", { mode: "number", unsigned: true })
      .references(() => characters.id, { onDelete: "cascade" })
      .notNull(),
    lastMessage: text("lastMessage"),
    unreadCount: bigint("unreadCount", { mode: "number" }).default(0).notNull(),
    customization: json("customization").$type<{
      avatarOverride?: string;
      style?: "anime" | "realistic" | "classic";
      personalityModifier?: string;
    }>(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt")
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex("conversations_user_character_uidx").on(
      table.userId,
      table.characterId
    ),
    index("conversations_user_updated_idx").on(table.userId, table.updatedAt),
  ]
);

export type Conversation = typeof conversations.$inferSelect;
export type InsertConversation = typeof conversations.$inferInsert;

// Messages table
export const messages = mysqlTable(
  "messages",
  {
    id: serial("id").primaryKey(),
    conversationId: bigint("conversationId", { mode: "number", unsigned: true })
      .references(() => conversations.id, { onDelete: "cascade" })
      .notNull(),
    role: mysqlEnum("role", ["user", "assistant"]).notNull(),
    content: text("content").notNull(),
    metadata: json("metadata").$type<{
      imageUrl?: string;
      imagePrompt?: string;
      type?: "text" | "image";
    }>(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => [
    index("messages_convo_created_idx").on(
      table.conversationId,
      table.createdAt
    ),
  ]
);

export type Message = typeof messages.$inferSelect;
export type InsertMessage = typeof messages.$inferInsert;
