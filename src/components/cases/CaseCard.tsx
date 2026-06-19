import Link from "next/link";
import { Case, ChecklistItem } from "@/types";
import { CHECKLIST_STEPS } from "@/lib/constants";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type Props = {
  caseData: Case;
  checklistItems: ChecklistItem[];
};

export function CaseCard({ caseData, checklistItems }: Props) {
  const completed = checklistItems.filter((c) => c.completed).length;
  const total = CHECKLIST_STEPS.length;
  const pct = Math.round((completed / total) * 100);

  const isComplete = completed === total;

  return (
    <Link href={`/cases/${caseData.id}`}>
      <Card className="hover:border-slate-400 transition-colors cursor-pointer">
        <CardContent className="pt-4 pb-4">
          <div className="flex items-start justify-between gap-2">
            <div className="space-y-0.5 min-w-0">
              <p className="font-medium text-sm truncate">{caseData.student_name}</p>
              <p className="text-xs text-slate-500">{caseData.student_number} · {caseData.email}</p>
              <p className="text-xs text-slate-500">{caseData.course_type}</p>
            </div>
            <Badge
              variant={isComplete ? "default" : "secondary"}
              className="shrink-0 text-xs"
            >
              {pct}%
            </Badge>
          </div>
          <div className="mt-3">
            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${isComplete ? "bg-green-500" : "bg-blue-500"}`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {completed} / {total} steps
            </p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
