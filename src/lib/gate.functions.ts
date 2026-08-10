import { createServerFn } from "@tanstack/react-start";
import { useSession } from "@tanstack/react-start/server";
import {
  DEFAULT_SETTINGS,
  gateSessionConfig,
  secretMatches,
  settingsSessionConfig,
  type AppSettings,
  type GateSession,
} from "./gate.server";

export const login = createServerFn({ method: "POST" })
  .inputValidator((data: { username: string; password: string; head?: boolean }) => data)
  .handler(async ({ data }) => {
    const head = data.head === true;
    const u = head ? process.env["HEAD_USERNAME"] : process.env["SITE_USERNAME"];
    const p = head ? process.env["HEAD_PASSWORD"] : process.env["SITE_PASSWORD"];
    if (!u || !p) throw new Error("Gate credentials are not configured");
    const ok =
      secretMatches(data.username.trim().toLowerCase(), u.toLowerCase()) &&
      secretMatches(data.password, p);
    if (!ok) return { ok: false as const };
    const session = await useSession<GateSession>(gateSessionConfig());
    await session.update({ unlocked: true, role: head ? "head" : "volunteer" });
    return { ok: true as const, role: head ? ("head" as const) : ("volunteer" as const) };
  });

export const logout = createServerFn({ method: "POST" }).handler(async () => {
  const session = await useSession<GateSession>(gateSessionConfig());
  await session.clear();
  return { ok: true as const };
});

export const getGateStatus = createServerFn({ method: "GET" }).handler(async () => {
  const session = await useSession<GateSession>(gateSessionConfig());
  return {
    unlocked: session.data.unlocked === true,
    role: session.data.role ?? "volunteer",
  };
});

export const getSettings = createServerFn({ method: "GET" }).handler(async () => {
  const gate = await useSession<GateSession>(gateSessionConfig());
  if (gate.data.unlocked !== true) return DEFAULT_SETTINGS;
  const s = await useSession<AppSettings>(settingsSessionConfig());
  return {
    eventName: s.data.eventName || DEFAULT_SETTINGS.eventName,
    webAppUrl: s.data.webAppUrl || DEFAULT_SETTINGS.webAppUrl,
  };
});

export const saveSettings = createServerFn({ method: "POST" })
  .inputValidator((data: { eventName: string; webAppUrl: string }) => data)
  .handler(async ({ data }) => {
    const gate = await useSession<GateSession>(gateSessionConfig());
    if (gate.data.unlocked !== true || gate.data.role !== "head") {
      return { ok: false as const, error: "Only the event Head can change these settings." };
    }
    const eventName = data.eventName.trim().slice(0, 60);
    const webAppUrl = data.webAppUrl.trim();
    if (!eventName) return { ok: false as const, error: "Event name cannot be empty." };
    if (webAppUrl && !/^https:\/\/script\.google(?:usercontent)?\.com\//.test(webAppUrl)) {
      return { ok: false as const, error: "Enter a valid Google Apps Script Web App URL." };
    }
    const s = await useSession<AppSettings>(settingsSessionConfig());
    await s.update({ eventName, webAppUrl });
    return { ok: true as const };
  });
