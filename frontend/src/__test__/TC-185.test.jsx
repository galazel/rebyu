// TC-185: Notification failure
// Catalog: frontend/REBYU_UNIT_TEST_CASES.txt
// Scope note: Verifies no false read state on failure. The hook currently has no single-item markRead error toast; that catalog requirement is additional uncovered behavior.
import React from "react"
import { test, expect, vi } from "vitest"
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
  renderHook,
} from "@testing-library/react"
import { wrapper, deferred } from "./support/ui.jsx"
import { request, toast } from "./support/services.js"
const notificationMocks = vi.hoisted(() => ({ get: vi.fn(), mark: vi.fn() }))
vi.mock("@/services/notificationService.js", () => ({
  getMyNotifications: notificationMocks.get,
  markNotificationRead: notificationMocks.mark,
  markAllNotificationsRead: vi.fn(),
  deleteNotification: vi.fn(),
  deleteAllNotifications: vi.fn(),
  streamNotifications: () => () => {},
}))
import { useNotifications } from "@/hooks/use-notifications.js"

test("TC-185: Notification failure", async (context) => {
  let items = [
    { id: 1, title: "One", read: false },
    { id: 2, title: "Two", read: false },
  ]
  notificationMocks.get.mockImplementation(async () => items)
  notificationMocks.mark.mockRejectedValue(new Error("Offline"))
  const { result } = renderHook(() => useNotifications(), { wrapper })
  await waitFor(() => expect(result.current.items).toHaveLength(2))
  act(() => result.current.markRead(1))
  await waitFor(() => expect(notificationMocks.mark).toHaveBeenCalled())
  await waitFor(() => expect(result.current.items[0].read).toBe(false))
  expect(result.current.items[1].read).toBe(false)
}, 15000)
