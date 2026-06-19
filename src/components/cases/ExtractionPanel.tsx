"use client";

import { useState } from "react";
import { DocumentType, ExtractedData } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";

type Props = {
  documentId: string;
  documentType: DocumentType;
  extractedData: ExtractedData;
  onConfirm: (data: Record<string, string>) => void;
  onDismiss: () => void;
};

export function ExtractionPanel({
  documentType,
  extractedData,
  onConfirm,
  onDismiss,
}: Props) {
  const entries = Object.entries(extractedData).filter(([key]) => key !== "type");

  const [fields, setFields] = useState<Record<string, string>>(
    Object.fromEntries(entries.map(([k, v]) => [k, String(v ?? "")]))
  );
  const [selected, setSelected] = useState<Record<string, boolean>>(
    Object.fromEntries(entries.map(([k]) => [k, true]))
  );

  function handleConfirmSelected() {
    const confirmed = Object.fromEntries(
      Object.entries(fields).filter(([k]) => selected[k])
    );
    onConfirm({ type: (extractedData as { type: string }).type, ...confirmed });
  }

  function handleConfirmAll() {
    onConfirm({ type: (extractedData as { type: string }).type, ...fields });
  }

  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardHeader className="pb-2 pt-3 px-4">
        <CardTitle className="text-sm font-medium text-blue-800">
          Extracted data from {documentType} — review before saving
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {entries.map(([key]) => (
            <div key={key} className="space-y-1">
              <div className="flex items-center gap-2">
                <Checkbox
                  id={`extract-${key}`}
                  checked={selected[key]}
                  onCheckedChange={(v) =>
                    setSelected((prev) => ({ ...prev, [key]: Boolean(v) }))
                  }
                />
                <Label htmlFor={`extract-${key}`} className="text-xs text-slate-600">
                  {key.replace(/_/g, " ")}
                </Label>
              </div>
              <Input
                value={fields[key]}
                onChange={(e) =>
                  setFields((prev) => ({ ...prev, [key]: e.target.value }))
                }
                className="h-7 text-xs"
                disabled={!selected[key]}
              />
            </div>
          ))}
        </div>
        <div className="flex gap-2 pt-1">
          <Button size="sm" onClick={handleConfirmAll}>
            Accept all
          </Button>
          <Button size="sm" variant="outline" onClick={handleConfirmSelected}>
            Accept selected
          </Button>
          <Button size="sm" variant="ghost" onClick={onDismiss}>
            Ignore
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
