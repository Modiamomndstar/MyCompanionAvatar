import * as jose from "jose";
import { env } from "./env";

const SECRET = new TextEncoder().encode(env.jwtSecret);

export type SessionPayload = {
  userId: number;
  email: string;
};

export async function signSessionToken(payload: SessionPayload): Promise<string> {
  return new jose.SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(SECRET);
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jose.jwtVerify(token, SECRET);
    return payload as SessionPayload;
  } catch (err) {
    return null;
  }
}
