-- Cases (main entity)
create table if not exists cases (
  id uuid primary key default gen_random_uuid(),
  student_name text not null,
  student_number text not null,
  email text not null,
  term text not null,
  course_type text not null,
  notes text,
  report_submitted boolean not null default false,
  report_submission_date date,
  report_moodle_link text,
  report_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Auto-update updated_at
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger cases_updated_at
  before update on cases
  for each row execute function update_updated_at();

-- Checklist items (12 per case, auto-created by trigger)
create table if not exists checklist_items (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references cases(id) on delete cascade,
  step_number integer not null check (step_number between 1 and 12),
  completed boolean not null default false,
  completed_at timestamptz,
  notes text,
  unique (case_id, step_number)
);

-- Auto-create 12 checklist items when a case is inserted
create or replace function create_checklist_items()
returns trigger as $$
declare
  i integer;
begin
  for i in 1..12 loop
    insert into checklist_items (case_id, step_number)
    values (new.id, i);
  end loop;
  return new;
end;
$$ language plpgsql;

create trigger cases_create_checklist
  after insert on cases
  for each row execute function create_checklist_items();

-- Documents (teacher-managed PDFs)
create table if not exists documents (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references cases(id) on delete cascade,
  document_type text not null,
  file_path text not null,
  file_name text not null,
  file_size integer not null,
  uploaded_at timestamptz not null default now(),
  extracted_data jsonb,
  extraction_confirmed boolean not null default false
);

-- Permissive RLS for single-teacher dev use
alter table cases enable row level security;
alter table checklist_items enable row level security;
alter table documents enable row level security;

create policy "allow all for authenticated" on cases
  for all to authenticated using (true) with check (true);

create policy "allow all for authenticated" on checklist_items
  for all to authenticated using (true) with check (true);

create policy "allow all for authenticated" on documents
  for all to authenticated using (true) with check (true);

-- Storage bucket for teacher-managed documents
insert into storage.buckets (id, name, public)
values ('case-documents', 'case-documents', false)
on conflict do nothing;

create policy "allow authenticated uploads" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'case-documents');

create policy "allow authenticated reads" on storage.objects
  for select to authenticated
  using (bucket_id = 'case-documents');

create policy "allow authenticated deletes" on storage.objects
  for delete to authenticated
  using (bucket_id = 'case-documents');
