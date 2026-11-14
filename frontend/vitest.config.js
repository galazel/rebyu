import { defineConfig } from "vitest/config"
import react from "@vitejs/plugin-react"
import { fileURLToPath } from "node:url"

export default defineConfig({
  plugins: [
    // Expose private parser functions only in the test transform, never the app build.
    {
      name: "rebyu-test-internals",
      enforce: "pre",
      transform(code, id) {
        const file = id.replaceAll("\\", "/").split("?")[0]
        if (file.endsWith("/components/learner/lesson-ai-tutor.jsx"))
          return (
            code + "\nexport { streamTutorAnswer as testStreamTutorAnswer };\n"
          )
        if (file.endsWith("/utils/pdf-question-extractor.js"))
          return code + "\nexport { readWithAi as testReadWithAi };\n"
        if (file.endsWith("/pages/learner/workspace/upload-and-learn-page.jsx"))
          return code + "\nexport { TutorPanel as TestTutorPanel };\n"
        if (file.endsWith("/components/learner/lesson-knowledge-check.jsx"))
          return code + "\nexport { localVerdict as testLocalVerdict };\n"
      },
    },
    react(),
  ],
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  test: {
    reporters: ["verbose"],
    environment: "jsdom",
    include: ["src/__test__/TC-*.test.{js,jsx}"],
    setupFiles: ["src/__test__/support/setup.js"],
    maxWorkers: 2,
    testTimeout: 15000,
    hookTimeout: 15000,
    restoreMocks: true,
  },
})
