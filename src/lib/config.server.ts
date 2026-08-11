import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

export type AppConfigRow = {
  event_name: string;
  web_app_url: string;
  volunteer_username: string;
  volunteer_password_hash: string;
  head_username: string;
  head_password_hash: string;
};

export function hashSecret(value: string, salt?: string) {
  const s = salt ?? randomBytes(16).toString("hex");
  const h = createHash("sha256").update(`${s}:${value}`, "utf8").digest("hex");
  return `${s}:${h}`;
}

export function verifyHashed(value: string, stored: string) {
  const [salt, digest] = stored.split(":");
  if (!salt || !digest) return false;
  const a = Buffer.from(hashSecret(value, salt).split(":")[1]!, "hex");
  const b = Buffer.from(digest, "hex");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

export async function readConfig(): Promise<AppConfigRow> {
  const db = await admin();
  const { data } = await db
    .from("app_config")
    .select(
      "event_name, web_app_url, volunteer_username, volunteer_password_hash, head_username, head_password_hash",
    )
    .eq("id", true)
    .maybeSingle();
  return (
    (data as AppConfigRow | null) ?? {
      event_name: "",
      web_app_url: "",
      volunteer_username: "",
      volunteer_password_hash: "",
      head_username: "",
      head_password_hash: "",
    }
  );
}

export async function writeConfig(patch: Partial<AppConfigRow>) {
  const db = await admin();
  const { error } = await db
    .from("app_config")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", true);
  if (error) throw new Error(error.message);
}

/** Effective credentials: DB value when set, otherwise the original env defaults. */
export function effectiveCreds(row: AppConfigRow) {
  return {
    volunteerUsername: row.volunteer_username || process.env["SITE_USERNAME"] || "",
    headUsername: row.head_username || process.env["HEAD_USERNAME"] || "",
    volunteerHash: row.volunteer_password_hash,
    headHash: row.head_password_hash,
    volunteerEnvPassword: process.env["SITE_PASSWORD"] || "",
    headEnvPassword: process.env["HEAD_PASSWORD"] || "",
  };
}
