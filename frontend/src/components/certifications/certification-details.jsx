import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSet,
} from "@/components/ui/field"

import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

import { Checkbox } from "@/components/ui/checkbox"

import { REFERENCE_PROGRAM, useReferenceDetails } from "@/services/referenceService.js"

import {
  MAX_DESCRIPTION_LENGTH,
  MAX_TITLE_LENGTH,
  MIN_DESCRIPTION_LENGTH,
  MIN_TITLE_LENGTH,
} from "@/utils/certification-edit"

function CertificationDetails({ value, onChange, errors = {}, disabled = false }) {
  // The departments a certification sits under on the partnership request forms
  // (Reference lists > Programs). The first one chosen is its main department.
  const { options: programs } = useReferenceDetails(REFERENCE_PROGRAM)
  const departments = programs.map((program) => program.label)
  const selected = Array.isArray(value.departments)
      ? value.departments
      : programs
          .filter((program) => (program.certificationIds ?? []).map(Number).includes(Number(value.certificationId)))
          .map((program) => program.label)
  const chosen = selected.length > 0 ? selected : value.department ? [value.department] : []

  function toggleDepartment(name) {
    const next = chosen.includes(name) ? chosen.filter((entry) => entry !== name) : [...chosen, name]
    onChange({ ...value, departments: next, department: next[0] ?? "" })
  }

  function updateField(fieldName, fieldValue) {
    onChange({
      ...value,
      [fieldName]: fieldValue,
    })
  }

  return (
      <FieldSet className="w-full">
        <FieldGroup className="gap-5">
          <Field>
            <FieldLabel htmlFor="certification-title">
              Certification Name
            </FieldLabel>

            <Input
                id="certification-title"
                type="text"
                disabled={disabled}
                value={value.title ?? ""}
                minLength={MIN_TITLE_LENGTH}
                maxLength={MAX_TITLE_LENGTH}
                onChange={(event) => {
                  updateField("title", event.target.value)
                }}
                placeholder="Example: IT Passport Certification"
                aria-invalid={Boolean(errors.title)}
                aria-describedby={
                  errors.title
                      ? "certification-title-error"
                      : "certification-title-description"
                }
            />

            <FieldDescription id="certification-title-description">
              Use at least {MIN_TITLE_LENGTH} characters and no more than{" "}
              {MAX_TITLE_LENGTH} characters.
            </FieldDescription>

            {errors.title && (
                <FieldError id="certification-title-error">
                  {errors.title}
                </FieldError>
            )}
          </Field>

          <FieldGroup className="grid grid-cols-1 gap-5">
            <Field>
              <FieldLabel htmlFor="certification-department">
                Departments
              </FieldLabel>

              <div
                  id="certification-department"
                  role="group"
                  aria-invalid={Boolean(errors.department)}
                  aria-describedby={errors.department ? "certification-department-error" : "certification-department-hint"}
                  className="grid gap-1.5 rounded-md border border-input p-2 sm:grid-cols-2"
              >
                {departments.map((department) => (
                    <label
                        key={department}
                        className="flex cursor-pointer items-center gap-2 rounded px-1.5 py-1 text-sm hover:bg-muted"
                    >
                      <Checkbox
                          disabled={disabled}
                          checked={chosen.includes(department)}
                          onCheckedChange={() => toggleDepartment(department)}
                      />
                      <span className="min-w-0">{department}</span>
                    </label>
                ))}
              </div>
              <FieldDescription id="certification-department-hint">
                Pick every department this certification is for. The first one you pick is its main department.
              </FieldDescription>

              {errors.department && (
                  <FieldError id="certification-department-error">
                    {errors.department}
                  </FieldError>
              )}
            </Field>
          </FieldGroup>

          <Field>
            <FieldLabel htmlFor="certification-description">
              Description
            </FieldLabel>

            <Textarea

                disabled={disabled}
                id="certification-description"
                value={value.description ?? ""}
                minLength={MIN_DESCRIPTION_LENGTH}
                maxLength={MAX_DESCRIPTION_LENGTH}
                onChange={(event) => {
                  updateField("description", event.target.value)
                }}
                placeholder="Write a short description about this certification review."
                className="min-h-28 resize-y"
                aria-invalid={Boolean(errors.description)}
                aria-describedby={
                  errors.description
                      ? "certification-description-error"
                      : "certification-description-help"
                }
            />

            <div className="flex items-center justify-between gap-3">
              <FieldDescription id="certification-description-help">
                Explain what learners will study in this review. Minimum:{" "}
                {MIN_DESCRIPTION_LENGTH} characters.
              </FieldDescription>

              <span className="shrink-0 text-xs text-muted-foreground">
              {(value.description ?? "").length}/{MAX_DESCRIPTION_LENGTH}
            </span>
            </div>

            {errors.description && (
                <FieldError id="certification-description-error">
                  {errors.description}
                </FieldError>
            )}
          </Field>

        </FieldGroup>
      </FieldSet>
  )
}

export default CertificationDetails