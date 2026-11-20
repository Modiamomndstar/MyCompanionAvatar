export const Session = {
  cookieName: "mca_sid",
  maxAgeMs: 30 * 24 * 60 * 60 * 1000, // 30 days
} as const;

export const ErrorMessages = {
  unauthenticated: "Authentication required",
  insufficientRole: "Insufficient permissions",
} as const;

export const Paths = {
  login: "/login",
  register: "/register",
} as const;

export const CHARACTER_CATEGORIES = [
  "Romance",
  "Social",
  "Business",
  "Religious",
  "Counseling",
  "Productivity",
  "Anime",
  "Fantasy",
] as const;

export type CharacterCategory = (typeof CHARACTER_CATEGORIES)[number];
