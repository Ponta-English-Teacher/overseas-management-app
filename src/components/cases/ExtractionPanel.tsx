"use client";

import { useState } from "react";
import { Case, DocumentType, ExtractedData } from "@/types";
import { DOCUMENT_TYPES } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";

// Extracted fields that map 1:1 onto a column of the same name on `cases`.
// Fields outside this set (e.g. destination, cost) have no case column, so
// they can only be saved as confirmed_data, never applied to the case.
const CASE_RELEVANT_FIELDS = new Set<keyof Case>([
  "student_name",
  "student_number",
  "email",
  "course_type",
  "notes",
]);

function fieldLabel(key: string) {
  const s = key.replace(/_/g, " ");
  return s.charAt(0).toUpperCase() + s.slice(1);
}

type Props = {
  fileName: string;
  documentType: DocumentType;
  extractedData: ExtractedData;
  confirmedData: ExtractedData | null;
  caseData: Case;
  onApply: (confirmed: Record<string, string | null>, caseUpdates: Partial<Case>) => void;
  onSaveOnly: (confirmed: Record<string, string | null>) => void;
  onDismiss: () => void;
};

export function ExtractionPanel({
  fileName,
  documentType,
  extractedData,
  confirmedData,
  caseData,
  onApply,
  onSaveOnly,
  onDismiss,
}: Props) {
  const baseline = (confirmedData ?? extractedData) as Record<string, string | null>;
  const entries = Object.entries(extractedData).filter(([key]) => key !== "type") as [
    string,
    unknown,
  ][];

  const [fields, setFields] = useState<Record<string, string>>(
    Object.fromEntries(entries.map(([k]) => [k, String(baseline[k] ?? "")]))
  );
  const [selected, setSelected] = useState<Record<string, boolean>>(
    Object.fromEntries(
      entries.map(([k]) => [
        k,
        CASE_RELEVANT_FIELDS.has(k as keyof Case) && String(baseline[k] ?? "").trim().length > 0,
      ])
    )
  );

  function buildConfirmed(): Record<string, string | null> {
    return {
      type: (extractedData as { type: string }).type,
      ...Object.fromEntries(
        entries.map(([k]) => [k, fields[k].trim() === "" ? null : fields[k]])
      ),
    };
  }

  function handleApply() {
    const caseUpdates: Partial<Case> = {};
    for (const [k] of entries) {
      if (selected[k] && CASE_RELEVANT_FIELDS.has(k as keyof Case)) {
        (caseUpdates as Record<string, string>)[k] = fields[k];
      }
    }
    onApply(buildConfirmed(), caseUpdates);
  }

  function handleSaveOnly() {
    onSaveOnly(buildConfirmed());
  }

  const docLabel = DOCUMENT_TYPES.find((d) => d.value === documentType)?.label ?? documentType;

  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardHeader className="pb-2 pt-3 px-4 space-y-1">
        <CardTitle className="text-sm font-medium text-blue-800">
          AI Extracted Information
        </CardTitle>
        <p className="text-xs text-slate-500">
          {fileName} · {docLabel}
        </p>
      </CardHeader>
      <CardContent className="px-4 pb-4 space-y-3">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Field</TableHead>
              <TableHead>Extracted value</TableHead>
              <TableHead>Current case value</TableHead>
              <TableHead className="text-center">Apply to case</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.map(([key]) => {
              const isRelevant = CASE_RELEVANT_FIELDS.has(key as keyof Case);
              const needsReview = fields[key].trim().length === 0;
              const currentCaseValue = isRelevant
                ? String(caseData[key as keyof Case] ?? "")
                : null;

              return (
                <TableRow key={key}>
                  <TableCell className="font-medium align-top whitespace-nowrap">
                    {fieldLabel(key)}
                  </TableCell>
                  <TableCell className="align-top">
                    <Input
                      value={fields[key]}
                      onChange={(e) =>
                        setFields((prev) => ({ ...prev, [key]: e.target.value }))
                      }
                      className="h-8 text-xs"
                      placeholder="(empty)"
                    />
                    {needsReview && (
                      <Badge
                        variant="outline"
                        className="mt-1 border-amber-300 bg-amber-50 text-amber-700 text-xs py-0"
                      >
                        Needs review
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="align-top text-xs text-slate-500">
                    {currentCaseValue === null ? (
                      <span className="text-slate-300">—</span>
                    ) : currentCaseValue === "" ? (
                      <span className="text-slate-300">(empty)</span>
                    ) : (
                      currentCaseValue
                    )}
                  </TableCell>
                  <TableCell className="text-center align-top">
                    <Checkbox
                      checked={selected[key]}
                      disabled={!isRelevant}
                      onCheckedChange={(v) =>
                        setSelected((prev) => ({ ...prev, [key]: Boolean(v) }))
                      }
                    />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>

        <div className="flex gap-2 pt-1">
          <Button size="sm" onClick={handleApply}>
            Apply selected fields
          </Button>
          <Button size="sm" variant="outline" onClick={handleSaveOnly}>
            Save extraction only
          </Button>
          <Button size="sm" variant="ghost" onClick={onDismiss}>
            Ignore extraction
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
