export type CourseType =
  | "Overseas English Experience I"
  | "Overseas English Experience II"
  | "Overseas English Experience III"
  | "Overseas English Experience IV"
  | "Overseas English Studies I"
  | "Overseas English Studies II"
  | "English Practicum I"
  | "English Practicum II"
  | "English Practicum III"
  | "English Practicum IV"
  | "Short-term Overseas English Studies"
  | "Valencia Program"
  | "Other";

export type DocumentType =
  | "申請書"
  | "生協パンフレット"
  | "生協契約書"
  | "修了証_活動証明書_労働管理書";

export type Case = {
  id: string;
  student_name: string;
  student_number: string;
  email: string;
  term: string;
  course_type: CourseType;
  notes: string | null;
  report_submitted: boolean;
  report_submission_date: string | null;
  report_moodle_link: string | null;
  report_notes: string | null;
  created_at: string;
  updated_at: string;
};

export type ChecklistItem = {
  id: string;
  case_id: string;
  step_number: number;
  completed: boolean;
  completed_at: string | null;
  notes: string | null;
};

export type Document = {
  id: string;
  case_id: string;
  document_type: DocumentType;
  file_path: string;
  file_name: string;
  file_size: number;
  uploaded_at: string;
  extracted_data: ExtractedData | null;
  extraction_confirmed: boolean;
};

export type ExtractedData =
  | ApplicationFormData
  | CoopBrochureData
  | CoopContractData
  | CompletionCertData;

export type ApplicationFormData = {
  type: "申請書";
  student_name?: string;
  student_number?: string;
  email?: string;
  course_type?: string;
  destination?: string;
  planned_departure_date?: string;
  planned_return_date?: string;
  notes?: string;
};

export type CoopBrochureData = {
  type: "生協パンフレット";
  program_name?: string;
  country?: string;
  city?: string;
  institution?: string;
  program_period?: string;
  cost?: string;
  accommodation_type?: string;
};

export type CoopContractData = {
  type: "生協契約書";
  student_name?: string;
  program_name?: string;
  departure_date?: string;
  return_date?: string;
  cost?: string;
  contract_date?: string;
};

export type CompletionCertData = {
  type: "修了証_活動証明書_労働管理書";
  student_name?: string;
  institution_or_organization?: string;
  completion_date?: string;
  activity_period?: string;
  total_hours?: string;
};

export type CaseWithDetails = Case & {
  checklist_items: ChecklistItem[];
  documents: Document[];
};
