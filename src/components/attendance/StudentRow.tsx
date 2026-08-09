import { Check } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import type { Student } from "@/lib/attendance-types";

type Props = { student: Student; disabled?: boolean | undefined; onToggle: (next: boolean) => void };

export function StudentRow({ student, disabled, onToggle }: Props) {
  if (student.present) {
    return (
      <div className="flex min-w-0 items-center gap-3 rounded-2xl border border-success/40 bg-success/10 px-3 py-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-success text-success-foreground">
          <Check className="size-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[15px] font-semibold">{student.studentName}</span>
          <span className="block truncate text-xs text-muted-foreground">
            {student.rollNumber} · {student.teamName}
          </span>
        </span>
        <span className="shrink-0 text-right">
          <span className="block rounded-full bg-success px-2.5 py-1 text-[11px] font-semibold text-success-foreground">
            Present
          </span>
          <button
            type="button"
            disabled={disabled}
            onClick={() => onToggle(false)}
            className="mt-1 text-[11px] font-medium text-muted-foreground underline underline-offset-2 disabled:opacity-50"
          >
            Undo
          </button>
        </span>
      </div>
    );
  }

  return (
    <label
      className={`flex min-w-0 items-center gap-3 rounded-2xl border border-border bg-secondary/40 px-3 py-3 transition-colors ${
        disabled ? "opacity-60" : "active:scale-[0.995]"
      }`}
    >
      <Checkbox
        checked={false}
        disabled={disabled}
        onCheckedChange={(v) => onToggle(v === true)}
        className="size-9 shrink-0 rounded-xl data-[state=checked]:border-success data-[state=checked]:bg-success data-[state=checked]:text-success-foreground"
        aria-label={`Mark ${student.studentName} present`}
      />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[15px] font-semibold">{student.studentName}</span>
        <span className="block truncate text-xs text-muted-foreground">
          {student.rollNumber} · {student.teamName}
        </span>
      </span>
      <span className="shrink-0 rounded-full bg-muted px-2.5 py-1 text-[11px] font-semibold text-muted-foreground">
        Not marked
      </span>
    </label>
  );
}
