-- "Organization" is "institution" everywhere in REBYU. Flyway does not run in
-- this project, so this is applied by hand, immediately before deploying the
-- code that expects the new names. Hibernate's ddl-auto=update would otherwise
-- create empty new tables/columns beside the old ones.
BEGIN;

-- If the renamed code has already booted against this database, ddl-auto
-- created empty stand-ins under the new names. Drop them -- only while they are
-- still empty -- so the real tables and columns can take those names.
DO $$
BEGIN
    IF to_regclass('public.organization_certification_learners') IS NOT NULL
       AND to_regclass('public.institution_certification_learners') IS NOT NULL THEN
        IF EXISTS (SELECT 1 FROM institution_certification_learners) THEN
            RAISE EXCEPTION 'institution_certification_learners already has rows';
        END IF;
        DROP TABLE institution_certification_learners;
    END IF;
    IF to_regclass('public.organization_certificates') IS NOT NULL
       AND to_regclass('public.institution_certificates') IS NOT NULL THEN
        IF EXISTS (SELECT 1 FROM institution_certificates) THEN
            RAISE EXCEPTION 'institution_certificates already has rows';
        END IF;
        DROP TABLE institution_certificates;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_name = 'partnership_requests' AND column_name = 'organization_name')
       AND EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'partnership_requests' AND column_name = 'institution_name') THEN
        IF EXISTS (SELECT 1 FROM partnership_requests
                   WHERE institution_name IS NOT NULL OR institution_email IS NOT NULL
                      OR institution_address IS NOT NULL) THEN
            RAISE EXCEPTION 'partnership_requests.institution_* already has data';
        END IF;
        ALTER TABLE partnership_requests DROP COLUMN institution_name,
                                         DROP COLUMN institution_email,
                                         DROP COLUMN institution_address;
    END IF;
END $$;

ALTER TABLE organization_certificates RENAME TO institution_certificates;
ALTER TABLE institution_certificates RENAME COLUMN org_cert_id TO institution_cert_id;
ALTER TABLE institution_certificates RENAME CONSTRAINT organization_certificates_pkey TO institution_certificates_pkey;
ALTER TABLE institution_certificates RENAME CONSTRAINT organization_certificates_status_check TO institution_certificates_status_check;

ALTER TABLE organization_certification_learners RENAME TO institution_certification_learners;
ALTER TABLE institution_certification_learners RENAME COLUMN org_cert_learner_id TO institution_cert_learner_id;
ALTER TABLE institution_certification_learners RENAME COLUMN org_cert_id TO institution_cert_id;
ALTER TABLE institution_certification_learners RENAME CONSTRAINT organization_certification_learners_pkey TO institution_certification_learners_pkey;
ALTER TABLE institution_certification_learners RENAME CONSTRAINT organization_certification_learners_status_check TO institution_certification_learners_status_check;

ALTER TABLE institution_groups RENAME COLUMN org_cert_id TO institution_cert_id;
ALTER TABLE learner_invitations RENAME COLUMN org_cert_id TO institution_cert_id;
ALTER TABLE institution_group_assignees RENAME COLUMN org_cert_learner_id TO institution_cert_learner_id;

ALTER TABLE institutions RENAME COLUMN organization_type TO institution_type;
ALTER TABLE institutions RENAME CONSTRAINT institutions_organization_type_check TO institutions_institution_type_check;

ALTER TABLE partnership_requests RENAME COLUMN organization_name TO institution_name;
ALTER TABLE partnership_requests RENAME COLUMN organization_email TO institution_email;
ALTER TABLE partnership_requests RENAME COLUMN organization_address TO institution_address;

COMMIT;
