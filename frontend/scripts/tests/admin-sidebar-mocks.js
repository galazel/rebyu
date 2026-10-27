export function useAuth() {
  return { user: { displayName: "Portal Owner", email: "admin@example.test" }, logout: async () => { window.adminLogoutCalled = true } }
}
export function isDepartmentHeadUser() { return false }
export function useNotifications() { return { items: [], unreadCount: 0, isLoading: false, open() {}, markAllRead() {}, remove() {} } }
export function useAvatarUrl() { return null }
export function usePortalTheme() {}
export function TaggingJobWatcher() { return null }
export async function getAllCertifications() {
  return [{ certificationId: 4, title: "IT Passport Exam", department: "Information technology", majorCategory: [{ title: "Security", middleCategory: [{ title: "Security basics", lessons: [{ lessonId: 246, name: "Information Security Principles" }] }] }] }]
}
