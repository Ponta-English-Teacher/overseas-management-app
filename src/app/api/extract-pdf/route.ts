import { NextRequest, NextResponse } from "next/server";
import { DocumentType } from "@/types";

const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o";

const DOCUMENT_TYPES: DocumentType[] = [
  "申請書",
  "生協パンフレット",
  "生協契約書",
  "修了証_活動証明書_労働管理書",
];

// JSON Schema (OpenAI structured outputs, strict mode) per document type.
// Fields are nullable string — the model returns null when a value isn't
// found in the document, which the UI already renders as an empty input.
const SCHEMAS: Record<DocumentType, object> = {
  申請書: {
    type: "object",
    properties: {
      type: { type: "string", enum: ["申請書"] },
      student_name: { type: ["string", "null"] },
      student_number: { type: ["string", "null"] },
      email: { type: ["string", "null"] },
      course_type: { type: ["string", "null"] },
      destination: { type: ["string", "null"] },
      planned_departure_date: { type: ["string", "null"] },
      planned_return_date: { type: ["string", "null"] },
      notes: { type: ["string", "null"] },
    },
    required: [
      "type",
      "student_name",
      "student_number",
      "email",
      "course_type",
      "destination",
      "planned_departure_date",
      "planned_return_date",
      "notes",
    ],
    additionalProperties: false,
  },
  生協パンフレット: {
    type: "object",
    properties: {
      type: { type: "string", enum: ["生協パンフレット"] },
      program_name: { type: ["string", "null"] },
      country: { type: ["string", "null"] },
      city: { type: ["string", "null"] },
      institution: { type: ["string", "null"] },
      course_name: { type: ["string", "null"] },
      program_period: { type: ["string", "null"] },
      duration_weeks: { type: ["string", "null"] },
      start_date: { type: ["string", "null"] },
      end_date: { type: ["string", "null"] },
      lessons_per_week: { type: ["string", "null"] },
      study_hours_per_week: { type: ["string", "null"] },
      total_study_hours: { type: ["string", "null"] },
      accommodation_type: { type: ["string", "null"] },
      meals: { type: ["string", "null"] },
      airport_pickup: { type: ["string", "null"] },
      cost: { type: ["string", "null"] },
    },
    required: [
      "type",
      "program_name",
      "country",
      "city",
      "institution",
      "course_name",
      "program_period",
      "duration_weeks",
      "start_date",
      "end_date",
      "lessons_per_week",
      "study_hours_per_week",
      "total_study_hours",
      "accommodation_type",
      "meals",
      "airport_pickup",
      "cost",
    ],
    additionalProperties: false,
  },
  生協契約書: {
    type: "object",
    properties: {
      type: { type: "string", enum: ["生協契約書"] },
      student_name: { type: ["string", "null"] },
      program_name: { type: ["string", "null"] },
      course_name: { type: ["string", "null"] },
      departure_date: { type: ["string", "null"] },
      return_date: { type: ["string", "null"] },
      arrival_back_home_date: { type: ["string", "null"] },
      program_period: { type: ["string", "null"] },
      duration_weeks: { type: ["string", "null"] },
      lessons_per_week: { type: ["string", "null"] },
      study_hours_per_week: { type: ["string", "null"] },
      total_study_hours: { type: ["string", "null"] },
      cost: { type: ["string", "null"] },
      contract_date: { type: ["string", "null"] },
    },
    required: [
      "type",
      "student_name",
      "program_name",
      "course_name",
      "departure_date",
      "return_date",
      "arrival_back_home_date",
      "program_period",
      "duration_weeks",
      "lessons_per_week",
      "study_hours_per_week",
      "total_study_hours",
      "cost",
      "contract_date",
    ],
    additionalProperties: false,
  },
  修了証_活動証明書_労働管理書: {
    type: "object",
    properties: {
      type: { type: "string", enum: ["修了証_活動証明書_労働管理書"] },
      student_name: { type: ["string", "null"] },
      institution_or_organization: { type: ["string", "null"] },
      completion_date: { type: ["string", "null"] },
      activity_period: { type: ["string", "null"] },
      total_hours: { type: ["string", "null"] },
    },
    required: [
      "type",
      "student_name",
      "institution_or_organization",
      "completion_date",
      "activity_period",
      "total_hours",
    ],
    additionalProperties: false,
  },
};

