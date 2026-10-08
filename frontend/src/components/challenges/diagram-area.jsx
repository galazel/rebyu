import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { DrawIoEmbed } from "react-drawio"

import { getDiagramToolPreset } from "./diagram-tool-presets.js"

const EMPTY_GRID_DIAGRAM = `
<mxGraphModel
  dx="1200"
  dy="800"
  grid="1"
  gridSize="10"
  guides="1"
  tooltips="1"
  connect="1"
  arrows="1"
  fold="1"
  page="0"
  pageScale="1"
  background="#ffffff"
  math="0"
  shadow="0"
>
  <root>
    <mxCell id="0" />
    <mxCell id="1" parent="0" />
  </root>
</mxGraphModel>
`

function normalizeXml(xml) {
    return typeof xml === "string" && xml.trim() ? xml : EMPTY_GRID_DIAGRAM
}

const DRAWIO_ORIGIN = "https://embed.diagrams.net"

if (
    typeof document !== "undefined" &&
    !document.querySelector("link[data-drawio-preconnect]")
) {
    for (const rel of ["preconnect", "dns-prefetch"]) {
        const link = document.createElement("link")
        link.rel = rel
        link.href = DRAWIO_ORIGIN
        link.crossOrigin = "anonymous"
        link.dataset.drawioPreconnect = "true"
        document.head.appendChild(link)
    }
}

const DRAWIO_THEME_CSS = `
  .geEditor, .geEditor *, .geDialog, .geDialog *, .mxWindow, .mxWindow *,
  .geSidebarTooltip, .geSidebarTooltip * {
    font-family: "Google Sans", "Google Sans Flex", Arial, sans-serif !important;
  }

  /* Editor furniture an exam has no use for. The page tabs offer a second
     canvas nobody grades; .geSidebarFooter is the "+ More Shapes" button,
     which opens a dialog of eighty unrelated stencil libraries. */
  .geTabContainer, .geSidebarFooter { display: none !important; }

  .geToolbarContainer, .geMenubarContainer {
    background: #ffffff !important;
    border-bottom: 1px solid #e5e5e5 !important;
    box-shadow: none !important;
  }
  .geToolbarContainer .geButton, .geToolbarContainer a.geButton,
  .geToolbarContainer .geMenuItem {
    border-radius: 10px !important;
    color: #4b4b4b !important;
  }
  .geToolbarContainer .geButton:hover, .geToolbarContainer a.geButton:hover,
  .geToolbarContainer .geMenuItem:hover { background: #f7f7f7 !important; }

  .geSidebarContainer {
    background: #ffffff !important;
    border-right: 1px solid #e5e5e5 !important;
  }
  .geSidebarContainer input, .geSidebarContainer input[type="text"] {
    border: 2px solid #e5e5e5 !important;
    border-radius: 12px !important;
    padding: 7px 10px !important;
    background: #ffffff !important;
    color: #4b4b4b !important;
    box-shadow: none !important;
    outline: none !important;
  }
  .geSidebarContainer input:focus { border-color: #2f6b4f !important; }
  .geTitle {
    color: #777777 !important;
    font-size: 11px !important;
    font-weight: 700 !important;
    letter-spacing: 0.08em !important;
    text-transform: uppercase !important;
    background: transparent !important;
  }
  .geSidebar .geItem:hover {
    background: #e8f1fe !important;
    border-radius: 10px !important;
  }
  .geSidebarTooltip {
    border: 1px solid #e5e5e5 !important;
    border-radius: 12px !important;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1) !important;
  }

  .geFormatContainer {
    background: #ffffff !important;
    border-left: 1px solid #e5e5e5 !important;
    color: #4b4b4b !important;
  }
  .geFormatSection { color: #4b4b4b !important; }

  .geBtn, button.geBtn, .geFormatContainer button {
    border-radius: 10px !important;
    font-weight: 700 !important;
    color: #4b4b4b !important;
    border: 2px solid #e5e5e5 !important;
    background: #ffffff !important;
    box-shadow: none !important;
  }
  .geBtn:hover, button.geBtn:hover, .geFormatContainer button:hover {
    background: #f7f7f7 !important;
  }
  button.gePrimaryBtn, .gePrimaryBtn, .geBtn.gePrimaryBtn {
    background: #2f6b4f !important;
    border: 2px solid #245440 !important;
    color: #ffffff !important;
  }

  .geDialog, .mxWindow {
    border-radius: 16px !important;
    border: 1px solid #e5e5e5 !important;
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.14) !important;
  }
`

