import { createServerFn } from "@tanstack/react-start";
import { useSession } from "@tanstack/react-start/server";
import { redirect } from "@tanstack/react-router";
import { createHash, timingSafeEqual } from "node:crypto";

type GateSession = { unlocked?: boolean };

function config() {
  return {
    password: process.env["SESSION_SECRET"]!,
    name: "informatrix-gate",
    maxAge: 60 * 60 * 12,
    cookie: { httpOnly: true, secure: true, sameSite: "lax" as const, path: "/" },
  };
}

function matches(input: string, expected: string) {
  const a = createHash("sha256").update(input, "utf8").digest();
  const b = createHash("sha256").update(expected, "utf8").digest();
  return timingSafeEqual(a, b);
}

export const login = createServerFn({ method: "POST" })
  .inputValidator((data: { username: string; password: string }) => data)
  .handler(async ({ data }) => {
    const u = process.env["SITE_USERNAME"];
    const p = process.env["SITE_PASSWORD"];
    if (!u || !p) throw new Error("Gate credentials are not configured");
    const ok = matches(data.username.trim().toLowerCase(), u.toLowerCase()) && matches(data.password, p);
    if (!ok) return { ok: false as const };
    const session = await useSession<GateSession>(config());
    await session.update({ unlocked: true });
    return { ok: true as const };
  });

export const logout = createServerFn({ method: "POST" }).handler(async () => {
  const session = await useSession<GateSession>(config());
  await session.clear();
  return { ok: true as const };
});

export const requireVolunteer = createServerFn({ method: "GET" }).handler(async () => {
  const session = await useSession<GateSession>(config());
  if (!session.data.unlocked) throw redirect({ to: "/login" });
  return { unlocked: true as const };
});
