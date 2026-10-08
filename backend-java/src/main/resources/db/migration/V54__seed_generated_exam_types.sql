INSERT INTO public.exam_types (exam_type_text)
VALUES
    ('GENERATED_QUIZ'),
    ('GENERATED_FLASHCARD')
ON CONFLICT (exam_type_text) DO NOTHING;
