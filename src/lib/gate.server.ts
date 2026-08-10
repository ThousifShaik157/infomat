import { createHash, timingSafeEqual } from "node:crypto";

export type GateRole = "volunteer" | "head";
export type GateSession = { unlocked?: boolean; role?: GateRole };
export type AppSettings = { eventName: string; webAppUrl: string };

export const DEFAULT_SETTINGS: AppSettings = {
  eventName: "INFOMAT 2026",
  webAppUrl: "",
};

export function gateSessionConfig() {
  return {
    password: process.env["SESSION_SECRET"]!,
    name: "informatrix-gate",
    maxAge: 60 * 60 * 12,
    cookie: { httpOnly: true, secure: true, sameSite: "lax" as const, path: "/" },
  };
}

export function settingsSessionConfig() {
  return {
    password: process.env["SESSION_SECRET"]!,
    name: "informatrix-settings",
    maxAge: 60 * 60 * 24 * 180,
    cookie: { httpOnly: true, secure: true, sameSite: "lax" as const, path: "/" },
  };
}

export function secretMatches(input: string, expected: string) {
  const a = createHash("sha256").update(input, "utf8").digest();
  const b = createHash("sha256").update(expected, "utf8").digest();
  return timingSafeEqual(a, b);
}