const FIELD_HINTS: Record<DocumentType, string> = {
  申請書:
    "This is a study-abroad program application form (申請書). Extract: student_name (full name), student_number (student ID), email, course_type (the overseas program/course name), destination (country/city), planned_departure_date, planned_return_date (use YYYY-MM-DD if a date is shown, otherwise the text as written), notes (any remarks).",
  生協パンフレット:
    "This is a co-op program brochure (生協パンフレット) for an overseas study program (e.g. Overseas English Experience, Valencia Program). The department needs to verify the program meets academic requirements without opening the PDF, so extract the academic details carefully — look at every page, including course overview tables, curriculum/schedule grids, and itinerary tables, not just the introductory paragraph. Extract: program_name, country, city, institution (host school/organization), course_name (the specific course/curriculum name, e.g. 'General English', 'Intensive Course'), program_period (the date range or duration as written, verbatim), duration_weeks (total program length in weeks — a plain number such as '4', parsed from phrases like '4-week program' or a date range), start_date and end_date (YYYY-MM-DD if a specific date is shown, otherwise as written), lessons_per_week (number of lessons/classes per week — a plain number such as '25', parsed from phrases like '25 lessons per week' or a weekly timetable showing 5 lessons/day x 5 days), study_hours_per_week (hours of instruction per week — a plain number; if only lesson length and count are shown, e.g. '25 lessons x 45 min/week', compute the hours), total_study_hours (total instructional hours for the whole program — a plain number; if not stated explicitly, calculate it yourself as duration_weeks multiplied by lessons_per_week, or duration_weeks multiplied by study_hours_per_week, and return that computed number), accommodation_type (e.g. homestay, dormitory, residence), meals (meal arrangement, e.g. number of meals/day included or self-catered), airport_pickup (whether airport pickup/transfer is included, and any detail given), cost (the program fee as written). For duration_weeks, lessons_per_week, study_hours_per_week, and total_study_hours, return digits only (no units like 'weeks' or 'hours').",
  生協契約書:
    "This is a co-op program contract or estimate (生協契約書・見積書) prepared by a travel agent, who has been asked to include: departure date, return date / arrival back home date, program period, course name, weekly study hours, total study hours, and total cost. Search the whole document for these, not just headline program details. Critically, total study hours is often stated as a calculation rather than a single number — e.g. '週25時間×4週間=100時間' (25 hours/week x 4 weeks = 100 hours), or the parts separately as '週25時間' (25 hours/week) and '4週間' (4 weeks). Extract: student_name, program_name, course_name (the specific course/curriculum name), departure_date (the date the student leaves Japan), return_date (the date the student departs the host country to head home), arrival_back_home_date (the date the student actually arrives back in Japan, if stated as a separate date from return_date — e.g. due to an overnight flight; if only one combined return/arrival date is given, put it in return_date and leave arrival_back_home_date null), program_period (the date range or duration as written, verbatim), duration_weeks (total weeks — a plain number, e.g. from '4週間' return '4'), lessons_per_week (number of lessons/classes per week, if stated, as a plain number), study_hours_per_week (hours of instruction per week — a plain number, e.g. from '週25時間' return '25'), total_study_hours (total instructional hours for the whole program — a plain number; if a calculation like '週25時間×4週間=100時間' is shown, use the stated result, e.g. '100'; if only the per-week and per-duration parts are shown without an explicit total, calculate it yourself as duration_weeks multiplied by study_hours_per_week, or duration_weeks multiplied by lessons_per_week), cost (the total contracted fee as written), contract_date (the date the contract was signed). For duration_weeks, lessons_per_week, study_hours_per_week, and total_study_hours, return digits only (no units like '週' or '時間').",
  修了証_活動証明書_労働管理書:
    "This is a completion certificate / activity certificate / labor management document (修了証・活動証明書・労働管理書). Extract: student_name, institution_or_organization (the issuing school/employer), completion_date, activity_period (the date range of the activity), total_hours (total hours worked/studied, as written).",
};

