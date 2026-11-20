import "dotenv/config";

const isProduction = process.env.NODE_ENV === "production";

function required(name: string): string {
  const value = process.env[name];
  if (!value && isProduction) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value ?? "";
}

const jwtSecret = required("JWT_SECRET") || "dev_only_secret_change_in_production";
if (isProduction && jwtSecret.length < 32) {
  throw new Error("JWT_SECRET must be at least 32 characters in production");
}

export const env = {
  jwtSecret,
  isProduction,
  port: parseInt(process.env.PORT || "3000", 10),
  databaseUrl: required("DATABASE_URL"),
  ownerEmail: (process.env.OWNER_EMAIL ?? "admin@example.com").trim().toLowerCase(),
  corsOrigins: (process.env.CORS_ORIGIN ?? "http://localhost:3000")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean),
  aiApiKey: process.env.OPENAI_API_KEY || process.env.AI_API_KEY || "",
  aiBaseUrl: (process.env.AI_BASE_URL || "https://api.openai.com/v1").replace(
    /\/+$/,
    ""
  ),
  aiModel: process.env.AI_MODEL || "gpt-4o-mini",
  replicateToken: process.env.REPLICATE_API_TOKEN || "",
};
