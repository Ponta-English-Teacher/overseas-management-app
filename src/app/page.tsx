"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Case, ChecklistItem, Document } from "@/types";
import { createClient } from "@/lib/supabase/client";
import { CaseCard } from "@/components/cases/CaseCard";
import { FilterBar } from "@/components/shared/FilterBar";
import { Button } from "@/components/ui/button";

type CaseWithChecklist = Case & {
  checklist_items: ChecklistItem[];
  documents: Pick<Document, "document_type" | "extracted_data" | "confirmed_data">[];
};

export default function DashboardPage() {
  const [cases, setCases] = useState<CaseWithChecklist[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterTerm, setFilterTerm] = useState("all");
  const [filterCourse, setFilterCourse] = useState("all");
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("cases")
        .select("*, checklist_items(*), documents(document_type, extracted_data, confirmed_data)")
        .order("created_at", { ascending: false });
      setCases((data as CaseWithChecklist[]) ?? []);
      setLoading(false);
    }
    load();
  }, []);

  const filtered = cases.filter((c) => {
    if (filterTerm !== "all" && c.term !== filterTerm) return false;
    if (filterCourse !== "all" && c.course_type !== filterCourse) return false;
    return true;
  });

  const grouped = filtered.reduce<Record<string, CaseWithChecklist[]>>((acc, c) => {
    if (!acc[c.term]) acc[c.term] = [];
    acc[c.term].push(c);
    return acc;
  }, {});

  const sortedTerms = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">Cases</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {cases.length} total · {filtered.length} shown
          </p>
        </div>
        <Link href="/cases/new">
          <Button size="sm">+ New case</Button>
        </Link>
      </div>

      <FilterBar
        term={filterTerm}
        courseType={filterCourse}
        onTermChange={setFilterTerm}
        onCourseTypeChange={setFilterCourse}
      />

      {loading ? (
        <p className="text-sm text-slate-400">Loading…</p>
      ) : sortedTerms.length === 0 ? (
        <p className="text-sm text-slate-400">No cases found.</p>
      ) : (
        <div className="space-y-8">
          {sortedTerms.map((term) => (
            <section key={term}>
              <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">
                {term}
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {grouped[term].map((c) => (
                  <CaseCard
                    key={c.id}
                    caseData={c}
                    checklistItems={c.checklist_items}
                    documents={c.documents}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
