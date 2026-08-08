import { Checkbox } from "@/components/ui/checkbox";
import type { Student } from "@/lib/attendance-types";

type Props = { student: Student; disabled?: boolean | undefined; onToggle: (next: boolean) => void };

export function StudentRow({ student, disabled, onToggle }: Props) {
  return (
    <label
      className={`flex min-w-0 items-center gap-3 rounded-2xl border px-3 py-3 transition-colors ${
        student.present ? "border-success/40 bg-success/10" : "border-border bg-secondary/40"
      } ${disabled ? "opacity-60" : "active:scale-[0.995]"}`}
    >
      <Checkbox
        checked={student.present}
        disabled={disabled}
        onCheckedChange={(v) => onToggle(v === true)}
        className="size-7 shrink-0 rounded-lg data-[state=checked]:border-success data-[state=checked]:bg-success data-[state=checked]:text-success-foreground"
        aria-label={`Mark ${student.studentName} present`}
      />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[15px] font-semibold">{student.studentName}</span>
        <span className="block truncate text-xs text-muted-foreground">
          {student.rollNumber} · {student.registrationId}
        </span>
      </span>
      <span
        className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
          student.present ? "bg-success text-success-foreground" : "bg-muted text-muted-foreground"
        }`}
      >
        {student.present ? "Present" : "Absent"}
      </span>
    </label>
  );
}
