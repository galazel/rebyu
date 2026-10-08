INSERT INTO public.exam_types (exam_type_text)
VALUES ('RECALL')
ON CONFLICT (exam_type_text) DO NOTHING;
