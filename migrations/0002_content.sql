-- Curriculum catalog and anonymous device progress.
-- Rows are not owned by an account. Progress stores only a client-generated
-- device id and a status, and nothing writes it until a later phase.

create table if not exists content_task (
  id text primary key,
  kind text not null,
  level integer not null,
  sort_order integer not null,
  updated_at text not null,
  rev integer not null,
  hash text not null,
  body jsonb not null
);

create index if not exists content_task_level_idx on content_task (level, sort_order);

create table if not exists content_tombstone (
  id text primary key,
  deleted_at text not null
);

create table if not exists device_progress (
  device_id text not null,
  task_id text not null,
  status text not null check (status in ('missed', 'unsure', 'knew')),
  updated_at text not null,
  primary key (device_id, task_id)
);
