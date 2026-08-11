import { useState } from "react";
import { createFileRoute, redirect, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ShieldCheck, Loader2, LogOut } from "lucide-react";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { getGateStatus, getSettings, logout, saveSettings } from "@/lib/gate.functions";

export const Route = createFileRoute("/head")({
  loader: async () => {
    const { unlocked, role } = await getGateStatus();
    if (!unlocked) throw redirect({ to: "/login" });
    if (role !== "head") throw redirect({ to: "/" });
    return await getSettings();
  },
  head: () => ({
    meta: [
      { title: "Head Dashboard — Attendance" },
      {
        name: "description",
        content:
          "Event Head settings: update the event name and the Google Apps Script data-source URL used by volunteers.",
      },
      { property: "og:title", content: "Head Dashboard — Attendance" },
      {
        property: "og:description",
        content: "Manage the event name and attendance data source.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HeadDashboard,
});

function HeadDashboard() {
  const current = Route.useLoaderData();
  const router = useRouter();
  const save = useServerFn(saveSettings);
  const signOut = useServerFn(logout);
  const [eventName, setEventName] = useState(current.eventName);
  const [webAppUrl, setWebAppUrl] = useState(current.webAppUrl);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await save({ data: { eventName, webAppUrl } });
      if (res.ok) {
        toast.success("Settings updated successfully.");
        await router.invalidate();
      } else {
        toast.error(res.error);
      }
    } catch {
      toast.error("Could not save settings. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto min-h-dvh w-full max-w-xl px-4 py-6">
      <Toaster position="top-center" />

      <div
        className="rounded-3xl px-5 py-6 text-surface-ink-foreground shadow-float"
        style={{ backgroundImage: "var(--gradient-ink)" }}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold tracking-[0.2em] opacity-70">HEAD DASHBOARD</p>
            <h1 className="mt-1 text-2xl font-bold leading-tight">{current.eventName}</h1>
          </div>
          <ShieldCheck className="size-7 opacity-80" />
        </div>
      </div>

      <form onSubmit={onSubmit} className="mt-4 space-y-4 rounded-3xl bg-card p-5 shadow-card">
        <div className="space-y-2">
          <Label htmlFor="eventName">Event Name</Label>
          <Input
            id="eventName"
            value={eventName}
            onChange={(e) => setEventName(e.target.value)}
            placeholder="INFOMAT 2026"
            className="h-14 rounded-2xl text-base"
            required
          />
          <p className="text-xs text-muted-foreground">
            Currently configured: {current.eventName}
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="webAppUrl">Google Apps Script Web App URL</Label>
          <Input
            id="webAppUrl"
            inputMode="url"
            value={webAppUrl}
            onChange={(e) => setWebAppUrl(e.target.value)}
            placeholder="https://script.google.com/macros/s/.../exec"
            className="h-14 rounded-2xl text-base"
          />
          <p className="break-all text-xs text-muted-foreground">
            Currently configured: {current.webAppUrl || "Not set (sample data in use)"}
          </p>
        </div>

        <Button
          type="submit"
          disabled={busy}
          className="h-14 w-full rounded-2xl text-base font-semibold"
        >
          {busy ? <Loader2 className="size-5 animate-spin" /> : "Save Settings"}
        </Button>
      </form>

      <div className="mt-4 flex gap-2">
        <Button
          variant="secondary"
          className="h-12 flex-1 rounded-2xl"
          onClick={() => router.navigate({ to: "/" })}
        >
          Attendance view
        </Button>
        <Button
          variant="outline"
          className="h-12 rounded-2xl"
          onClick={async () => {
            await signOut({});
            await router.navigate({ to: "/login", replace: true });
          }}
        >
          <LogOut className="size-4" />
          Sign out
        </Button>
      </div>
    </main>
  );
}
