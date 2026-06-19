import JSZip from "jszip";
import { CaseWithDetails } from "@/types";
import { CHECKLIST_STEPS } from "@/lib/constants";

export async function exportCaseAsZip(
  caseData: CaseWithDetails,
  supabaseUrl: string,
  supabaseAnonKey: string
): Promise<Blob> {
  const zip = new JSZip();

  // basic_info.json
  const basicInfo = {
    id: caseData.id,
    student_name: caseData.student_name,
    student_number: caseData.student_number,
    email: caseData.email,
    term: caseData.term,
    course_type: caseData.course_type,
    notes: caseData.notes,
    created_at: caseData.created_at,
    updated_at: caseData.updated_at,
  };
  zip.file("basic_info.json", JSON.stringify(basicInfo, null, 2));

  // progress_checklist.csv
  const csvHeader = "step,label,completed,completed_at,notes\n";
  const csvRows = CHECKLIST_STEPS.map((step) => {
    const item = caseData.checklist_items.find(
      (c) => c.step_number === step.step
    );
    return [
      step.step,
      `"${step.label}"`,
      item?.completed ? "true" : "false",
      item?.completed_at ? `"${item.completed_at}"` : "",
      item?.notes ? `"${item.notes.replace(/"/g, '""')}"` : "",
    ].join(",");
  }).join("\n");
  zip.file("progress_checklist.csv", csvHeader + csvRows);

  // extracted_info.json
  const extractedInfo = caseData.documents
    .filter((d) => d.extracted_data && d.extraction_confirmed)
    .map((d) => ({
      document_type: d.document_type,
      file_name: d.file_name,
      extracted_data: d.extracted_data,
    }));
  zip.file("extracted_info.json", JSON.stringify(extractedInfo, null, 2));

  // report_status.txt
  const reportLines = [
    `Report Submitted: ${caseData.report_submitted ? "Yes" : "No"}`,
    `Submission Date: ${caseData.report_submission_date ?? "N/A"}`,
    `Moodle Link: ${caseData.report_moodle_link ?? "N/A"}`,
    `Notes: ${caseData.report_notes ?? "N/A"}`,
  ];
  zip.file("report_status.txt", reportLines.join("\n"));

  // uploaded PDFs from Supabase Storage
  const pdfFolder = zip.folder("documents");
  if (pdfFolder) {
    for (const doc of caseData.documents) {
      try {
        const fileUrl = `${supabaseUrl}/storage/v1/object/authenticated/${doc.file_path}`;
        const response = await fetch(fileUrl, {
          headers: { Authorization: `Bearer ${supabaseAnonKey}` },
        });
        if (response.ok) {
          const blob = await response.blob();
          const arrayBuffer = await blob.arrayBuffer();
          pdfFolder.file(doc.file_name, arrayBuffer);
        }
      } catch {
        // skip failed downloads silently
      }
    }
  }

  return zip.generateAsync({ type: "blob" });
}
