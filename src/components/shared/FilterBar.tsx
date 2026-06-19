"use client";

import { COURSE_TYPES, TERMS } from "@/lib/constants";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Props = {
  term: string;
  courseType: string;
  onTermChange: (value: string) => void;
  onCourseTypeChange: (value: string) => void;
};

export function FilterBar({ term, courseType, onTermChange, onCourseTypeChange }: Props) {
  return (
    <div className="flex gap-3 flex-wrap">
      <Select value={term} onValueChange={onTermChange}>
        <SelectTrigger className="w-40">
          <SelectValue placeholder="All Terms" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Terms</SelectItem>
          {TERMS.map((t) => (
            <SelectItem key={t} value={t}>
              {t}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={courseType} onValueChange={onCourseTypeChange}>
        <SelectTrigger className="w-64">
          <SelectValue placeholder="All Course Types" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Course Types</SelectItem>
          {COURSE_TYPES.map((c) => (
            <SelectItem key={c} value={c}>
              {c}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
