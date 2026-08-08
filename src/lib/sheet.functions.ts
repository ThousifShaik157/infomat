import { createServerFn } from "@tanstack/react-start";

function assertUrl(url: string) {
  const u = url.trim();
  if (!/^https:\/\/script\.google(usercontent)?\.com\//.test(u)) {
    throw new Error("Please paste a valid Google Apps Script Web App URL (ending in /exec).");
  }
  return u;
}

export const sheetList = createServerFn({ method: "POST" })
  .inputValidator((data: { url: string }) => data)
  .handler(async ({ data }) => {
    const url = assertUrl(data.url);
    const res = await fetch(`${url}${url.includes("?") ? "&" : "?"}action=list`, {
      method: "GET",
      redirect: "follow",
    });
    const text = await res.text();
    if (!res.ok) throw new Error(`Sheet request failed (${res.status}). ${text.slice(0, 200)}`);
    try {
      JSON.parse(text);
      return { json: text };
    } catch {
      throw new Error(
        "The Web App returned a login page instead of data. Redeploy with access set to “Anyone”.",
      );
    }
  });

export const sheetMark = createServerFn({ method: "POST" })
  .inputValidator((data: { url: string; registrationIds: string[]; present: boolean }) => data)
  .handler(async ({ data }) => {
    const url = assertUrl(data.url);
    const res = await fetch(url, {
      method: "POST",
      redirect: "follow",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({
        action: "mark",
        registrationIds: data.registrationIds,
        present: data.present,
      }),
    });
    const text = await res.text();
    if (!res.ok) throw new Error(`Could not save attendance (${res.status}). ${text.slice(0, 200)}`);
    try {
      JSON.parse(text);
      return { json: text };
    } catch {
      throw new Error(
        "The Web App returned a login page instead of data. Redeploy with access set to “Anyone”.",
      );
    }
  });
