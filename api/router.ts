import { authRouter } from "./auth-router";
import { characterRouter } from "./character-router";
import { conversationRouter } from "./conversation-router";
import { messageRouter } from "./message-router";
import { createRouter, publicQuery } from "./middleware";

export const appRouter = createRouter({
  ping: publicQuery.query(() => ({ ok: true, ts: Date.now() })),
  auth: authRouter,
  character: characterRouter,
  conversation: conversationRouter,
  message: messageRouter,
});

export type AppRouter = typeof appRouter;
