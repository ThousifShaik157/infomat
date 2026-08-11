import { createServerFn } from "@tanstack/react-start";
import { useSession } from "@tanstack/react-start/server";
import {
  DEFAULT_SETTINGS,
  gateSessionConfig,
  secretMatches,
  type GateSession,
} from "./gate.server";
import { effectiveCreds, hashSecret, readConfig, verifyHashed } from "./config.server";

async function requireHead() {
  const gate = await useSession<GateSession>(gateSessionConfig());
  return gate.data.unlocked === true && gate.data.role === "head";
}

export const login = createServerFn({ method: "POST" })
  .inputValidator((data: { username: string; password: string; head?: boolean }) => data)
  .handler(async ({ data }) => {
    const head = data.head === true;
    const row = await readConfig();
    const creds = effectiveCreds(row);

    const expectedUser = head ? creds.headUsername : creds.volunteerUsername;
    const storedHash = head ? creds.headHash : creds.volunteerHash;
    const envPassword = head ? creds.headEnvPassword : creds.volunteerEnvPassword;
    if (!expectedUser || (!storedHash && !envPassword)) {
      throw new Error("Gate credentials are not configured");
    }

    const userOk = secretMatches(
      data.username.trim().toLowerCase(),
      expectedUser.toLowerCase(),
    );
    const passOk = storedHash
      ? verifyHashed(data.password, storedHash)
      : secretMatches(data.password, envPassword);

    if (!userOk || !passOk) return { ok: false as const };

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
  if (gate.data.unlocked !== true) return { ...DEFAULT_SETTINGS, volunteerUsername: "" };
  const row = await readConfig();
  return {
    eventName: row.event_name || DEFAULT_SETTINGS.eventName,
    webAppUrl: row.web_app_url || DEFAULT_SETTINGS.webAppUrl,
    volunteerUsername: effectiveCreds(row).volunteerUsername,
  };
});

export const saveSettings = createServerFn({ method: "POST" })
  .inputValidator((data: { eventName: string; webAppUrl: string }) => data)
  .handler(async ({ data }) => {
    if (!(await requireHead())) {
      return { ok: false as const, error: "Only the event Head can change these settings." };
    }
    const eventName = data.eventName.trim().slice(0, 60);
    const webAppUrl = data.webAppUrl.trim();
    if (!eventName) return { ok: false as const, error: "Event name cannot be empty." };
    if (webAppUrl && !/^https:\/\/script\.google(?:usercontent)?\.com\//.test(webAppUrl)) {
      return { ok: false as const, error: "Enter a valid Google Apps Script Web App URL." };
    }
    const { writeConfig } = await import("./config.server");
    await writeConfig({ event_name: eventName, web_app_url: webAppUrl });
    return { ok: true as const };
  });

export const saveVolunteerCredentials = createServerFn({ method: "POST" })
  .inputValidator((data: { username: string; password: string }) => data)
  .handler(async ({ data }) => {
    if (!(await requireHead())) {
      return { ok: false as const, error: "Only the event Head can change volunteer login." };
    }
    const username = data.username.trim();
    const password = data.password;
    if (username.length < 3) {
      return { ok: false as const, error: "Username must be at least 3 characters." };
    }
    if (password.length < 6) {
      return { ok: false as const, error: "Password must be at least 6 characters." };
    }
    const { writeConfig } = await import("./config.server");
    await writeConfig({
      volunteer_username: username,
      volunteer_password_hash: hashSecret(password),
    });
    return { ok: true as const };
  });

export const changeHeadPassword = createServerFn({ method: "POST" })
  .inputValidator((data: { currentPassword: string; newPassword: string }) => data)
  .handler(async ({ data }) => {
    if (!(await requireHead())) {
      return { ok: false as const, error: "Only the event Head can change this password." };
    }
    const row = await readConfig();
    const creds = effectiveCreds(row);
    const currentOk = creds.headHash
      ? verifyHashed(data.currentPassword, creds.headHash)
      : secretMatches(data.currentPassword, creds.headEnvPassword);
    if (!currentOk) return { ok: false as const, error: "Current password is incorrect." };
    if (data.newPassword.length < 8) {
      return { ok: false as const, error: "New password must be at least 8 characters." };
    }
    const { writeConfig } = await import("./config.server");
    await writeConfig({ head_password_hash: hashSecret(data.newPassword) });
    return { ok: true as const };
  });
