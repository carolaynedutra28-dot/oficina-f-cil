import { createServerFn } from "@tanstack/react-start";
import { requireUnlocked, passwordMatches, sessionConfig } from "./gate.server";

export const unlockSite = createServerFn({ method: "POST" })
  .validator((data: { password: string }) => data)
  .handler(async ({ data }) => {
    const expected = process.env['SITE_PASSWORD'];
    if (!expected) throw new Error("SITE_PASSWORD is not set");

    if (!passwordMatches(data.password, expected)) {
      return { ok: false as const };
    }

    const session = await useSession(sessionConfig);
    await session.update({ unlocked: true });
    return { ok: true as const };
  });

export const lockSite = createServerFn({ method: "POST" }).handler(async () => {
  const session = await useSession(sessionConfig);
  await session.clear();
  return { ok: true as const };
});

export const checkUnlocked = createServerFn({ method: "GET" }).handler(async () => {
  const session = await useSession(sessionConfig);
  return { unlocked: !!session.data.unlocked };
});

export const requireUnlockedFn = createServerFn({ method: "GET" }).handler(async () => {
  await requireUnlocked();
  return { ok: true as const };
});

// Re-export for server-only consumers
export { requireUnlocked } from "./gate.server";
