alter table device_progress add column if not exists draft text;

create table if not exists user_progress (
  user_id text not null,
  task_id text not null,
  status text not null check (status in ('missed', 'unsure', 'knew')),
  updated_at text not null,
  draft text,
  primary key (user_id, task_id)
);
