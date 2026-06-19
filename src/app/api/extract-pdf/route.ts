import { NextRequest, NextResponse } from "next/server";
import { DocumentType } from "@/types";

// Placeholder: returns empty extracted fields for the given document type.
// Replace this function body with actual AI extraction when ready.
function extractPlaceholder(documentType: DocumentType) {
  switch (documentType) {
    case "申請書":
      return {
        type: "申請書",
        student_name: "",
        student_number: "",
        email: "",
        course_type: "",
        destination: "",
        planned_departure_date: "",
        planned_return_date: "",
        notes: "",
      };
    case "生協パンフレット":
      return {
        type: "生協パンフレット",
        program_name: "",
        country: "",
        city: "",
        institution: "",
        program_period: "",
        cost: "",
        accommodation_type: "",
      };
    case "生協契約書":
      return {
        type: "生協契約書",
        student_name: "",
        program_name: "",
        departure_date: "",
        return_date: "",
        cost: "",
        contract_date: "",
      };
    case "修了証_活動証明書_労働管理書":
      return {
        type: "修了証_活動証明書_労働管理書",
        student_name: "",
        institution_or_organization: "",
        completion_date: "",
        activity_period: "",
        total_hours: "",
      };
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { document_type } = body as { document_type: DocumentType };

  if (!document_type) {
    return NextResponse.json({ error: "document_type is required" }, { status: 400 });
  }

  // Simulate a short processing delay
  await new Promise((r) => setTimeout(r, 500));

  const extracted = extractPlaceholder(document_type);
  return NextResponse.json({ extracted });
}
