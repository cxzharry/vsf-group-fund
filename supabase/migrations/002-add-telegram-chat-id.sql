-- Add telegram_chat_id to members for Telegram notifications
alter table public.members add column if not exists telegram_chat_id text;
