"use client";

import { useState, useRef } from "react";
import { Case, Document, DocumentType } from "@/types";
import { DOCUMENT_TYPES } from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ExtractionPanel } from "./ExtractionPanel";

type Props = {
  caseId: string;
  caseData: Case;
  documents: Document[];
  onDocumentsChange: (docs: Document[]) => void;
  onCaseChange: (updated: Case) => void;
};

function summarizeExtraction(doc: Document): string | null {
  const data = (doc.confirmed_data ?? doc.extracted_data) as Record<string, string | null> | null;
  if (!data) return null;
  const parts = Object.entries(data)
    .filter(([key, value]) => key !== "type" && value)
    .slice(0, 3)
    .map(([key, value]) => `${key.replace(/_/g, " ")}: ${value}`);
  return parts.length > 0 ? parts.join(" · ") : "No fields read";
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(",")[1] ?? "");
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function DocumentUploader({
  caseId,
  caseData,
  documents,
  onDocumentsChange,
  onCaseChange,
}: Props) {
  const [selectedType, setSelectedType] = useState<DocumentType>("申請書");
  const [uploading, setUploading] = useState(false);
  const [extractingDocId, setExtractingDocId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const slug = DOCUMENT_TYPES.find((dt) => dt.value === selectedType)?.slug ?? "document";
      const path = `${caseId}/${slug}_${Date.now()}.pdf`;

      const { error: storageError } = await supabase.storage
        .from("case-documents")
        .upload(path, file);

      if (storageError) throw storageError;

      const { data, error: dbError } = await supabase
        .from("documents")
        .insert({
          case_id: caseId,
          document_type: selectedType,
          file_path: path,
          file_name: file.name,
          file_size: file.size,
        })
        .select()
        .single();

      if (dbError) throw dbError;

      onDocumentsChange([...documents, data as Document]);

      // Extraction is best-effort: if it fails, the upload itself still succeeded.
      try {
        setExtractingDocId(data.id);
        const file_base64 = await fileToBase64(file);
        const res = await fetch("/api/extract-pdf", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ document_type: selectedType, file_base64 }),
        });

        if (!res.ok) {
          const { error } = await res.json().catch(() => ({ error: "Extraction failed" }));
          throw new Error(error);
        }

        const { extracted } = await res.json();

        await supabase
          .from("documents")
          .update({ extracted_data: extracted })
          .eq("id", data.id);

        onDocumentsChange(
          [...documents, { ...data, extracted_data: extracted }] as Document[]
        );
      } catch (extractErr) {
        console.error("Extraction failed:", extractErr);
        setExtractingDocId(null);
      }
    } catch (err) {
      console.error("Upload failed:", err);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleDelete(doc: Document) {
    await supabase.storage.from("case-documents").remove([doc.file_path]);
    await supabase.from("documents").delete().eq("id", doc.id);
    onDocumentsChange(documents.filter((d) => d.id !== doc.id));
  }

  async function saveConfirmedData(docId: string, confirmed: Record<string, string | null>) {
    const { error } = await supabase
      .from("documents")
      .update({ confirmed_data: confirmed, extraction_confirmed: true })
      .eq("id", docId);

    if (error) {
      console.error("Failed to save confirmed extraction:", error);
      return;
    }

    onDocumentsChange(
      documents.map((d) =>
        d.id === docId
          ? { ...d, confirmed_data: confirmed as Document["confirmed_data"], extraction_confirmed: true }
          : d
      )
    );
  }

  async function handleApplyExtraction(
    docId: string,
    confirmed: Record<string, string | null>,
    caseUpdates: Partial<Case>
  ) {
    await saveConfirmedData(docId, confirmed);

    if (Object.keys(caseUpdates).length > 0) {
      const { error } = await supabase.from("cases").update(caseUpdates).eq("id", caseId);
      if (error) {
        console.error("Failed to apply fields to case:", error);
      } else {
        onCaseChange({ ...caseData, ...caseUpdates });
      }
    }

    setExtractingDocId(null);
  }

  async function handleSaveExtractionOnly(docId: string, confirmed: Record<string, string | null>) {
    await saveConfirmedData(docId, confirmed);
    setExtractingDocId(null);
  }

  function formatBytes(bytes: number) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  return (
    <div className="space-y-4">
      {/* Upload area */}
      <div className="flex gap-2 items-center">
        <Select
          value={selectedType}
          onValueChange={(v) => setSelectedType(v as DocumentType)}
        >
          <SelectTrigger className="w-56">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {DOCUMENT_TYPES.map((dt) => (
              <SelectItem key={dt.value} value={dt.value}>
                {dt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? "Uploading…" : "Upload PDF"}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          className="hidden"
          onChange={handleUpload}
        />
      </div>

      {/* Document list */}
      {documents.length === 0 ? (
        <p className="text-sm text-slate-400">No documents uploaded yet.</p>
      ) : (
        <div className="space-y-2">
          {documents.map((doc) => (
            <div key={doc.id} className="space-y-2">
              <div className="flex items-center justify-between gap-2 p-2.5 rounded-lg border border-slate-100 bg-white">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{doc.file_name}</p>
                  <div className="text-xs text-slate-400">
                    {DOCUMENT_TYPES.find((d) => d.value === doc.document_type)?.label} ·{" "}
                    {formatBytes(doc.file_size)}
                    {doc.extraction_confirmed ? (
                      <Badge variant="outline" className="ml-2 text-xs py-0">
                        Reviewed
                      </Badge>
                    ) : doc.extracted_data ? (
                      <Badge
                        variant="outline"
                        className="ml-2 text-xs py-0 border-amber-300 bg-amber-50 text-amber-700"
                      >
                        Needs review
                      </Badge>
                    ) : null}
                  </div>
                  {doc.extracted_data && (
                    <p className="text-xs text-slate-500 truncate mt-0.5">
                      {summarizeExtraction(doc)}
                    </p>
                  )}
                </div>
                <div className="flex gap-2 shrink-0">
                  {doc.extracted_data && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setExtractingDocId(doc.id)}
                    >
                      View extracted data
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-red-500 hover:text-red-700"
                    onClick={() => handleDelete(doc)}
                  >
                    Delete
                  </Button>
                </div>
              </div>

              {extractingDocId === doc.id && doc.extracted_data && (
                <ExtractionPanel
                  fileName={doc.file_name}
                  documentType={doc.document_type}
                  extractedData={doc.extracted_data}
                  confirmedData={doc.confirmed_data}
                  caseData={caseData}
                  onApply={(confirmed, caseUpdates) =>
                    handleApplyExtraction(doc.id, confirmed, caseUpdates)
                  }
                  onSaveOnly={(confirmed) => handleSaveExtractionOnly(doc.id, confirmed)}
                  onDismiss={() => setExtractingDocId(null)}
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
