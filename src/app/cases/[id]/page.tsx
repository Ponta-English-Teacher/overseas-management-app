"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Case, ChecklistItem, Document, CaseWithDetails } from "@/types";
import { createClient } from "@/lib/supabase/client";
import { ChecklistPanel } from "@/components/cases/ChecklistPanel";
import { DocumentUploader } from "@/components/cases/DocumentUploader";
import { AcademicProgramSummary } from "@/components/cases/AcademicProgramSummary";
import { ReportTracker } from "@/components/cases/ReportTracker";
import { ExportButton } from "@/components/cases/ExportButton";
import { CaseForm } from "@/components/cases/CaseForm";
import { DeleteConfirmDialog } from "@/components/shared/DeleteConfirmDialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CHECKLIST_STEPS } from "@/lib/constants";

export default function CaseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const supabase = createClient();

  const [caseData, setCaseData] = useState<Case | null>(null);
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("cases")
        .select("*, checklist_items(*), documents(*)")
        .eq("id", id)
        .single();

      if (data) {
        const { checklist_items, documents, ...rest } = data as CaseWithDetails;
        setCaseData(rest);
        setChecklistItems(checklist_items);
        setDocuments(documents);
      }
      setLoading(false);
    }
    load();
  }, [id]);

  async function handleDelete() {
    if (!caseData) return;
    setDeleting(true);

    // Delete storage files
    if (documents.length > 0) {
      await supabase.storage
        .from("case-documents")
        .remove(documents.map((d) => d.file_path));
    }

    await supabase.from("cases").delete().eq("id", id);
    router.push("/");
  }

  if (loading) {
    return <div className="max-w-3xl mx-auto px-4 py-8 text-sm text-slate-400">Loading…</div>;
  }

  if (!caseData) {
    return <div className="max-w-3xl mx-auto px-4 py-8 text-sm text-red-500">Case not found.</div>;
  }

  const completedSteps = checklistItems.filter((c) => c.completed).length;
  const totalSteps = CHECKLIST_STEPS.length;
  const pct = Math.round((completedSteps / totalSteps) * 100);

  const fullCase: CaseWithDetails = {
    ...caseData,
    checklist_items: checklistItems,
    documents,
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Link href="/">
              <Button variant="ghost" size="sm">← Back</Button>
            </Link>
          </div>
          <h1 className="text-xl font-semibold">{caseData.student_name}</h1>
          <p className="text-sm text-slate-500">
            {caseData.student_number} · {caseData.email}
          </p>
          <div className="flex gap-2 flex-wrap">
            <Badge variant="outline">{caseData.term}</Badge>
            <Badge variant="secondary">{caseData.course_type}</Badge>
          </div>
        </div>
        <div className="flex flex-col gap-2 items-end shrink-0">
          <ExportButton caseData={fullCase} />
          <Button
            variant="outline"
            size="sm"
            onClick={() => setEditing((v) => !v)}
          >
            {editing ? "Cancel edit" : "Edit"}
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setDeleteOpen(true)}
          >
            Delete
          </Button>
        </div>
      </div>

      {/* Progress summary */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full ${pct === 100 ? "bg-green-500" : "bg-blue-500"}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="text-sm text-slate-500 shrink-0">
          {completedSteps} / {totalSteps}
        </span>
      </div>

      {/* Edit form */}
      {editing && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Edit case info</CardTitle>
          </CardHeader>
          <CardContent>
            <CaseForm
              initialData={caseData}
              onCancel={() => setEditing(false)}
            />
          </CardContent>
        </Card>
      )}

      {/* Checklist */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Procedure checklist</CardTitle>
        </CardHeader>
        <CardContent>
          <ChecklistPanel caseId={id} items={checklistItems} />
        </CardContent>
      </Card>

      {/* Documents */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Documents</CardTitle>
        </CardHeader>
        <CardContent>
          <DocumentUploader
            caseId={id}
            caseData={caseData}
            documents={documents}
            onDocumentsChange={setDocuments}
            onCaseChange={setCaseData}
          />
        </CardContent>
      </Card>

      {/* Academic program summary */}
      <AcademicProgramSummary documents={documents} />

      {/* Report */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Report status</CardTitle>
        </CardHeader>
        <CardContent>
          <ReportTracker
            caseData={caseData}
            onUpdate={(updated) =>
              setCaseData((prev) => prev ? { ...prev, ...updated } : prev)
            }
          />
        </CardContent>
      </Card>

      {/* Notes (read-only display, editable via Edit form) */}
      {caseData.notes && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600 whitespace-pre-wrap">{caseData.notes}</p>
          </CardContent>
        </Card>
      )}

      <DeleteConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        studentName={caseData.student_name}
        onConfirm={handleDelete}
        loading={deleting}
      />
    </div>
  );
}
