"use client";

import { useState, useRef } from "react";
import { Document, DocumentType } from "@/types";
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
  documents: Document[];
  onDocumentsChange: (docs: Document[]) => void;
};

export function DocumentUploader({ caseId, documents, onDocumentsChange }: Props) {
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

      // Trigger extraction placeholder
      setExtractingDocId(data.id);
      const res = await fetch("/api/extract-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ document_type: selectedType }),
      });
      const { extracted } = await res.json();

      await supabase
        .from("documents")
        .update({ extracted_data: extracted })
        .eq("id", data.id);

      onDocumentsChange(
        [...documents, { ...data, extracted_data: extracted }] as Document[]
      );
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

  async function handleExtractionConfirm(docId: string, data: Record<string, string>) {
    await supabase
      .from("documents")
      .update({ extracted_data: data, extraction_confirmed: true })
      .eq("id", docId);

    onDocumentsChange(
      documents.map((d) =>
        d.id === docId
          ? { ...d, extracted_data: data as Document["extracted_data"], extraction_confirmed: true }
          : d
      )
    );
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
                    {doc.extraction_confirmed && (
                      <Badge variant="outline" className="ml-2 text-xs py-0">
                        Extracted
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  {doc.extracted_data && !doc.extraction_confirmed && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setExtractingDocId(doc.id)}
                    >
                      Review extraction
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
                  documentId={doc.id}
                  documentType={doc.document_type}
                  extractedData={doc.extracted_data}
                  onConfirm={(data) => handleExtractionConfirm(doc.id, data)}
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
