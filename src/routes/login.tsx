import { useState } from "react";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Lock, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { login } from "@/lib/gate.functions";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Volunteer Login — Informatrix Attendance" },
      { name: "description", content: "Restricted access. Student volunteers sign in to mark event attendance for Informatrix." },
      { property: "og:title", content: "Volunteer Login — Informatrix Attendance" },
      { property: "og:description", content: "Restricted access for student volunteers managing event attendance." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const router = useRouter();
  const signIn = useServerFn(login);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [headMode, setHeadMode] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await signIn({ data: { username, password, head: headMode } });
      if (res.ok) await router.navigate({ to: res.role === "head" ? "/head" : "/" });
      else setError("Incorrect username or password.");
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-5 py-10">
      <div className="rounded-3xl bg-card p-6 shadow-float">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="grid size-14 place-items-center rounded-2xl bg-primary/10 text-primary">
            <Lock className="size-7" />
          </div>
          <h1 className="mt-4 text-2xl font-bold tracking-tight">
            {headMode ? "Head Login" : "Volunteer Login"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {headMode
              ? "Event Head access for system settings."
              : "Only student volunteers can mark event attendance."}
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              autoCapitalize="none"
              placeholder="Enter username"
              className="h-14 rounded-2xl text-base"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              placeholder="Enter password"
              className="h-14 rounded-2xl text-base"
              required
            />
          </div>
          {error && (
            <p role="alert" className="rounded-xl bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive">
              {error}
            </p>
          )}
          <Button type="submit" disabled={busy} className="h-14 w-full rounded-2xl text-base font-semibold">
            {busy ? <Loader2 className="size-5 animate-spin" /> : "Sign in"}
          </Button>
        </form>

        <button
          type="button"
          onClick={() => {
            setHeadMode((v) => !v);
            setError("");
          }}
          className="mt-4 w-full text-center text-sm font-semibold text-muted-foreground underline underline-offset-4"
        >
          {headMode ? "Volunteer Login" : "Head Login"}
        </button>
      </div>
    </main>
  );
}
