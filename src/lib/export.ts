import JSZip from "jszip";
import { CaseWithDetails } from "@/types";
import { CHECKLIST_STEPS } from "@/lib/constants";
import { getAcademicSummary, parseStudyHours, STUDY_HOURS_REQUIREMENT } from "@/lib/academicSummary";
import { createClient } from "@/lib/supabase/client";

export async function exportCaseAsZip(caseData: CaseWithDetails): Promise<Blob> {
  const supabase = createClient();
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

  // extracted_info.json — academic_program_summary surfaces the fields the
  // department checks (study hours, dates, etc.) without digging through
  // each document's raw payload. documents[] keeps the per-file detail,
  // preferring the teacher-confirmed data over the raw AI output.
  const academicSummary = getAcademicSummary(caseData.documents);
  const studyHours = parseStudyHours(academicSummary.total_study_hours.value);

  const extractedInfo = {
    academic_program_summary: {
      ...academicSummary,
      meets_60_hour_requirement: studyHours === null ? null : studyHours >= STUDY_HOURS_REQUIREMENT,
    },
    documents: caseData.documents
      .filter((d) => d.extraction_confirmed && (d.confirmed_data || d.extracted_data))
      .map((d) => ({
        document_type: d.document_type,
        file_name: d.file_name,
        extracted_data: d.confirmed_data ?? d.extracted_data,
      })),
  };
  zip.file("extracted_info.json", JSON.stringify(extractedInfo, null, 2));

  // report_status.txt
  const reportLines = [
    `Report Submitted: ${caseData.report_submitted ? "Yes" : "No"}`,
    `Submission Date: ${caseData.report_submission_date ?? "N/A"}`,
    `Moodle Link: ${caseData.report_moodle_link ?? "N/A"}`,
    `Notes: ${caseData.report_notes ?? "N/A"}`,
  ];
  zip.file("report_status.txt", reportLines.join("\n"));

  // Documents/ — all uploaded teacher-managed PDFs from Supabase Storage.
  // Report PowerPoint files are never stored as case documents, but the
  // extension check guards against anything that isn't a PDF.
  const documentsFolder = zip.folder("Documents");
  const exportErrors: string[] = [];

  if (documentsFolder) {
    for (const doc of caseData.documents) {
      if (!doc.file_name.toLowerCase().endsWith(".pdf")) continue;

      try {
        const { data, error } = await supabase.storage
          .from("case-documents")
          .download(doc.file_path);

        if (error || !data) {
          exportErrors.push(`${doc.file_name}: ${error?.message ?? "download returned no data"}`);
          continue;
        }

        documentsFolder.file(doc.file_name, await data.arrayBuffer());
      } catch (err) {
        exportErrors.push(
          `${doc.file_name}: ${err instanceof Error ? err.message : "unknown error"}`
        );
      }
    }
  }

  if (exportErrors.length > 0) {
    zip.file("export_errors.txt", exportErrors.join("\n"));
  }

  return zip.generateAsync({ type: "blob" });
}
