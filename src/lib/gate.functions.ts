import { createServerFn } from "@tanstack/react-start";

export const unlockSite = createServerFn({ method: "POST" })
  .validator((data: { password: string }) => data)
  .handler(async ({ data }) => {
    const { passwordMatches, getSessionConfig } = await import("./gate.server");
    const expected = process.env['SITE_PASSWORD'];
    if (!expected) throw new Error("SITE_PASSWORD is not set");

    if (!passwordMatches(data.password, expected)) {
      return { ok: false as const };
    }

    const { useSession } = await import("@tanstack/react-start/server");
    const session = await useSession(getSessionConfig());
    await session.update({ unlocked: true });
    return { ok: true as const };
  });

export const lockSite = createServerFn({ method: "POST" }).handler(async () => {
  const { getSessionConfig } = await import("./gate.server");
  const { useSession } = await import("@tanstack/react-start/server");
  const session = await useSession(getSessionConfig());
  await session.clear();
  return { ok: true as const };
});

export const checkUnlocked = createServerFn({ method: "GET" }).handler(async () => {
  const { getSessionConfig } = await import("./gate.server");
  const { useSession } = await import("@tanstack/react-start/server");
    const session = await useSession(getSessionConfig());
    return { unlocked: !!session.data['unlocked'] };
});

export const requireUnlockedFn = createServerFn({ method: "GET" }).handler(async () => {
  const { requireUnlocked } = await import("./gate.server");
  await requireUnlocked();
  return { ok: true as const };
});
