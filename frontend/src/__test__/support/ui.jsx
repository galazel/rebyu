import React from "react"
import { vi } from "vitest"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { MemoryRouter } from "react-router-dom"

export function wrapper({ children }) {
  const [client] = React.useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { retry: false, gcTime: 0 },
          mutations: { retry: false },
        },
      })
  )
  return (
    <MemoryRouter>
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    </MemoryRouter>
  )
}
export function deferred() {
  let resolve, reject
  const promise = new Promise((yes, no) => {
    resolve = yes
    reject = no
  })
  return { promise, resolve, reject }
}
export function shellMock() {
  return {
    default: ({ title, children, footer }) => (
      <main>
        <h1>{title}</h1>
        {children}
        {footer}
      </main>
    ),
  }
}
export function iconMock() {
  return new Proxy(
    { __esModule: true },
    { get: (target, key) => (key in target ? target[key] : () => null) }
  )
}
export const syntheticLearner = {
  firstName: "Ivan",
  lastName: "Cortes",
  email: "ivan@example.test",
  password: "Abcdef1!",
}
