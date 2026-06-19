"use client";

import { useState } from "react";
import { ChecklistItem } from "@/types";
import { CHECKLIST_STEPS } from "@/lib/constants";
import { Checkbox } from "@/components/ui/checkbox";
import { createClient } from "@/lib/supabase/client";

type Props = {
  caseId: string;
  items: ChecklistItem[];
};

export function ChecklistPanel({ caseId, items }: Props) {
  const [localItems, setLocalItems] = useState<ChecklistItem[]>(items);
  const supabase = createClient();

  async function toggleStep(stepNumber: number, checked: boolean) {
    const item = localItems.find((i) => i.step_number === stepNumber);
    if (!item) return;

    const now = new Date().toISOString();
    const updates = {
      completed: checked,
      completed_at: checked ? now : null,
    };

    const { data, error } = await supabase
      .from("checklist_items")
      .update(updates)
      .eq("id", item.id)
      .select()
      .single();

    if (!error && data) {
      setLocalItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, ...updates } : i))
      );
    }
  }

  return (
    <div className="space-y-1">
      {CHECKLIST_STEPS.map(({ step, label }) => {
        const item = localItems.find((i) => i.step_number === step);
        const checked = item?.completed ?? false;

        return (
          <div
            key={step}
            className={`flex items-center gap-3 p-2.5 rounded-lg border transition-colors ${
              checked ? "bg-green-50 border-green-200" : "bg-white border-slate-100"
            }`}
          >
            <Checkbox
              id={`step-${step}`}
              checked={checked}
              onCheckedChange={(val) => toggleStep(step, Boolean(val))}
            />
            <label
              htmlFor={`step-${step}`}
              className={`text-sm cursor-pointer flex-1 ${
                checked ? "line-through text-slate-400" : "text-slate-700"
              }`}
            >
              <span className="text-xs font-mono text-slate-400 mr-2">{step}.</span>
              {label}
            </label>
            {item?.completed_at && (
              <span className="text-xs text-slate-400 shrink-0">
                {new Date(item.completed_at).toLocaleDateString("ja-JP")}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
