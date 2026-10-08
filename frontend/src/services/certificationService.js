import { API, base } from "./base"

export async function getAllCertifications(includeDepartmentId, { includeComingSoon = false } = {}) {
    const departmentId = Number(includeDepartmentId)
    const params = new URLSearchParams()
    if (Number.isFinite(departmentId) && includeDepartmentId != null) {
        params.set("includeDepartmentId", String(departmentId))
    }
    if (includeComingSoon === true) params.set("includeComingSoon", "true")
    const query = params.toString()
    return await base(query ? `certifications?${query}` : "certifications")
}

export async function addCertification(data) {
    return await base("certifications", {
        data,
        method: "POST",
    })
}

export async function updateCertification(id, data) {
    return await base(`certifications/${id}`, {
        data,
        method: "PUT",
    })
}

export async function deleteCertification(id) {
    return await base(`certifications/${id}`, {
        method: "DELETE",
    })
}


export async function addMajorCategory({ certificationId, title }) {
    return await base("major-categories", {
        data: { certificationId, title },
        method: "POST",
    })
}

export async function deleteMajorCategory(id) {
    return await base(`major-categories/${id}`, { method: "DELETE" })
}

export async function addMiddleCategory({ majorCategoryId, title }) {
    return await base("middle-categories", {
        data: { majorCategoryId, title },
        method: "POST",
    })
}

export async function deleteMiddleCategory(id) {
    return await base(`middle-categories/${id}`, { method: "DELETE" })
}

export async function addLesson({ middleCategoryId, name }) {
    return await base("lessons", {
        data: { middleCategoryId, name, lessonComponentStructure: "[]" },
        method: "POST",
    })
}

export async function deleteLesson(id) {
    return await base(`lessons/${id}`, { method: "DELETE" })
}

export async function publishCertification(id) {
    return await base(`certifications/publish/${id}`, {
        method: "PUT",
    })
}

export async function getCertificationPublishingRequirements(id) {
    return await base(`certifications/${id}/publishing-requirements`, {
        method: "GET",
    })
}




export async function generateCertificationStructure(certificationId, files, onUploadProgress) {
    const formData = new FormData()

    formData.append("certificationId", String(certificationId))

    files.forEach((file) => {
        formData.append("files", file)
    })

    return await base("ai/curriculum/generate", {
        method: "POST",
        data: formData,
        onUploadProgress,
    })
}

export async function addCertificationWithAi(
    data,
    files,
    onUploadProgress,
    reviewMode = "guided",
    questionTypes = [],
    badge = null,
    questionBankSize = null,
    lessonCount = null
) {
    const formData = new FormData()

    formData.append(
        "data",
        new Blob([JSON.stringify(data)], { type: "application/json" })
    )

    files.forEach((file) => {
        formData.append("files", file)
    })

    if (badge) formData.append("badge", badge)

    const params = new URLSearchParams({ reviewMode })
    ;(questionTypes ?? []).forEach((type) => params.append("questionTypes", type))
    if (questionBankSize) params.set("questionBankSize", String(questionBankSize))
    if (lessonCount) params.set("lessonCount", String(lessonCount))

    return await base(`certifications/generate?${params.toString()}`, {
        method: "POST",
        data: formData,
        onUploadProgress,
    })
}

export async function appendToCertificationWithAi(
    certificationId,
    files,
    {
        additionalInstructions = "",
        reviewMode = "guided",
        questionTypes = [],
        questionBankSize = null,
        lessonCount = null,
        onUploadProgress,
    } = {}
) {
    const formData = new FormData()

    ;(files ?? []).forEach((file) => {
        formData.append("files", file)
    })
    if (!(files ?? []).length) formData.append("source", "instructions")

    const params = new URLSearchParams({ reviewMode })
    if (additionalInstructions.trim()) {
        params.set("additionalInstructions", additionalInstructions.trim())
    }
    questionTypes.forEach((type) => params.append("questionTypes", type))
    if (questionBankSize) params.set("questionBankSize", String(questionBankSize))
    if (lessonCount) params.set("lessonCount", String(lessonCount))

    return await base(
        `certifications/${certificationId}/generate/append?${params.toString()}`,
        { method: "POST", data: formData, onUploadProgress }
    )
}
export function certificationBadgeUrl(certificationId) {
    return `${API}/certifications/${certificationId}/badge`
}

export function setCertificationBadge(certificationId, file) {
    const formData = new FormData()
    formData.append("badge", file)
    return base(`certifications/${certificationId}/badge`, { method: "PUT", data: formData })
}

export function removeCertificationBadge(certificationId) {
    return base(`certifications/${certificationId}/badge`, { method: "DELETE" })
}