function isDocumentType(value: unknown): value is DocumentType {
  return typeof value === "string" && (DOCUMENT_TYPES as string[]).includes(value);
}

function parseNumber(value: unknown): number | null {
  if (typeof value !== "string") return null;
  const match = value.match(/[\d.]+/);
  if (!match) return null;
  const num = parseFloat(match[0]);
  return Number.isNaN(num) ? null : num;
}

// Study-hour info may live in the brochure (生協パンフレット) or the contract/
// estimate (生協契約書) — sometimes only the latter states the actual total.
const ACADEMIC_DOCUMENT_TYPES: DocumentType[] = ["生協パンフレット", "生協契約書"];

// Safety net: if the model didn't state total_study_hours directly, derive it
// from duration_weeks x lessons_per_week (or duration_weeks x study_hours_per_week)
// so the field isn't left blank when the inputs to compute it are available.
function fillComputedFields(
  documentType: DocumentType,
  extracted: Record<string, unknown>
): Record<string, unknown> {
  if (!ACADEMIC_DOCUMENT_TYPES.includes(documentType)) return extracted;
  if (parseNumber(extracted.total_study_hours) !== null) return extracted;

  const weeks = parseNumber(extracted.duration_weeks);
  const lessonsPerWeek = parseNumber(extracted.lessons_per_week);
  const hoursPerWeek = parseNumber(extracted.study_hours_per_week);

  if (weeks !== null && lessonsPerWeek !== null) {
    return { ...extracted, total_study_hours: String(weeks * lessonsPerWeek) };
  }
  if (weeks !== null && hoursPerWeek !== null) {
    return { ...extracted, total_study_hours: String(weeks * hoursPerWeek) };
  }
  return extracted;
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY is not configured on the server" },
      { status: 500 }
    );
  }

  const body = await request.json();
  const { document_type, file_base64 } = body as {
    document_type?: unknown;
    file_base64?: unknown;
  };

  if (!isDocumentType(document_type)) {
    return NextResponse.json({ error: "Invalid or missing document_type" }, { status: 400 });
  }
  if (typeof file_base64 !== "string" || file_base64.length === 0) {
    return NextResponse.json({ error: "Missing file_base64" }, { status: 400 });
  }

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        input: [
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text: `${FIELD_HINTS[document_type]}\n\nReturn null for any field you cannot find in the document. Do not guess.`,
              },
              {
                type: "input_file",
                filename: "document.pdf",
                file_data: `data:application/pdf;base64,${file_base64}`,
              },
            ],
          },
        ],
        text: {
          format: {
            type: "json_schema",
            name: "extracted_fields",
            schema: SCHEMAS[document_type],
            strict: true,
          },
        },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("OpenAI extraction failed:", response.status, errText);
      return NextResponse.json({ error: "OpenAI extraction failed" }, { status: 502 });
    }

    const data = await response.json();
    const message = (data.output as Array<{ type: string; content?: Array<{ type: string; text?: string }> }>)?.find(
      (item) => item.type === "message"
    );
    const textContent = message?.content?.find((c) => c.type === "output_text");

    if (!textContent?.text) {
      console.error("No structured output in OpenAI response:", JSON.stringify(data));
      return NextResponse.json({ error: "No structured output returned" }, { status: 502 });
    }

    const rawExtracted = JSON.parse(textContent.text);
    console.log(`[extract-pdf] raw OpenAI output for ${document_type}:`, JSON.stringify(rawExtracted));

    const extracted = fillComputedFields(document_type, rawExtracted);
    if (extracted !== rawExtracted) {
      console.log(`[extract-pdf] computed total_study_hours fallback applied:`, JSON.stringify(extracted));
    }

    return NextResponse.json({ extracted });
  } catch (err) {
    console.error("Extraction error:", err);
    return NextResponse.json({ error: "Extraction failed" }, { status: 500 });
  }
}
