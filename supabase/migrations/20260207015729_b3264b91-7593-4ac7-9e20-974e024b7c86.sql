ALTER TABLE public.builds DROP CONSTRAINT builds_status_check;

ALTER TABLE public.builds ADD CONSTRAINT builds_status_check CHECK (status = ANY (ARRAY['preparing'::text, 'queued'::text, 'extracting'::text, 'building'::text, 'completed'::text, 'failed'::text]));