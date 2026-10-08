INSERT INTO user_types (user_type_text)
SELECT 'INSTITUTION_MEMBER'
WHERE NOT EXISTS (
    SELECT 1 FROM user_types WHERE user_type_text = 'INSTITUTION_MEMBER'
);

UPDATE users u
SET user_type_id = (SELECT user_type_id FROM user_types WHERE user_type_text = 'INSTITUTION_MEMBER')
WHERE u.user_type_id = (SELECT user_type_id FROM user_types WHERE user_type_text = 'INSTITUTION')
  AND EXISTS (
      SELECT 1 FROM institution_members em
      WHERE em.user_id = u.user_id
        AND em.member_role <> 'owner'
        AND em.is_primary_contact = FALSE
  )
  AND NOT EXISTS (
      SELECT 1 FROM institution_members em2
      WHERE em2.user_id = u.user_id
        AND (em2.member_role = 'owner' OR em2.is_primary_contact = TRUE)
  );
