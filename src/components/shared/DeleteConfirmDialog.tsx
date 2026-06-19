"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentName: string;
  onConfirm: () => void;
  loading?: boolean;
};

export function DeleteConfirmDialog({
  open,
  onOpenChange,
  studentName,
  onConfirm,
  loading,
}: Props) {
  const [typed, setTyped] = useState("");
  const confirmed = typed === studentName;

  function handleClose() {
    setTyped("");
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-red-600">Delete Case</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <p className="text-sm text-slate-700">
            This will permanently delete all data and uploaded documents for this case.
            This action cannot be undone.
          </p>
          <div className="space-y-1">
            <Label>
              Type <span className="font-semibold">{studentName}</span> to confirm:
            </Label>
            <Input
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              placeholder={studentName}
              autoComplete="off"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={!confirmed || loading}
          >
            {loading ? "Deleting…" : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
