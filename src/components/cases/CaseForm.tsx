"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Case, CourseType } from "@/types";
import { COURSE_TYPES, TERMS } from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Props = {
  initialData?: Case;
  onCancel?: () => void;
};

export function CaseForm({ initialData, onCancel }: Props) {
  const [form, setForm] = useState({
    student_name: initialData?.student_name ?? "",
    student_number: initialData?.student_number ?? "",
    email: initialData?.email ?? "",
    term: initialData?.term ?? "",
    course_type: (initialData?.course_type ?? "") as CourseType | "",
    notes: initialData?.notes ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  function set(field: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!form.student_name || !form.student_number || !form.email || !form.term || !form.course_type) {
      setError("All fields except notes are required.");
      return;
    }

    setSaving(true);

    if (initialData) {
      const { error } = await supabase
        .from("cases")
        .update(form)
        .eq("id", initialData.id);
      if (error) { setError(error.message); setSaving(false); return; }
      router.push(`/cases/${initialData.id}`);
      router.refresh();
    } else {
      const { data, error } = await supabase
        .from("cases")
        .insert(form)
        .select()
        .single();
      if (error) { setError(error.message); setSaving(false); return; }
      router.push(`/cases/${data.id}`);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-xl">
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label htmlFor="student_name">Student name</Label>
          <Input
            id="student_name"
            value={form.student_name}
            onChange={(e) => set("student_name", e.target.value)}
            required
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="student_number">Student number</Label>
          <Input
            id="student_number"
            value={form.student_number}
            onChange={(e) => set("student_number", e.target.value)}
            required
          />
        </div>
      </div>

      <div className="space-y-1">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={form.email}
          onChange={(e) => set("email", e.target.value)}
          required
        />
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label>Term</Label>
          <Select value={form.term} onValueChange={(v) => set("term", v)}>
            <SelectTrigger>
              <SelectValue placeholder="Select term" />
            </SelectTrigger>
            <SelectContent>
              {TERMS.map((t) => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label>Course type</Label>
          <Select
            value={form.course_type}
            onValueChange={(v) => set("course_type", v as CourseType)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select course" />
            </SelectTrigger>
            <SelectContent>
              {COURSE_TYPES.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-1">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          value={form.notes}
          onChange={(e) => set("notes", e.target.value)}
          rows={3}
          placeholder="Any additional notes…"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-2">
        <Button type="submit" disabled={saving}>
          {saving ? "Saving…" : initialData ? "Update case" : "Create case"}
        </Button>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
