import { Document, DocumentType } from "@/types";
import {
  ACADEMIC_FIELDS,
  getAcademicSummary,
  parseStudyHours,
  STUDY_HOURS_REQUIREMENT,
} from "@/lib/academicSummary";
import { DOCUMENT_TYPES } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function sourceLabel(source: DocumentType | null) {
  if (!source) return null;
  return DOCUMENT_TYPES.find((d) => d.value === source)?.label ?? source;
}

function fieldLabel(key: string) {
  const s = key.replace(/_/g, " ");
  return s.charAt(0).toUpperCase() + s.slice(1);
}

type Props = {
  documents: Document[];
};

export function AcademicProgramSummary({ documents }: Props) {
  const summary = getAcademicSummary(documents);
  const hours = parseStudyHours(summary.total_study_hours.value);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Academic Program Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {ACADEMIC_FIELDS.map((field) => {
            const { value, source } = summary[field];
            return (
              <div key={field} className="space-y-0.5">
                <p className="text-xs text-slate-500">{fieldLabel(field)}</p>
                {value ? (
                  <>
                    <p className="text-sm font-medium">{value}</p>
                    {source && (
                      <p className="text-xs text-slate-400">from {sourceLabel(source)}</p>
                    )}
                  </>
                ) : (
                  <Badge
                    variant="outline"
                    className="border-amber-300 bg-amber-50 text-amber-700 text-xs py-0"
                  >
                    Needs review
                  </Badge>
                )}
              </div>
            );
          })}
        </div>

        {hours !== null &&
          (hours < STUDY_HOURS_REQUIREMENT ? (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              ⚠ {hours} study hours — below the {STUDY_HOURS_REQUIREMENT}-hour requirement.
            </div>
          ) : (
            <div className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
              ✓ Meets {STUDY_HOURS_REQUIREMENT}-hour requirement ({hours} hours).
            </div>
          ))}
      </CardContent>
    </Card>
  );
}
