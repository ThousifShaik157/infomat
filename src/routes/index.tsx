import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Search, X, RefreshCw, CloudOff } from "lucide-react";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatsHeader } from "@/components/attendance/StatsHeader";
import { TeamCard } from "@/components/attendance/TeamCard";
import { SettingsDialog } from "@/components/attendance/SettingsDialog";
import { fetchStudents, getWebAppUrl, markAttendance } from "@/lib/attendance-api";
import type { AttendanceFilter, Student } from "@/lib/attendance-types";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Coding Club Event Attendance" },
      {
        name: "description",
        content:
          "Mobile-first attendance tracker for coding club events. Search registered teams and students, mark them present instantly.",
      },
      { property: "og:title", content: "Coding Club Event Attendance" },
      {
        property: "og:description",
        content: "Search registered teams and mark student attendance from your phone.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AttendancePage,
});

function AttendancePage() {
  const qc = useQueryClient();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<AttendanceFilter>("all");
  const [team, setTeam] = useState("all");

  const { data: students, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: ["students"],
    queryFn: fetchStudents,
  });

  const mutation = useMutation({
    mutationFn: ({ ids, present }: { ids: string[]; present: boolean }) =>
      markAttendance(ids, present),
    onMutate: async ({ ids, present }) => {
      await qc.cancelQueries({ queryKey: ["students"] });
      const prev = qc.getQueryData<Student[]>(["students"]);
      qc.setQueryData<Student[]>(["students"], (old) =>
        (old ?? []).map((s) =>
          ids.includes(s.registrationId)
            ? { ...s, present, attendanceTime: present ? new Date().toISOString() : null }
            : s,
        ),
      );
      return { prev };
    },
    onError: (err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(["students"], ctx.prev);
      toast.error(err instanceof Error ? err.message : "Could not save attendance");
    },
    onSuccess: (_d, vars) => {
      toast.success(vars.present ? "Marked present" : "Marked not present");
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["students"] }),
  });

  const all = students ?? [];
  const total = all.length;
  const present = all.filter((s) => s.present).length;

  const teams = useMemo(
    () => Array.from(new Set(all.map((s) => s.teamName))).sort(),
    [all],
  );

  const grouped = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = all.filter((s) => {
      if (filter === "present" && !s.present) return false;
      if (filter === "absent" && s.present) return false;
      if (team !== "all" && s.teamName !== team) return false;
      if (!q) return true;
      return [s.teamName, s.studentName, s.rollNumber, s.email, s.registrationId]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
    const map = new Map<string, Student[]>();
    for (const s of filtered) {
      const list = map.get(s.teamName) ?? [];
      list.push(s);
      map.set(s.teamName, list);
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [all, query, filter, team]);

  const connected = typeof window !== "undefined" && getWebAppUrl() !== "";

  return (
    <main className="mx-auto min-h-screen w-full max-w-xl overflow-x-hidden px-4 pt-4 pb-24">
      <Toaster position="top-center" />

      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <StatsHeader total={total} present={present} />
        </div>
      </div>

      {/* Search */}
      <div className="sticky top-0 z-10 -mx-4 mt-4 bg-background/90 px-4 py-3 backdrop-blur">
        <div className="flex items-center gap-2">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search team, student name, roll number..."
              aria-label="Search registered students"
              className="h-14 rounded-2xl border-border bg-card pl-12 pr-11 text-base shadow-card"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label="Clear search"
                className="absolute right-2 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-full text-muted-foreground"
              >
                <X className="size-4" />
              </button>
            )}
          </div>
          <SettingsDialog onSaved={() => refetch()} />
        </div>

        <div className="mt-3 flex items-center gap-2">
          <div className="grid flex-1 grid-cols-3 gap-1 rounded-2xl bg-secondary p-1">
            {(
              [
                ["all", "All"],
                ["present", "Present"],
                ["absent", "Not Present"],
              ] as [AttendanceFilter, string][]
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setFilter(value)}
                className={`h-10 truncate rounded-xl px-1 text-[13px] font-semibold transition-colors ${
                  filter === value
                    ? "bg-card text-foreground shadow-card"
                    : "text-muted-foreground"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <Select value={team} onValueChange={setTeam}>
            <SelectTrigger className="h-12 w-[6rem] shrink-0 rounded-2xl bg-card">
              <SelectValue placeholder="Team" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All teams</SelectItem>
              {teams.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {!connected && (
        <p className="mt-2 flex items-start gap-2 rounded-2xl border border-dashed border-border bg-card px-4 py-3 text-xs text-muted-foreground">
          <CloudOff className="mt-0.5 size-4 shrink-0" />
          Showing sample data. Tap the settings button to connect your Google Apps Script Web App
          URL.
        </p>
      )}

      <div className="mt-4 space-y-3">
        {isLoading && [0, 1, 2].map((i) => <Skeleton key={i} className="h-44 rounded-3xl" />)}

        {error && (
          <div className="rounded-3xl border border-destructive/30 bg-card p-5 text-center">
            <p className="text-sm font-medium text-destructive">
              {error instanceof Error ? error.message : "Could not load registrations"}
            </p>
            <Button variant="secondary" className="mt-3 rounded-2xl" onClick={() => refetch()}>
              <RefreshCw className="size-4" /> Retry
            </Button>
          </div>
        )}

        {!isLoading && !error && grouped.length === 0 && (
          <p className="rounded-3xl border border-border bg-card px-4 py-10 text-center text-sm text-muted-foreground">
            No registered students match your search.
          </p>
        )}

        {grouped.map(([name, members]) => (
          <TeamCard
            key={name}
            name={name}
            members={members}
            busy={mutation.isPending}
            onToggle={(s, next) => mutation.mutate({ ids: [s.registrationId], present: next })}
            onMarkTeam={(pending) => {
              if (pending.length === 0) return;
              mutation.mutate({ ids: pending.map((m) => m.registrationId), present: true });
            }}
          />
        ))}
      </div>

      <div className="mt-6 flex justify-center">
        <Button
          variant="ghost"
          className="rounded-2xl text-muted-foreground"
          onClick={() => refetch()}
          disabled={isFetching}
        >
          <RefreshCw className={`size-4 ${isFetching ? "animate-spin" : ""}`} /> Refresh
        </Button>
      </div>
    </main>
  );
}
