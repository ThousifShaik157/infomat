import type { Student } from "./attendance-types";
import { sheetList, sheetMark } from "./sheet.functions";

const URL_KEY = "cc_apps_script_url";
const DEMO_KEY = "cc_demo_attendance";

let configuredUrl = "";

export function getWebAppUrl(): string {
  if (configuredUrl) return configuredUrl;
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(URL_KEY) ?? "";
}

/** Set from the Head-managed server settings. */
export function setConfiguredUrl(url: string) {
  configuredUrl = url.trim();
}

export function setWebAppUrl(url: string) {
  window.localStorage.setItem(URL_KEY, url.trim());
}

/* Demo data — used only until a Google Apps Script URL is configured. */
const DEMO_ROWS = [
  ["CODE WARRIORS", "Sample Student A", "Y00XX101", "a@example.edu", "REG-001"],
  ["CODE WARRIORS", "Sample Student B", "Y00XX102", "b@example.edu", "REG-002"],
  ["CODE WARRIORS", "Sample Student C", "Y00XX103", "c@example.edu", "REG-003"],
  ["BYTE BENDERS", "Sample Student D", "Y00XX104", "d@example.edu", "REG-004"],
  ["BYTE BENDERS", "Sample Student E", "Y00XX105", "e@example.edu", "REG-005"],
  ["NULL POINTERS", "Sample Student F", "Y00XX106", "f@example.edu", "REG-006"],
  ["NULL POINTERS", "Sample Student G", "Y00XX107", "g@example.edu", "REG-007"],
  ["NULL POINTERS", "Sample Student H", "Y00XX108", "h@example.edu", "REG-008"],
  ["STACK OVERFLOW", "Sample Student I", "Y00XX109", "i@example.edu", "REG-009"],
  ["STACK OVERFLOW", "Sample Student J", "Y00XX110", "j@example.edu", "REG-010"],
].map((r) => ({
  teamName: r[0] as string,
  studentName: r[1] as string,
  rollNumber: r[2] as string,
  email: r[3] as string,
  registrationId: r[4] as string,
}));

function readDemoAttendance(): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.localStorage.getItem(DEMO_KEY) ?? "{}") as Record<string, string>;
  } catch {
    return {};
  }
}

function writeDemoAttendance(map: Record<string, string>) {
  window.localStorage.setItem(DEMO_KEY, JSON.stringify(map));
}

type RawStudent = Record<string, unknown>;

function normalize(row: RawStudent): Student {
  const pick = (...keys: string[]) => {
    for (const k of keys) {
      const v = row[k];
      if (typeof v === "string" && v.trim()) return v.trim();
    }
    return "";
  };
  const status = pick("status", "Status").toLowerCase();
  return {
    registrationId: pick("registrationId", "Registration ID", "regId"),
    teamName: pick("teamName", "Team Name") || "UNASSIGNED",
    studentName: pick("studentName", "Student Name"),
    rollNumber: pick("rollNumber", "Roll Number"),
    email: pick("email", "Email"),
    present: status === "present" || row["present"] === true,
    attendanceTime: pick("attendanceTime", "Attendance Time") || null,
  };
}

export async function fetchStudents(): Promise<Student[]> {
  const url = getWebAppUrl();
  if (!url) {
    const marks = readDemoAttendance();
    return DEMO_ROWS.map((r) => ({
      ...r,
      present: Boolean(marks[r.registrationId]),
      attendanceTime: marks[r.registrationId] ?? null,
    }));
  }
  const raw = await sheetList({ data: { url } });
  const json = JSON.parse(raw.json) as { students?: RawStudent[]; error?: string };
  if (json.error) throw new Error(json.error);
  return (json.students ?? []).map(normalize);
}

export async function markAttendance(registrationIds: string[], present: boolean): Promise<void> {
  const url = getWebAppUrl();
  if (!url) {
    const marks = readDemoAttendance();
    for (const id of registrationIds) {
      if (present) marks[id] = new Date().toISOString();
      else delete marks[id];
    }
    writeDemoAttendance(marks);
    return;
  }
  // Proxied through the server to avoid browser CORS limits on Apps Script.
  const raw = await sheetMark({ data: { url, registrationIds, present } });
  const json = JSON.parse(raw.json) as { error?: string };
  if (json.error) throw new Error(json.error);
}
