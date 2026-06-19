-- Teacher-confirmed/corrected extraction, stored separately from the raw AI output (extracted_data).
alter table documents
  add column if not exists confirmed_data jsonb;
