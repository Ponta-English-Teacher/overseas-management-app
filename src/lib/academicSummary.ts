import { Document, DocumentType } from "@/types";

export const ACADEMIC_FIELDS = [
  "program_name",
  "institution",
  "country",
  "city",
  "course_name",
  "duration_weeks",
  "lessons_per_week",
  "study_hours_per_week",
  "total_study_hours",
  "departure_date",
  "return_date",
  "arrival_back_home_date",
  "program_period",
  "cost",
] as const;

export type AcademicField = (typeof ACADEMIC_FIELDS)[number];

export type AcademicFieldResult = {
  value: string | null;
  // Which document the value came from, so the teacher can verify it.
  source: DocumentType | null;
};

export type AcademicSummary = Record<AcademicField, AcademicFieldResult>;

export const STUDY_HOURS_REQUIREMENT = 60;

type SummarizableDocument = Pick<Document, "document_type" | "extracted_data" | "confirmed_data">;

// Study-hour and travel-date info especially may live in the contract/estimate
// (生協契約書) rather than the brochure (生協パンフレット) — check both first,
// falling back to 申請書 (which the student fills in early, so less authoritative).
const ACADEMIC_PRIORITY_TYPES: DocumentType[] = ["生協契約書", "生協パンフレット"];

// Different document types name the same concept differently — e.g. the
// brochure's start_date/end_date are the same idea as the contract's
// departure_date/return_date, and 申請書 calls them planned_departure_date /
// planned_return_date. Each field is looked up under all of its aliases.
const FIELD_ALIASES: Record<AcademicField, string[]> = {
  program_name: ["program_name"],
  institution: ["institution"],
  country: ["country"],
  city: ["city"],
  course_name: ["course_name"],
  duration_weeks: ["duration_weeks"],
  lessons_per_week: ["lessons_per_week"],
  study_hours_per_week: ["study_hours_per_week"],
  total_study_hours: ["total_study_hours"],
  departure_date: ["departure_date", "start_date", "planned_departure_date"],
  return_date: ["return_date", "end_date", "planned_return_date"],
  arrival_back_home_date: ["arrival_back_home_date"],
  program_period: ["program_period"],
  cost: ["cost"],
};

function byAcademicPriority(documents: SummarizableDocument[]): SummarizableDocument[] {
  return [...documents].sort((a, b) => {
    const aRank = ACADEMIC_PRIORITY_TYPES.indexOf(a.document_type);
    const bRank = ACADEMIC_PRIORITY_TYPES.indexOf(b.document_type);
    return (aRank === -1 ? ACADEMIC_PRIORITY_TYPES.length : aRank) -
      (bRank === -1 ? ACADEMIC_PRIORITY_TYPES.length : bRank);
  });
}

// Collects each academic field across ALL of the case's documents — brochure
// (生協パンフレット), contract/estimate (生協契約書), and application form
// (申請書) if available — preferring confirmed_data over extracted_data, and
// the contract/brochure over other document types when both have a value.
// Purely derived for display/export — never written back to the case row.
export function getAcademicSummary(documents: SummarizableDocument[]): AcademicSummary {
  const candidates = byAcademicPriority(
    documents.filter((d) => d.confirmed_data || d.extracted_data)
  );

  const result = {} as AcademicSummary;
  for (const field of ACADEMIC_FIELDS) {
    const aliases = FIELD_ALIASES[field];
    let value: string | null = null;
    let source: DocumentType | null = null;

    search: for (const dataKey of ["confirmed_data", "extracted_data"] as const) {
      for (const alias of aliases) {
        for (const doc of candidates) {
          const data = doc[dataKey] as Record<string, string | null> | null;
          const v = data?.[alias];
          if (v) {
            value = v;
            source = doc.document_type;
            break search;
          }
        }
      }
    }

    result[field] = { value, source };
  }
  return result;
}

export function parseStudyHours(value: string | null): number | null {
  if (!value) return null;
  const match = value.match(/[\d.]+/);
  if (!match) return null;
  const num = parseFloat(match[0]);
  return Number.isNaN(num) ? null : num;
}
