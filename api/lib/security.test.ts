import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword } from "./password";
import { signSessionToken, verifySessionToken } from "./session";
import { toSafeUser } from "../queries/users";
import type { User } from "@db/schema";

describe("Security utilities", () => {
  it("hashes and verifies passwords correctly", async () => {
    const hash = await hashPassword("SuperSecret123!");
    expect(hash).not.toBe("SuperSecret123!");
    expect(await verifyPassword("SuperSecret123!", hash)).toBe(true);
    expect(await verifyPassword("WrongPassword", hash)).toBe(false);
  });

  it("signs and verifies JWT session tokens", async () => {
    const token = await signSessionToken({
      userId: 42,
      email: "user@example.com",
    });
    const payload = await verifySessionToken(token);
    expect(payload).toEqual({
      userId: 42,
      email: "user@example.com",
    });
    expect(await verifySessionToken("invalid.jwt.token")).toBeNull();
  });

  it("strips passwordHash in toSafeUser", () => {
    const user: User = {
      id: 1,
      unionId: null,
      googleId: null,
      name: "Alice",
      email: "alice@example.com",
      passwordHash: "$2b$10$secretHashValue",
      avatar: null,
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignInAt: new Date(),
      credits: 10,
      nsfwEnabled: false,
      stripeCustomerId: null,
      paystackCustomerId: null,
    };

    const safe = toSafeUser(user);
    expect(safe.email).toBe("alice@example.com");
    expect("passwordHash" in safe).toBe(false);
  });
});
