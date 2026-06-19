"use client";

import { useState } from "react";
import { CaseWithDetails } from "@/types";
import { exportCaseAsZip } from "@/lib/export";
import { Button } from "@/components/ui/button";

type Props = {
  caseData: CaseWithDetails;
};

export function ExportButton({ caseData }: Props) {
  const [exporting, setExporting] = useState(false);

  async function handleExport() {
    setExporting(true);
    try {
      const blob = await exportCaseAsZip(
        caseData,
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `case_${caseData.student_number}_${caseData.term}.zip`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Export failed:", err);
    } finally {
      setExporting(false);
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={handleExport} disabled={exporting}>
      {exporting ? "Exporting…" : "Export ZIP"}
    </Button>
  );
}