export default function DiagramArea({
                                        diagramType = "ERD",
                                        initialXml,
                                        documentId = null,
                                        onChange,
                                        className = "",
                                    }) {
    const [isLoading, setIsLoading] = useState(true)
    const onChangeRef = useRef(onChange)
    const autosaveTimerRef = useRef(null)
    const embedRef = useRef(null)

    const toolPreset = useMemo(
        () => getDiagramToolPreset(diagramType),
        [diagramType]
    )

    const startingXmlRef = useRef(normalizeXml(initialXml))
    const lastSavedXmlRef = useRef(startingXmlRef.current)
    const documentIdRef = useRef(documentId)

    useEffect(() => {
        onChangeRef.current = onChange
    }, [onChange])

    useEffect(() => {
        return () => {
            if (autosaveTimerRef.current) {
                clearTimeout(autosaveTimerRef.current)
            }
        }
    }, [])

    useEffect(() => {
        setIsLoading(true)
    }, [toolPreset.libs])

    useEffect(() => {
        if (documentId === documentIdRef.current) {
            return
        }
        documentIdRef.current = documentId

        if (autosaveTimerRef.current) {
            clearTimeout(autosaveTimerRef.current)
            autosaveTimerRef.current = null
        }

        const nextXml = normalizeXml(initialXml)
        startingXmlRef.current = nextXml
        lastSavedXmlRef.current = nextXml
        embedRef.current?.load({ xml: nextXml, autosave: true })
    }, [documentId, initialXml])

    const handleAutoSave = useCallback((data) => {
        const nextXml = typeof data?.xml === "string" ? data.xml : ""

        if (!nextXml || nextXml === lastSavedXmlRef.current) {
            return
        }

        lastSavedXmlRef.current = nextXml

        if (autosaveTimerRef.current) {
            clearTimeout(autosaveTimerRef.current)
        }

        autosaveTimerRef.current = setTimeout(() => {
            onChangeRef.current?.(lastSavedXmlRef.current)
        }, 750)
    }, [])

    return (
        <div
            className={`rb-diagram-shell h-full min-h-[420px] w-full bg-card ${className}`}
        >
            {isLoading && (
                <div
                    className="absolute inset-0 z-10 flex flex-col bg-card"
                    aria-live="polite"
                >

                    <div className="flex h-11 shrink-0 items-center gap-2 border-b border-rb-swan bg-rb-polar px-3">
                        <div className="h-5 w-5 rounded bg-rb-swan motion-safe:animate-pulse" />
                        <div className="h-5 w-5 rounded bg-rb-swan motion-safe:animate-pulse" />
                        <div className="mx-1 h-5 w-px bg-rb-swan" />
                        {Array.from({ length: 3 }).map((_, item) => (
                            <div
                                key={item}
                                className="h-5 w-5 rounded bg-rb-swan motion-safe:animate-pulse"
                            />
                        ))}
                        <div className="flex-1" />
                        <div className="h-5 w-5 rounded bg-rb-swan motion-safe:animate-pulse" />
                        <div className="h-5 w-5 rounded bg-rb-swan motion-safe:animate-pulse" />
                    </div>

                    <div className="flex min-h-0 flex-1">
                        <div className="hidden w-56 shrink-0 flex-col gap-3 border-r border-rb-swan bg-rb-polar p-3 sm:flex">
                            <div className="h-8 rounded-lg border border-rb-swan bg-card" />

                            {Array.from({ length: 3 }).map((_, item) => (
                                <div
                                    key={item}
                                    className="h-3 w-20 rounded bg-rb-swan motion-safe:animate-pulse"
                                />
                            ))}
                        </div>

                        <div
                            className="relative flex min-w-0 flex-1 flex-col items-center justify-center gap-3 p-6 text-center"
                            style={{
                                backgroundImage:
                                    "linear-gradient(to right, var(--color-rb-swan) 1px, transparent 1px)," +
                                    "linear-gradient(to bottom, var(--color-rb-swan) 1px, transparent 1px)",
                                backgroundSize: "24px 24px",
                            }}
                        >
                            <div className="h-10 w-10 rounded-full border-4 border-rb-swan border-t-rb-feather motion-safe:animate-spin" />

                            <p className="text-sm font-bold text-rb-eel">
                                Loading {toolPreset.label} editor
                            </p>

                            <p className="text-xs font-medium text-rb-wolf">
                                Preparing your diagram workspace...
                            </p>
                        </div>
                    </div>
                </div>
            )}

            <DrawIoEmbed
                ref={embedRef}
                key={toolPreset.libs}
                xml={startingXmlRef.current}
                autosave
                onLoad={() => setIsLoading(false)}
                onAutoSave={handleAutoSave}
                urlParameters={{
                    ui: "simple",
                    sidebar: 1,
                    libraries: 0,
                    libs: toolPreset.libs,
                    format: 0,
                    noSaveBtn: 1,
                    noExitBtn: 1,
                    saveAndExit: 0,
                    splash: 0,
                }}
                configuration={{
                    compressXml: false,
                    compact: true,
                    hideMenus: ["file", "edit", "view", "arrange", "extras", "help"],
                    hideMenuItems: [
                        "importFrom",
                        "exportAs",
                        "embed",
                        "newLibrary",
                        "openLibrary",
                        "pageSetup",
                        "print",
                        "settings",
                        "help",
                        "exit",
                    ],
                    css: DRAWIO_THEME_CSS,
                    customCss: DRAWIO_THEME_CSS,
                    enableCustomLibraries: false,
                    defaultGridEnabled: true,
                    defaultGridSize: 10,
                    defaultPageVisible: false,
                    override: true,
                    version: `rebyu-diagram-editor-v3-${toolPreset.libs}`,
                }}
            />

        </div>
    )
}
