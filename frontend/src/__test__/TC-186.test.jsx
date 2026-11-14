// TC-186: Preference payload
// Catalog: frontend/REBYU_UNIT_TEST_CASES.txt
import React from "react"
import { test, expect, vi } from "vitest"
import { renderHook, act, waitFor } from "@testing-library/react"
import { request, toast } from "./support/services.js"
import { wrapper } from "./support/ui.jsx"
import { updateMyNotificationPreferences } from "@/services/notificationPreferenceService.js"

test("TC-186: Preference payload", async (context) => {
  const preferences = { emailEnabled: false, remindersEnabled: true }
  request.mockResolvedValue(preferences)
  await expect(updateMyNotificationPreferences(preferences)).resolves.toEqual(
    preferences
  )
  expect(request).toHaveBeenCalledWith("notification-preferences/me", {
    method: "PUT",
    data: preferences,
  })
}, 15000)
