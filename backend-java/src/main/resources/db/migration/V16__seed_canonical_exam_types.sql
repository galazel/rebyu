INSERT INTO public.exam_types (exam_type_text)
VALUES
    ('MAJOR_EXAM'),
    ('MIDDLE_EXAM'),
    ('LESSON_QUIZ')
ON CONFLICT (exam_type_text) DO NOTHING;
