import { useState } from "react";
import { Users, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { StudentRow } from "./StudentRow";
import type { Student } from "@/lib/attendance-types";

type Props = {
  name: string;
  members: Student[];
  busy?: boolean;
  onToggle: (student: Student, next: boolean) => void;
  onMarkTeam: (members: Student[]) => void;
};

export function TeamCard({ name, members, busy, onToggle, onMarkTeam }: Props) {
  const [confirm, setConfirm] = useState(false);
  const present = members.filter((m) => m.present).length;
  const pendingCount = members.length - present;
  const allPresent = pendingCount === 0;

  return (
    <section className="rounded-3xl border border-border bg-card p-4 shadow-card">
      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
        <div className="min-w-0">
          <h2 className="truncate text-base font-bold uppercase tracking-wide">{name}</h2>
          <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Users className="size-3.5 shrink-0" />
            {members.length} Members · {present} Present
          </p>
        </div>
        <Button
          size="sm"
          variant={allPresent ? "secondary" : "default"}
          disabled={allPresent || busy}
          onClick={() => setConfirm(true)}
          className="shrink-0 rounded-full"
        >
          <CheckCheck className="size-4" />
          All
        </Button>
      </header>

      <div className="mt-3 space-y-2">
        {members.map((m) => (
          <StudentRow
            key={m.registrationId}
            student={m}
            disabled={busy}
            onToggle={(next) => onToggle(m, next)}
          />
        ))}
      </div>

      <AlertDialog open={confirm} onOpenChange={setConfirm}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Mark all members of {name} as Present?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingCount} members will be marked present.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => onMarkTeam(members.filter((m) => !m.present))}>
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
