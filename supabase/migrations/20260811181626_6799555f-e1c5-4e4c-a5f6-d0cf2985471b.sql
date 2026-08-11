CREATE TABLE public.app_config (
  id BOOLEAN PRIMARY KEY DEFAULT true CHECK (id),
  event_name TEXT NOT NULL DEFAULT 'INFOMAT 2026',
  web_app_url TEXT NOT NULL DEFAULT '',
  volunteer_username TEXT NOT NULL DEFAULT '',
  volunteer_password_hash TEXT NOT NULL DEFAULT '',
  head_username TEXT NOT NULL DEFAULT '',
  head_password_hash TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT ALL ON public.app_config TO service_role;

ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;

INSERT INTO public.app_config (id) VALUES (true);