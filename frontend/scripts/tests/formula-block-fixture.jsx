import { createRoot } from "react-dom/client"
import { LessonContent } from "../../src/components/certifications/lesson-content-renderer.jsx"
import blocks from "./formula-block-data.json"
import "../../src/index.css"
import "../../src/styles/rebyu-classroom.css"

// The file holds both kinds the lesson now uses; the formula assertions count
// only the formula ones.
const formulaBlocks = blocks.filter((block) => block.type === "formula")
const exampleBlocks = blocks.filter((block) => block.type === "example")

// The real blocks lesson 774 now stores, straight out of the database, plus two
// written by hand: one whose expression is not LaTeX at all, to prove the
// fallback keeps the formula readable rather than printing a KaTeX error, and
// one with no symbols explained.
const structure = [
  {
    id: "section-formulas",
    sectionName: "Formulas",
    content: [
      ...formulaBlocks,
      {
        id: "block-plain",
        type: "formula",
        data: {
          smallHeader: "Written loosely",
          description: "",
          caption: "",
          items: [
            {
              id: "plain-1",
              name: "Not LaTeX",
              latex: "Cost = Power (kW) x Time (h) x $0.12/kWh {",
              where: [],
              note: "This one cannot be typeset and must still read as a formula.",
            },
          ],
        },
      },
      {
        id: "block-bare",
        type: "formula",
        data: {
          smallHeader: "",
          description: "",
          caption: "",
          items: [{ id: "bare-1", name: "", latex: "a^2 + b^2 = c^2", where: [], note: "" }],
        },
      },
      // Chemistry and physical units, which plain KaTeX cannot read at all.
      {
        id: "block-science",
        type: "formula",
        data: {
          smallHeader: "",
          description: "",
          caption: "",
          numbered: true,
          items: [
            { id: "sci-1", name: "Combustion", latex: "\\ce{2H2 + O2 -> 2H2O}", where: [], note: "" },
            { id: "sci-2", name: "Sulfuric acid", latex: "\\ce{H2SO4}", where: [], note: "" },
            { id: "sci-3", name: "Free fall", latex: "g = \\pu{9.81 m/s^2}", where: [], note: "" },
            { id: "sci-4", name: "Bond energy", latex: "\\pu{123 kJ//mol}", where: [], note: "" },
            {
              id: "sci-5",
              name: "A matrix",
              latex: "A = \\begin{bmatrix} 1 & 2 \\\\ 3 & 4 \\end{bmatrix}",
              where: [],
              note: "",
            },
          ],
        },
      },
      // Inline maths in ordinary prose, a list, a heading and a table.
      { id: "head-inline", type: "heading", data: { text: "Deriving \\(E = mc^2\\)" } },
      {
        id: "desc-inline",
        type: "description",
        data: {
          text:
            "The standard deviation \\(\\sigma = \\sqrt{\\frac{1}{n}\\sum(x_i-\\bar{x})^2}\\) grows with the spread, " +
            "and a 50 kW motor at $0.12/kWh still costs $48 a shift — the price is left alone.",
        },
      },
      {
        id: "list-inline",
        type: "unordered-list",
        data: {
          items: [
            { id: "li-1", text: "Water is \\(\\ce{H2O}\\)." },
            { id: "li-2", text: "Area of a circle: \\(A = \\pi r^2\\)." },
          ],
        },
      },
      {
        id: "table-inline",
        type: "table",
        data: {
          smallHeader: "",
          description: "",
          caption: "",
          rowHeaders: true,
          columns: [
            { id: "c1", label: "Quantity" },
            { id: "c2", label: "Formula" },
          ],
          rows: [
            { id: "r1", cells: ["Power", "\\(P = VI\\)"] },
            { id: "r2", cells: ["Resistance", "\\(R = \\frac{V}{I}\\)"] },
          ],
        },
      },
      ...exampleBlocks,

      {
        id: "block-diagnosis",
        type: "example",
        data: {
          smallHeader: "",
          description: "",
          label: "Diagnosis",
          title: "Tracing a deployment that failed after a clean build",
          scenario:
            "The build passed and the image published, but every request to the new " +
            "release returned 502 while the previous one kept serving.",
          givens: [
            { id: "d1", label: "", value: "The server had been rebooted overnight." },
            { id: "d2", label: "", value: "Nothing in the application code changed between the two releases." },
            { id: "d3", label: "Environment", value: "Staging, behind the shared load balancer" },
          ],
          steps: [
            {
              id: "ds1",
              title: "Read the symptom precisely",
              detail: "A 502 is the proxy saying it could not reach the app, not the app refusing the request.",
            },
            {
              id: "ds2",
              title: "Check what the container is listening on",
              detail: "The process bound to localhost rather than to every interface, so nothing outside the container could reach it.",
            },
            {
              id: "ds3",
              title: "Confirm the cause rather than the coincidence",
              detail: "The reboot cleared an environment variable the old release had inherited; the new one read it at start-up.",
            },
          ],
          resultLabel: "Diagnosis",
          result: "A missing bind address, not a code regression.",
          takeaway:
            "A 502 after an unchanged deploy is almost always the environment, not the build. " +
            "Reproduce the symptom before reading the diff.",
          caption: "",
        },
      },

      {
        id: "block-case",
        type: "example",
        data: {
          smallHeader: "",
          description: "",
          label: "Case study",
          title: "Reading a vague requirement against the rule it fails",
          scenario: "A requirement reached sign-off reading: \"The system should be fast.\"",
          givens: [
            { id: "c1", label: "", value: "A requirement must be testable: someone must be able to say whether it was met." },
          ],
          steps: [
            { id: "cs1", title: "Name what cannot be tested", detail: "\"Fast\" has no threshold, no operation and no conditions." },
            { id: "cs2", title: "Ask what decision it informs", detail: "The team wanted search to stay usable under the usual load." },
            { id: "cs3", title: "Rewrite it so it can fail", detail: "Search returns its first page within two seconds for 95% of requests at 200 concurrent users." },
          ],
          resultLabel: "Outcome",
          result: "A requirement that can be checked, and so can be missed.",
          takeaway: "",
          caption: "",
        },
      },
    ],
  },
]

createRoot(document.getElementById("root")).render(
  <div className="netacad-portal rebyu-ds learner-portal">
    <main className="rebyu-page mx-auto max-w-3xl px-4 py-8" data-route-content>
      <LessonContent structure={structure} />
    </main>
  </div>
)
