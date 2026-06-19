import { CourseType, DocumentType } from "@/types";

export const COURSE_TYPES: CourseType[] = [
  "Overseas English Experience I",
  "Overseas English Experience II",
  "Overseas English Experience III",
  "Overseas English Experience IV",
  "Overseas English Studies I",
  "Overseas English Studies II",
  "English Practicum I",
  "English Practicum II",
  "English Practicum III",
  "English Practicum IV",
  "Short-term Overseas English Studies",
  "Valencia Program",
  "Other",
];

export const DOCUMENT_TYPES: { value: DocumentType; label: string; slug: string }[] = [
  { value: "申請書", label: "申請書", slug: "application" },
  { value: "生協パンフレット", label: "生協パンフレット", slug: "coop_brochure" },
  { value: "生協契約書", label: "生協契約書", slug: "coop_contract" },
  {
    value: "修了証_活動証明書_労働管理書",
    label: "修了証 / 活動証明書 / 労働管理書",
    slug: "completion_certificate",
  },
];

export const CHECKLIST_STEPS = [
  { step: 1, label: "相談メール受信" },
  { step: 2, label: "Moodle登録" },
  { step: 3, label: "申請書提出" },
  { step: 4, label: "パンフレット提出" },
  { step: 5, label: "生協契約書提出" },
  { step: 6, label: "国際課手続き確認" },
  { step: 7, label: "学生支援課共有" },
  { step: 8, label: "教授会資料掲載" },
  { step: 9, label: "出発前オリエン参加" },
  { step: 10, label: "修了証・活動証明書提出" },
  { step: 11, label: "報告書提出確認" },
  { step: 12, label: "単位認定処理" },
] as const;

export const TERMS = [
  "2026前期",
  "2026後期",
  "2027前期",
  "2027後期",
  "2028前期",
  "2028後期",
];
