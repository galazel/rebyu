import React from "react"
import { Trash2 } from "@/components/icons"
import {
    AccordionTool,
    CodeTool,
    DescriptionTool,
    FlipGridTool,
    HeadingTool,
    ImageTool,
    TabsTool,
    VideoTool,
    SubheadingTool,
    UnorderedListTool,
    OrderedListTool,
    ImageLeftTextTool,
    ImageRightTextTool,
    IntroImageCardTool,
    HeaderDescriptionGridTool,
    ImageFeatureGridTool,
    ReviewCardGridTool,
    ContentAccordionBlockTool,
    ContentTabsBlockTool,
    MediaTextBlockTool,
    ImageHotspotTool,
    TableTool,
} from "./tools.jsx"

const TOOL_COMPONENTS = {
    heading: HeadingTool,
    subheading: SubheadingTool,
    description: DescriptionTool,
    "unordered-list": UnorderedListTool,
    "ordered-list": OrderedListTool,
    tabs: TabsTool,
    accordion: AccordionTool,
    "flip-grid": FlipGridTool,
    image: ImageTool,
    video: VideoTool,
    "image-left-text": ImageLeftTextTool,
    "image-right-text": ImageRightTextTool,
    "intro-image-card": IntroImageCardTool,
    "header-description-grid": HeaderDescriptionGridTool,
    "image-feature-grid": ImageFeatureGridTool,
    "review-card-grid": ReviewCardGridTool,
    "content-accordion-block": ContentAccordionBlockTool,
    "content-tabs-block": ContentTabsBlockTool,
    "media-text-block": MediaTextBlockTool,
    "image-hotspot": ImageHotspotTool,
    table: TableTool,
    code: CodeTool,
}

function Section({
                     section,
                     onChange,
                     onDelete,
                     handleToolDataChange,
                     onClick,
                     sectionIndex,
                     handleRemovalTool,
                 }) {
    const tools = section.content ?? []

    return (
        <div
            className="group relative mx-auto w-full max-w-5xl min-w-0"
            onClick={onClick}
        >
            <div className="mb-6 flex min-w-0 items-center justify-between gap-3">
                <input
                    id={`section-name-${section.id}`}
                    type="text"
                    value={section.sectionName ?? ""}
                    onChange={(event) =>
                        onChange(section.id, "sectionName", event.target.value)
                    }
                    placeholder="Untitled Section"
                    className="w-full min-w-0 border-b border-transparent bg-transparent pb-1 text-2xl font-semibold tracking-tight text-foreground outline-none transition placeholder:text-muted-foreground/50 hover:border-border focus:border-primary/50"
                />

                <button
                    type="button"
                    onClick={(event) => {
                        event.stopPropagation()
                        const name = section.sectionName?.trim() || "this section"
                        if (window.confirm(`Remove "${name}" and all its blocks?`)) {
                            onDelete(section.id)
                        }
                    }}
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-1.5 text-sm font-medium text-destructive transition hover:border-destructive hover:bg-destructive hover:text-white"
                    title="Remove section"
                    aria-label="Remove section"
                >
                    <Trash2 className="h-4 w-4" />
                    Remove section
                </button>
            </div>

            <article
                className="w-full"
            >
                <div
                    className="flex w-full flex-col gap-4"
                >
                    {tools.length === 0 ? (
                        <div className="flex flex-1 flex-col items-center justify-center rounded-lg border border-dashed border-border/70 py-12 text-center">
                            <p className="text-sm font-medium text-muted-foreground">
                                This section is empty
                            </p>
                            <p className="mt-1 max-w-xs text-xs leading-5 text-muted-foreground/80">
                                Pick a block from the Elements panel to add content.
                            </p>
                        </div>
                    ) : null}

                    {tools.map((item, toolIndex) => {
                        const ToolComponent = TOOL_COMPONENTS[item.type]

                        if (!ToolComponent) {
                            return (
                                <div
                                    key={item.id ?? toolIndex}
                                    className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive"
                                >
                                    <p className="font-medium">Unknown tool type: {item.type}</p>
                                    <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap rounded-md bg-background/70 p-2 text-xs text-destructive">
                    {JSON.stringify(item, null, 2)}
                  </pre>
                                </div>
                            )
                        }

                        return (
                            <ToolComponent
                                key={item.id ?? toolIndex}
                                data={item.data}
                                onDelete={() => handleRemovalTool(sectionIndex, toolIndex)}
                                onDataChange={(newData) =>
                                    handleToolDataChange(sectionIndex, toolIndex, newData)
                                }
                            />
                        )
                    })}
                </div>
            </article>
        </div>
    )
}

export default Section
