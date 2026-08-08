import { createServerFn } from "@tanstack/react-start";
import { useSession } from "@tanstack/react-start/server";
import { gateSessionConfig, secretMatches, type GateSession } from "./gate.server";

export const login = createServerFn({ method: "POST" })
  .inputValidator((data: { username: string; password: string }) => data)
  .handler(async ({ data }) => {
    const u = process.env["SITE_USERNAME"];
    const p = process.env["SITE_PASSWORD"];
    if (!u || !p) throw new Error("Gate credentials are not configured");
    const ok =
      secretMatches(data.username.trim().toLowerCase(), u.toLowerCase()) &&
      secretMatches(data.password, p);
    if (!ok) return { ok: false as const };
    const session = await useSession<GateSession>(gateSessionConfig());
    await session.update({ unlocked: true });
    return { ok: true as const };
  });

export const logout = createServerFn({ method: "POST" }).handler(async () => {
  const session = await useSession<GateSession>(gateSessionConfig());
  await session.clear();
  return { ok: true as const };
});

export const getGateStatus = createServerFn({ method: "GET" }).handler(async () => {
  const session = await useSession<GateSession>(gateSessionConfig());
  return { unlocked: session.data.unlocked === true };
});
