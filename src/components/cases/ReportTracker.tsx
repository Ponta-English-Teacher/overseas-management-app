"use client";

import { useState } from "react";
import { Case } from "@/types";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";

type Props = {
  caseData: Case;
  onUpdate: (updated: Partial<Case>) => void;
};

export function ReportTracker({ caseData, onUpdate }: Props) {
  const [submitted, setSubmitted] = useState(caseData.report_submitted);
  const [date, setDate] = useState(caseData.report_submission_date ?? "");
  const [link, setLink] = useState(caseData.report_moodle_link ?? "");
  const [notes, setNotes] = useState(caseData.report_notes ?? "");
  const [saving, setSaving] = useState(false);
  const supabase = createClient();

  async function handleSave() {
    setSaving(true);
    const updates = {
      report_submitted: submitted,
      report_submission_date: date || null,
      report_moodle_link: link || null,
      report_notes: notes || null,
    };
    await supabase.from("cases").update(updates).eq("id", caseData.id);
    onUpdate(updates);
    setSaving(false);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Checkbox
          id="report-submitted"
          checked={submitted}
          onCheckedChange={(v) => setSubmitted(Boolean(v))}
        />
        <Label htmlFor="report-submitted">Report submitted</Label>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label htmlFor="report-date">Submission date</Label>
          <Input
            id="report-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="report-link">Moodle link</Label>
          <Input
            id="report-link"
            type="url"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder="https://moodle.example.ac.jp/..."
          />
        </div>
      </div>

      <div className="space-y-1">
        <Label htmlFor="report-notes">Notes</Label>
        <Textarea
          id="report-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          placeholder="Any notes about the report…"
        />
      </div>

      <Button onClick={handleSave} disabled={saving} size="sm">
        {saving ? "Saving…" : "Save report status"}
      </Button>
    </div>
  );
}
