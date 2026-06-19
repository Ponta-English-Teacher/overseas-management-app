import Link from "next/link";
import { CaseForm } from "@/components/cases/CaseForm";
import { Button } from "@/components/ui/button";

export default function NewCasePage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/">
          <Button variant="ghost" size="sm">← Back</Button>
        </Link>
        <h1 className="text-xl font-semibold">New case</h1>
      </div>
      <CaseForm />
    </div>
  );
}
