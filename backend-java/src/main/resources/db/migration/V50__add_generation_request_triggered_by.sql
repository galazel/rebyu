ALTER TABLE public.generation_requests
    ADD COLUMN IF NOT EXISTS triggered_by_user_id BIGINT NULL
        REFERENCES public.users(user_id);
