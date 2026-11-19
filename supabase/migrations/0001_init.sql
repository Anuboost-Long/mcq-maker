create table documents (
  id uuid primary key default gen_random_uuid(),
  device_id uuid not null,
  filename text not null,
  title text not null check (char_length(title) between 1 and 120),
  checksum text not null,
  status text not null default 'draft' check (status in ('draft', 'published')),
  issues jsonb not null default '[]',
  uploaded_at timestamptz not null default now(),
  unique (device_id, checksum)
);

create index documents_device_uploaded_idx on documents (device_id, uploaded_at desc);

create table questions (
  document_id uuid not null references documents (id) on delete cascade,
  number int not null,
  section text not null default '',
  stem text not null,
  answer_label text,
  bloom_level text,
  bloom_name text,
  clo text,
  status text not null check (status in ('ready', 'needs_review')),
  issues jsonb not null default '[]',
  primary key (document_id, number)
);

create table question_options (
  document_id uuid not null,
  number int not null,
  label text not null,
  text text not null,
  primary key (document_id, number, label),
  foreign key (document_id, number) references questions (document_id, number) on delete cascade
);

create table quiz_sessions (
  id uuid primary key default gen_random_uuid(),
  device_id uuid not null,
  config jsonb not null,
  started_at bigint not null,
  submitted_at bigint
);

create index quiz_sessions_device_started_idx on quiz_sessions (device_id, started_at desc);

create table quiz_session_questions (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references quiz_sessions (id) on delete cascade,
  position int not null,
  snapshot jsonb not null,
  option_order jsonb not null,
  selected_option_id text,
  flagged boolean not null default false,
  checked boolean not null default false,
  unique (session_id, position)
);

-- No policies on purpose: only the server's direct database connection can read
-- or write these tables, never the public Supabase API keys.
alter table documents enable row level security;
alter table questions enable row level security;
alter table question_options enable row level security;
alter table quiz_sessions enable row level security;
alter table quiz_session_questions enable row level security;
