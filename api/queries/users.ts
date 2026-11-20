import { eq, sql } from "drizzle-orm";
import * as schema from "@db/schema";
import type { InsertUser, SafeUser, User } from "@db/schema";
import { getDb } from "./connection";
import { env } from "../lib/env";

export function toSafeUser(user: User): SafeUser {
  const { passwordHash: _omitted, ...safe } = user;
  void _omitted;
  return safe;
}

export async function findUserByUnionId(unionId: string) {
  const rows = await getDb()
    .select()
    .from(schema.users)
    .where(eq(schema.users.unionId, unionId))
    .limit(1);
  return rows.at(0);
}

export async function findUserById(id: number) {
  const rows = await getDb()
    .select()
    .from(schema.users)
    .where(eq(schema.users.id, id))
    .limit(1);
  return rows.at(0);
}

export async function findUserByEmail(email: string) {
  const normalized = email.trim().toLowerCase();
  const rows = await getDb()
    .select()
    .from(schema.users)
    .where(eq(schema.users.email, normalized))
    .limit(1);
  return rows.at(0);
}

export async function upsertUser(data: InsertUser) {
  const updateSet: Partial<InsertUser> = {
    lastSignInAt: new Date(),
    ...data,
  };

  const values = {
    credits: 10,
    ...data,
  };

  if (
    values.role === undefined &&
    values.email &&
    values.email.trim().toLowerCase() === env.ownerEmail
  ) {
    values.role = "admin";
    updateSet.role = "admin";
  }

  await getDb()
    .insert(schema.users)
    .values(values)
    .onDuplicateKeyUpdate({
      set: {
        ...updateSet,
        credits: sql`${schema.users.credits}`,
      },
    });
}
