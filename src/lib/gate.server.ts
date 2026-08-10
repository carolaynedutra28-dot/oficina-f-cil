import { redirect } from "@tanstack/react-router";
import { useSession } from "@tanstack/react-start/server";
import { createHash, timingSafeEqual } from "node:crypto";

export function getSessionConfig() {
  const secret = process.env['SESSION_SECRET'];
  if (!secret) throw new Error("SESSION_SECRET is not set");
  return {
    password: secret,
    name: "workshop-gate",
    maxAge: 60 * 60 * 24 * 7,
    cookie: { httpOnly: true, secure: true, sameSite: "lax" as const, path: "/" },
  };
}

export type GateSession = { unlocked?: boolean };

export function passwordMatches(input: string, expected: string): boolean {
  const a = createHash("sha256").update(input, "utf8").digest();
  const b = createHash("sha256").update(expected, "utf8").digest();
  return timingSafeEqual(a, b);
}

export async function requireUnlocked() {
  const session = await useSession<GateSession>(getSessionConfig());
  if (!session.data.unlocked) throw redirect({ to: "/login" as any });
  return session;
}
