import { Hono } from "hono";

// AI Chat Router - handles AI conversation generation fallback
const aiChatRouter = new Hono();

// In-memory fallback responses for each NEW character type
const characterResponses: Record<string, string[]> = {
  Dante: [
    "*looks you up and down with a smirk* You have quite a way with words, darling. I think we're going to get along just fine.",
    "The city looks beautiful tonight, but not as beautiful as this conversation. Tell me, what else is on your mind?",
    "*leans in close* I've met a lot of people, but few catch my attention as quickly as you have. Don't stop now.",
    "I was just thinking about that trip we talked about. Adventure is calling... are you ready to answer?",
  ],
  Marcus: [
    "Hey babe! I was just thinking about you. Whatever you're going through, remember I'm always in your corner.",
    "*gives you a virtual hug* You've got this. I believe in you more than anyone else in this world.",
    "I love the way you think. It's one of the million things that makes you so special to me.",
    "Movie night later? I'll bring the popcorn, you bring that beautiful smile of yours.",
  ],
  Maya: [
    "*laughs and nudges your arm* Oh please, we've known each other too long for you to be that serious! Tell me the truth.",
    "You know, sometimes I wonder if there's something more between us... or maybe it's just the coffee talking? *winks*",
    "I'm so glad we can talk like this. You're the one person I can always be myself with.",
    "Don't worry, your secrets are safe with me. Always have been, always will be.",
  ],
  Elena: [
    "*raises an eyebrow playfully* That's a very bold thing to say. I like it. Most people are too scared to be so direct with me.",
    "I'm feeling a bit restless tonight. Why don't you tell me something... adventurous? Don't hold back.",
    "You have my full attention. And believe me, that's a very rare and dangerous thing to have.",
    "*smirks* Stop being so shy. Life is too short to play it safe, don't you think?",
  ],
  "Pastor John": [
    "Grace and peace be with you. Your heart seems heavy today—remember that there is always hope and light, even in the shadows.",
    "I was just reflecting on a passage about strength and perseverance. I think it might be just what you need to hear.",
    "The community is stronger because of souls like yours. Thank you for sharing your thoughts with me.",
    "Let us take a moment to be still and listen. The answers you seek are often found in the quiet.",
  ],
  "Dr. Aris": [
    "That's a very insightful observation about your relationship. How does that make you feel when you communicate it to your partner?",
    "Healing takes time and patience, but the work you're doing now is the foundation for a much healthier future.",
    "Communication is the bridge, but understanding is the destination. Let's explore that a bit deeper.",
    "Remember that you deserve respect and kindness, both from others and from yourself.",
  ],
  "Strategy Sam": [
    "The market is moving fast, but your logic is sound. Let's look at the scalability of that specific vertical again.",
    "In business, your network is your net worth. But your vision? That's your true capital. Keep pushing.",
    "Don't let the noise distract you from the signal. What's the core problem we're solving here?",
    "Fail fast, learn faster. That's the only way to build something that actually lasts.",
  ],
  Sarah: [
    "OMG! I was literally just thinking the same thing! Girl, we are totally on the same wavelength today.",
    "Wait, are you serious?! Tell me EVERYTHING. I'm not going anywhere, I need all the tea.",
    "You always know how to make me laugh. I'm so glad we're friends.",
    "Whatever it is, I'm here for you. We'll figure it out together over a drink later, okay?",
  ],
};

const genericResponses = [
  "That's a fascinating perspective! Tell me more about why you feel that way.",
  "*listens intently* I'm always interested in what you have to say. Go on...",
  "You always have such a unique way of looking at things. It's refreshing.",
  "Hmm, that's a good point. I'll have to think about that. What else is on your mind?",
];

function getFallbackResponse(characterName: string): string {
  const responses = characterResponses[characterName];
  if (responses && responses.length > 0) {
    return responses[Math.floor(Math.random() * responses.length)];
  }
  return genericResponses[Math.floor(Math.random() * genericResponses.length)];
}

// AI Chat endpoint
aiChatRouter.post("/", async (c) => {
  try {
    const body = await c.req.json<{
      systemPrompt: string;
      userMessage: string;
      characterName: string;
    }>();

    const { characterName, userMessage } = body;

    const apiKey = process.env.OPEN_AI_API_KEY || process.env.AI_API_KEY;

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
              { role: "system", content: body.systemPrompt },
              { role: "user", content: userMessage },
            ],
            max_tokens: 150,
            temperature: 0.8,
          }),
        });

        if (response.ok) {
          const data = await (response.json() as any);
          const aiResponse = data.choices?.[0]?.message?.content;
          if (aiResponse) {
            return c.json({ response: aiResponse });
          }
        }
      } catch {
        // Fallback below
      }
    }

    const response = getFallbackResponse(characterName);
    return c.json({ response });
  } catch {
    return c.json({ response: genericResponses[0] }, 200);
  }
});

export { aiChatRouter };
