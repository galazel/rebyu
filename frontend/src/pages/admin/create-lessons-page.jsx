import React, { useEffect, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { toast } from "sonner"
import {
  AlignLeft,
  ArrowLeft,
  BetweenHorizontalEnd,
  CheckCircle2,
  ChevronDown,
  CircleAlert,
  Code2 as CodeIcon,
  FilePlay,
  FileText,
  FlipHorizontal,
  Heading as HeadingIcon,
  Image as ImageIcon,
  Layers,
  List,
  ListCollapse,
  ListOrdered,
  Minus,
  PanelLeft,
  PanelRight,
  PanelsTopLeft,
  Plus,
  Save,
  Search,
  Table as TableIcon,
  Target,
  Trash2,
  Type,
  X
} from "@/components/icons"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import Section from "../../components/certifications/section"
import {
  getLessonComponent,
  setLessonComponent,
} from "../../services/lessonService.js"
import { saveFile as MediaFileUpload } from "../../services/fileService.js"

function getBackendErrorMessage(error, fallbackMessage) {
  const responseData = error?.response?.data

  return (
      (typeof responseData === "string" && responseData) ||
      responseData?.message ||
      error?.message ||
      fallbackMessage
  )
}

function createId() {
  return crypto.randomUUID()
}

const individualActions = [
  {
    type: "heading",
    name: "Heading",
    description: "Add a main lesson heading",
    icon: HeadingIcon,
    createData: () => ({
      text: "",
    }),
  },
  {
    type: "subheading",
    name: "Smaller Heading",
    description: "Add a supporting heading",
    icon: Type,
    createData: () => ({
      text: "",
    }),
  },
  {
    type: "description",
    name: "Description",
    description: "Add lesson text or explanation",
    icon: AlignLeft,
    createData: () => ({
      text: "",
    }),
  },
  {
    type: "unordered-list",
    name: "Bullet List",
    description: "Add unordered list items",
    icon: List,
    createData: () => ({
      items: [
        {
          id: createId(),
          text: "",
        },
      ],
    }),
  },
  {
    type: "ordered-list",
    name: "Numbered List",
    description: "Add ordered list items",
    icon: ListOrdered,
    createData: () => ({
      items: [
        {
          id: createId(),
          text: "",
        },
      ],
    }),
  },
  {
    type: "image-left-text",
    name: "Image Left + Text",
    description: "Place image beside written content",
    icon: PanelLeft,
    createData: () => ({
      file: null,
      imageKey: "",
      title: "",
      description: "",
    }),
  },
  {
    type: "image-right-text",
    name: "Text Left + Image",
    description: "Place written content beside image",
    icon: PanelRight,
    createData: () => ({
      file: null,
      imageKey: "",
      title: "",
      description: "",
    }),
  },
  {
    type: "tabs",
    name: "Tabs",
    description: "Organize content into tabs",
    icon: PanelsTopLeft,
    createData: () => ({
      items: [
        {
          id: createId(),
          label: "",
          title: "",
          description: "",
        },
      ],
    }),
  },
  {
    type: "accordion",
    name: "Accordion",
    description: "Create expandable content items",
    icon: ListCollapse,
    createData: () => ({
      items: [
        {
          id: createId(),
          title: "",
          content: "",
        },
      ],
    }),
  },
  {
    type: "flip-grid",
    name: "Flip Cards",
    description: "Create interactive review cards",
    icon: FlipHorizontal,
    createData: () => ({
      cards: [
        {
          id: createId(),
          frontTitle: "",
          backTitle: "",
          description: "",
        },
      ],
    }),
  },
  {
    type: "image",
    name: "Image",
    description: "Upload an image",
    icon: ImageIcon,
    createData: () => ({
      file: null,
      imageKey: "",
    }),
  },
  {
    type: "video",
    name: "Video",
    description: "Upload a lesson video",
    icon: FilePlay,
    createData: () => ({
      file: null,
      videoKey: "",
    }),
  },
  {
    type: "image-hotspot",
    name: "Image with Hotspots",
    description: "Pin labelled points on an image",
    icon: Target,
    createData: () => ({
      file: null,
      imageKey: "",
      hotspots: [],
    }),
  },
]

const combinedActions = [
  {
    type: "intro-image-card",
    name: "Intro Image Card",
    description: "Small heading, description, and image",
    icon: ImageIcon,
    createData: () => ({
      smallHeader: "",
      description: "",
      file: null,
      imageKey: "",
    }),
  },
  {
    type: "header-description-grid",
    name: "Header Description Grid",
    description: "Small heading, description, and grid cards",
    icon: PanelsTopLeft,
    createData: () => ({
      smallHeader: "",
      description: "",
      gridItems: [
        {
          id: createId(),
          title: "",
          description: "",
        },
      ],
    }),
  },
  {
    type: "image-feature-grid",
    name: "Image Feature Grid",
    description: "Small heading, description, image, and feature grid",
    icon: PanelLeft,
    createData: () => ({
      smallHeader: "",
      description: "",
      file: null,
      imageKey: "",
      gridItems: [
        {
          id: createId(),
          title: "",
          description: "",
        },
      ],
    }),
  },
  {
    type: "code",
    name: "Code sample",
    description: "A block of code in a monospace box with syntax colouring",
    icon: CodeIcon,
    createData: () => ({
      smallHeader: "",
      description: "",
      language: "text",
      title: "",
      code: "",
      caption: "",
    }),
  },
  {
    type: "table",
    name: "Table",
    description: "Rows and columns of real text, for tabular material",
    icon: TableIcon,
    createData: () => ({
      smallHeader: "",
      description: "",
      columns: [
        { id: createId(), label: "" },
        { id: createId(), label: "" },
      ],
      rows: [
        { id: createId(), cells: ["", ""] },
        { id: createId(), cells: ["", ""] },
      ],
      rowHeaders: true,
      caption: "",
      footer: "",
    }),
  },
  {
    type: "review-card-grid",
    name: "Review Card Grid",
    description: "Small heading, description, and review cards",
    icon: FlipHorizontal,
    createData: () => ({
      smallHeader: "",
      description: "",
      cards: [
        {
          id: createId(),
          frontTitle: "",
          backTitle: "",
          description: "",
        },
      ],
    }),
  },
  {
    type: "content-accordion-block",
    name: "Accordion Content Block",
    description: "Small heading, description, and accordion items",
    icon: ListCollapse,
    createData: () => ({
      smallHeader: "",
      description: "",
      items: [
        {
          id: createId(),
          title: "",
          content: "",
        },
      ],
    }),
  },
  {
    type: "content-tabs-block",
    name: "Tabs Content Block",
    description: "Small heading, description, and tabs",
    icon: PanelsTopLeft,
    createData: () => ({
      smallHeader: "",
      description: "",
      items: [
        {
          id: createId(),
          label: "",
          title: "",
          description: "",
        },
      ],
    }),
  },
  {
    type: "media-text-block",
    name: "Media Text Block",
    description: "Small heading, description, media, and supporting text",
    icon: FilePlay,
    createData: () => ({
      smallHeader: "",
      description: "",
      mediaType: "image",
      file: null,
      imageKey: "",
      videoKey: "",
      supportingTitle: "",
      supportingDescription: "",
      layout: "image-left",
    }),
  },
]

const actionGroups = [
  {
    label: "Individual tools",
    items: individualActions,
  },
  {
    label: "Combined tools",
    items: combinedActions,
  },
]

const actions = actionGroups.flatMap((group) => group.items)


const STATIC_MEDIA_TOOL_CONFIG = {
  image: {
    folderName: "photo",
    keyField: "imageKey",
  },
  "image-left-text": {
    folderName: "photo",
    keyField: "imageKey",
  },
  "image-right-text": {
    folderName: "photo",
    keyField: "imageKey",
  },
  video: {
    folderName: "video",
    keyField: "videoKey",
  },
  "intro-image-card": {
    folderName: "photo",
    keyField: "imageKey",
  },
  "image-feature-grid": {
    folderName: "photo",
    keyField: "imageKey",
  },
  "image-hotspot": {
    folderName: "photo",
    keyField: "imageKey",
  },
}

const MEDIA_TOOL_TYPES = new Set([
  ...Object.keys(STATIC_MEDIA_TOOL_CONFIG),
  "media-text-block",
])

function getMediaToolConfig(tool) {
  if (tool.type === "media-text-block") {
    const mediaType = tool.data?.mediaType === "video" ? "video" : "image"

    return mediaType === "video"
        ? {
          folderName: "video",
          keyField: "videoKey",
          oppositeKeyField: "imageKey",
        }
        : {
          folderName: "photo",
          keyField: "imageKey",
          oppositeKeyField: "videoKey",
        }
  }

  return STATIC_MEDIA_TOOL_CONFIG[tool.type]
}



function LessonFeedbackDialog({
                                open,
                                type = "success",
                                title,
                                description,
                                onClose,
                              }) {
  const isSuccess = type === "success"

  return (
      <Dialog
          open={open}
          onOpenChange={(nextOpen) => {
            if (!nextOpen) {
              onClose()
            }
          }}
      >
        <DialogContent className="w-[calc(100%-2rem)] max-w-md rounded-2xl p-5 sm:p-6">
          <DialogHeader>
            <div
                className={`mb-2 flex h-11 w-11 items-center justify-center rounded-xl ${
                    isSuccess
                        ? "bg-primary/10 text-primary"
                        : "bg-destructive/10 text-destructive"
                }`}
            >
              {isSuccess ? (
                  <CheckCircle2 className="h-5 w-5" />
              ) : (
                  <CircleAlert className="h-5 w-5" />
              )}
            </div>

            <DialogTitle className="pr-8 text-lg">{title}</DialogTitle>

            <DialogDescription className="leading-6">
              {description}
            </DialogDescription>
          </DialogHeader>

          <div className="flex justify-end pt-2">
            <Button type="button" onClick={onClose} className="min-w-20 rounded-lg">
              Okay
            </Button>
          </div>
        </DialogContent>
      </Dialog>
  )
}

function normalizeArrayItems(items, createDefaultItem, normalizeItem) {
  const sourceItems = Array.isArray(items) && items.length > 0 ? items : [createDefaultItem()]

  return sourceItems.map((item) => normalizeItem(item ?? {}))
}

function normalizeListItems(items) {
  return normalizeArrayItems(
      items,
      () => ({ id: createId(), text: "" }),
      (item) => ({
        id: item.id || createId(),
        text: item.text ?? "",
      })
  )
}

function normalizeGridItems(items) {
  return normalizeArrayItems(
      items,
      () => ({ id: createId(), title: "", description: "" }),
      (item) => ({
        id: item.id || createId(),
        title: item.title ?? "",
        description: item.description ?? "",
      })
  )
}

function normalizeCards(cards) {
  return normalizeArrayItems(
      cards,
      () => ({ id: createId(), frontTitle: "", backTitle: "", description: "" }),
      (card) => ({
        id: card.id || createId(),
        frontTitle: card.frontTitle ?? "",
        backTitle: card.backTitle ?? "",
        description: card.description ?? "",
      })
  )
}

function normalizeAccordionItems(items) {
  return normalizeArrayItems(
      items,
      () => ({ id: createId(), title: "", content: "" }),
      (item) => ({
        id: item.id || createId(),
        title: item.title ?? "",
        content: item.content ?? "",
      })
  )
}

function normalizeTabItems(items) {
  return normalizeArrayItems(
      items,
      () => ({ id: createId(), label: "", title: "", description: "" }),
      (item) => ({
        id: item.id || createId(),
        label: item.label ?? "",
        title: item.title ?? "",
        description: item.description ?? "",
      })
  )
}

function normalizeHotspots(hotspots) {
  if (!Array.isArray(hotspots)) {
    return []
  }

  return hotspots.map((hotspot) => ({
    id: hotspot?.id || createId(),
    x: clampPercentage(hotspot?.x),
    y: clampPercentage(hotspot?.y),
    title: hotspot?.title ?? "",
    description: hotspot?.description ?? "",
  }))
}

function clampPercentage(value) {
  const numeric = Number(value)

  if (!Number.isFinite(numeric)) {
    return 0
  }

  return Math.min(100, Math.max(0, numeric))
}

function normalizeToolData(type, data = {}, toolId, imageKeys = {}, videoKeys = {}) {
  const normalizedData = {
    ...data,
  }

  if (type === "heading" || type === "subheading" || type === "description") {
    normalizedData.text = normalizedData.text ?? ""
  }

  if (type === "unordered-list" || type === "ordered-list") {
    normalizedData.items = normalizeListItems(normalizedData.items)
  }

  if (type === "tabs" || type === "content-tabs-block") {
    normalizedData.items = normalizeTabItems(normalizedData.items)
  }

  if (type === "accordion" || type === "content-accordion-block") {
    normalizedData.items = normalizeAccordionItems(normalizedData.items)
  }

  if (type === "flip-grid" || type === "review-card-grid") {
    normalizedData.cards = normalizeCards(normalizedData.cards)
  }

  if (type === "header-description-grid" || type === "image-feature-grid") {
    normalizedData.gridItems = normalizeGridItems(normalizedData.gridItems)
  }

  if (type === "table") {
    normalizedData.columns = (
        Array.isArray(normalizedData.columns) ? normalizedData.columns : []
    ).map((column) => ({
      id: column?.id ?? createId(),
      label: column?.label ?? "",
    }))

    const width = normalizedData.columns.length
    normalizedData.rows = (
        Array.isArray(normalizedData.rows) ? normalizedData.rows : []
    ).map((row) => {
      const cells = Array.isArray(row?.cells) ? row.cells : []
      return {
        id: row?.id ?? createId(),
        cells: Array.from({ length: width }, (_unused, index) => cells[index] ?? ""),
      }
    })

    normalizedData.rowHeaders = normalizedData.rowHeaders !== false
    normalizedData.caption = normalizedData.caption ?? ""
    normalizedData.footer = normalizedData.footer ?? ""
  }

  if (
      type === "intro-image-card" ||
      type === "header-description-grid" ||
      type === "image-feature-grid" ||
      type === "review-card-grid" ||
      type === "content-accordion-block" ||
      type === "content-tabs-block" ||
      type === "media-text-block" ||
      type === "table" ||
      type === "code"
  ) {
    normalizedData.smallHeader = normalizedData.smallHeader ?? ""
    normalizedData.description = normalizedData.description ?? ""
  }

  if (type === "image-left-text" || type === "image-right-text") {
    normalizedData.title = normalizedData.title ?? ""
    normalizedData.description = normalizedData.description ?? ""
  }

  if (type === "media-text-block") {
    normalizedData.mediaType = normalizedData.mediaType === "video" ? "video" : "image"
    normalizedData.supportingTitle = normalizedData.supportingTitle ?? ""
    normalizedData.supportingDescription = normalizedData.supportingDescription ?? ""
    normalizedData.layout =
        normalizedData.layout === "image-right" ? "image-right" : "image-left"
  }

  if (type === "image-hotspot") {
    normalizedData.hotspots = normalizeHotspots(normalizedData.hotspots)
  }

  if (MEDIA_TOOL_TYPES.has(type)) {
    normalizedData.file = null
  }

  if (
      type === "image" ||
      type === "image-left-text" ||
      type === "image-right-text" ||
      type === "intro-image-card" ||
      type === "image-feature-grid" ||
      type === "image-hotspot" ||
      type === "media-text-block"
  ) {
    normalizedData.imageKey = imageKeys[toolId] ?? normalizedData.imageKey ?? ""
  }

  if (type === "video" || type === "media-text-block") {
    normalizedData.videoKey = videoKeys[toolId] ?? normalizedData.videoKey ?? ""
  }

  return normalizedData
}

function isBrowserFile(value) {
  return typeof File !== "undefined" && value instanceof File
}

function removeBrowserFiles(value) {
  if (isBrowserFile(value)) {
    return null
  }

  if (Array.isArray(value)) {
    return value.map((item) => removeBrowserFiles(item))
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
        Object.entries(value).map(([key, item]) => [key, removeBrowserFiles(item)])
    )
  }

  return value
}

function CreateLessons() {
  const navigate = useNavigate()
  const location = useLocation()

  const state = location.state ?? {}

  const lessonName = state.lessonName ?? "Untitled Lesson"
  const lessonId = state.lessonId ?? 0

  const [sections, setSections] = useState([])
  const [sectionIndex, setSectionIndex] = useState(0)

  const [isSuccessDialogOpen, setIsSuccessDialogOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isLoadingLesson, setIsLoadingLesson] = useState(true)

  const [isErrorAddingToolWithoutSection, setIsErrorAddingToolWithoutSection] =
      useState(false)

  const [validationError, setValidationError] = useState("")
  const [panelTab, setPanelTab] = useState("elements")
  const [blockSearch, setBlockSearch] = useState("")
  const [zoom, setZoom] = useState(100)

  function normalizeSections(savedSections, imageKeys = {}, videoKeys = {}) {
    if (!Array.isArray(savedSections)) {
      return []
    }

    return savedSections.map((section) => ({
      id: section.id || createId(),
      sectionName: section.sectionName ?? "",
      content: Array.isArray(section.content)
          ? section.content.map((tool) => {
            const toolId = tool.id || createId()
            const toolType = tool.type ?? ""

            return {
              id: toolId,
              type: toolType,
              data: normalizeToolData(
                  toolType,
                  tool.data ?? {},
                  toolId,
                  imageKeys,
                  videoKeys
              ),
            }
          })
          : [],
    }))
  }

  function withoutEmptySections(parsedSections) {
    return parsedSections.filter(
        (section) => (section.content ?? []).length > 0
    )
  }

  function parseLessonComponent(response) {
    const responseData = response?.data ?? response ?? {}

    const structure = responseData.lessonComponentStructure ?? "[]"
    const imageKeys = responseData.imageKeys ?? {}
    const videoKeys = responseData.videoKeys ?? {}

    if (Array.isArray(structure)) {
      return withoutEmptySections(normalizeSections(structure, imageKeys, videoKeys))
    }

    if (typeof structure !== "string" || structure.trim().length === 0) {
      return []
    }

    try {
      const parsedStructure = JSON.parse(structure)

      return withoutEmptySections(
          normalizeSections(parsedStructure, imageKeys, videoKeys)
      )
    } catch (error) {
      toast.error("Could not read saved lesson", {
        description:
            error?.message || "The saved lesson component JSON is invalid.",
      })

      return []
    }
  }

  useEffect(() => {
    let isMounted = true

    async function loadSavedLesson() {
      if (!lessonId) {
        if (isMounted) {
          setSections([])
          setIsLoadingLesson(false)
        }

        return
      }

      try {
        setIsLoadingLesson(true)

        const response = await getLessonComponent(lessonId)
        const savedSections = parseLessonComponent(response)

        if (!isMounted) {
          return
        }

        setSections(savedSections)
        setSectionIndex(0)
      } catch (error) {
        if (isMounted) {
          setSections([])

          const errorMessage = "Could not load the saved lesson content."

          setValidationError(errorMessage)

          toast.error("Could not load lesson", {
            description: error?.message || errorMessage,
          })
        }
      } finally {
        if (isMounted) {
          setIsLoadingLesson(false)
        }
      }
    }

    loadSavedLesson()

    return () => {
      isMounted = false
    }
  }, [lessonId])

  function handleCancel() {
    navigate(-1)
  }

  function handleAddSection() {
    const newSection = {
      id: createId(),
      sectionName: "",
      content: [],
    }

    setSections((previousSections) => {
      setSectionIndex(previousSections.length)

      return [...previousSections, newSection]
    })
  }

  function handleSectionChange(sectionId, field, value) {
    setSections((previousSections) =>
        previousSections.map((section) =>
            section.id === sectionId
                ? {
                  ...section,
                  [field]: value,
                }
                : section
        )
    )
  }

  function handleDeleteSection(sectionId) {
    setSections((previousSections) => {
      const updatedSections = previousSections.filter(
          (section) => section.id !== sectionId
      )

      setSectionIndex(
          updatedSections.length === 0
              ? 0
              : Math.min(sectionIndex, updatedSections.length - 1)
      )

      return updatedSections
    })
  }

  function handleAddTool(toolType, targetIndex) {
    const selectedTool = actions.find((action) => action.type === toolType)

    if (!selectedTool) {
      return
    }

    const resolvedIndex = targetIndex ?? sectionIndex

    if (!sections[resolvedIndex]) {
      setIsErrorAddingToolWithoutSection(true)
      return
    }

    const newTool = {
      id: createId(),
      type: selectedTool.type,
      data: selectedTool.createData(),
    }

    setSections((previousSections) =>
        previousSections.map((section, currentSectionIndex) => {
          if (currentSectionIndex !== resolvedIndex) {
            return section
          }

          return {
            ...section,
            content: [...section.content, newTool],
          }
        })
    )
  }

  function handleRemoveTool(targetSectionIndex, targetToolIndex) {
    setSections((previousSections) =>
        previousSections.map((section, currentSectionIndex) => {
          if (currentSectionIndex !== targetSectionIndex) {
            return section
          }

          return {
            ...section,
            content: section.content.filter(
                (_, currentToolIndex) => currentToolIndex !== targetToolIndex
            ),
          }
        })
    )
  }

  function handleToolDataChange(targetSectionIndex, targetToolIndex, newData) {
    setSections((previousSections) =>
        previousSections.map((section, currentSectionIndex) => {
          if (currentSectionIndex !== targetSectionIndex) {
            return section
          }

          return {
            ...section,
            content: section.content.map((tool, currentToolIndex) => {
              if (currentToolIndex !== targetToolIndex) {
                return tool
              }

              return {
                ...tool,
                data: newData,
              }
            }),
          }
        })
    )
  }

  function isBlank(value) {
    return typeof value !== "string" || value.trim().length === 0
  }

  function hasMediaFileOrKey(data, keyField) {
    return Boolean(data.file || !isBlank(data[keyField]))
  }

  function validateGridItems(data, toolLabel) {
    if (!Array.isArray(data.gridItems) || data.gridItems.length === 0) {
      return `${toolLabel}: add at least one grid item.`
    }

    const hasInvalidGridItem = data.gridItems.some(
        (item) => isBlank(item.title) || isBlank(item.description)
    )

    if (hasInvalidGridItem) {
      return `${toolLabel}: every grid item needs a title and description.`
    }

    return null
  }

  function validateCards(data, toolLabel) {
    if (!Array.isArray(data.cards) || data.cards.length === 0) {
      return `${toolLabel}: add at least one review card.`
    }

    const hasInvalidCard = data.cards.some((card) => isBlank(card.frontTitle))

    if (hasInvalidCard) {
      return `${toolLabel}: every review card needs front text.`
    }

    return null
  }

  function validateAccordionItems(data, toolLabel) {
    if (!Array.isArray(data.items) || data.items.length === 0) {
      return `${toolLabel}: add at least one accordion item.`
    }

    const hasInvalidItem = data.items.some(
        (item) => isBlank(item.title) || isBlank(item.content)
    )

    if (hasInvalidItem) {
      return `${toolLabel}: every accordion item needs a title and content.`
    }

    return null
  }

  function validateTabItems(data, toolLabel) {
    if (!Array.isArray(data.items) || data.items.length === 0) {
      return `${toolLabel}: add at least one tab.`
    }

    const hasInvalidTab = data.items.some(
        (item) => isBlank(item.label) && isBlank(item.title)
    )

    if (hasInvalidTab) {
      return `${toolLabel}: every tab needs a label or a title.`
    }

    return null
  }


  function validateTool(tool, sectionNumber, toolNumber) {
    const data = tool.data ?? {}
    const toolLabel = `Section ${sectionNumber}, tool ${toolNumber}`

    if (tool.type === "heading" || tool.type === "subheading") {
      if (isBlank(data.text)) {
        return `${toolLabel}: heading text is required.`
      }
    }

    if (tool.type === "description") {
      if (isBlank(data.text)) {
        return `${toolLabel}: description text is required.`
      }
    }

    if (tool.type === "unordered-list" || tool.type === "ordered-list") {
      if (!Array.isArray(data.items) || data.items.length === 0) {
        return `${toolLabel}: add at least one list item.`
      }

      const hasEmptyItem = data.items.some((item) => isBlank(item.text))

      if (hasEmptyItem) {
        return `${toolLabel}: all list items must have text.`
      }
    }

    if (tool.type === "tabs") {
      const error = validateTabItems(data, toolLabel)

      if (error) {
        return error
      }
    }

    if (tool.type === "accordion") {
      const error = validateAccordionItems(data, toolLabel)

      if (error) {
        return error
      }
    }

    if (tool.type === "flip-grid") {
      const error = validateCards(data, toolLabel)

      if (error) {
        return error
      }
    }

    if (tool.type === "image") {
      if (!hasMediaFileOrKey(data, "imageKey")) {
        return `${toolLabel}: upload an image first.`
      }
    }

    if (tool.type === "video") {
      if (!hasMediaFileOrKey(data, "videoKey")) {
        return `${toolLabel}: upload a video first.`
      }
    }

    if (tool.type === "image-hotspot") {
      if (!hasMediaFileOrKey(data, "imageKey")) {
        return `${toolLabel}: upload an image first.`
      }

      const hotspots = Array.isArray(data.hotspots) ? data.hotspots : []

      if (hotspots.length === 0) {
        return `${toolLabel}: click the image to place at least one hotspot.`
      }

      const untitledIndex = hotspots.findIndex((hotspot) => isBlank(hotspot?.title))

      if (untitledIndex !== -1) {
        return `${toolLabel}: hotspot ${untitledIndex + 1} needs a title.`
      }
    }

    if (tool.type === "image-left-text" || tool.type === "image-right-text") {
      if (!hasMediaFileOrKey(data, "imageKey")) {
        return `${toolLabel}: upload an image first.`
      }

      if (isBlank(data.title)) {
        return `${toolLabel}: image text title is required.`
      }

      if (isBlank(data.description)) {
        return `${toolLabel}: image text description is required.`
      }
    }

    if (tool.type === "intro-image-card") {
      if (!hasMediaFileOrKey(data, "imageKey")) {
        return `${toolLabel}: upload an image first.`
      }
    }

    if (tool.type === "header-description-grid") {
      const gridError = validateGridItems(data, toolLabel)

      return gridError
    }

    if (tool.type === "image-feature-grid") {
      const gridError = validateGridItems(data, toolLabel)

      if (gridError) {
        return gridError
      }

      if (!hasMediaFileOrKey(data, "imageKey")) {
        return `${toolLabel}: upload an image first.`
      }
    }

    if (tool.type === "code") {
      if (!(data.code ?? "").trim()) {
        return `${toolLabel}: paste the code.`
      }
    }

    if (tool.type === "table") {
      const columns = data.columns ?? []
      const rows = data.rows ?? []

      if (columns.length === 0 || rows.length === 0) {
        return `${toolLabel}: add at least one column and one row.`
      }
      if (columns.some((column) => !(column.label ?? "").trim())) {
        return `${toolLabel}: every column needs a heading.`
      }
      if (rows.some((row) => (row.cells ?? []).every((cell) => !(cell ?? "").trim()))) {
        return `${toolLabel}: every row needs at least one filled cell.`
      }

      return null
    }

    if (tool.type === "review-card-grid") {
      const cardError = validateCards(data, toolLabel)

      return cardError
    }

    if (tool.type === "content-accordion-block") {
      const accordionError = validateAccordionItems(data, toolLabel)

      return accordionError
    }

    if (tool.type === "content-tabs-block") {
      const tabError = validateTabItems(data, toolLabel)

      return tabError
    }

    if (tool.type === "media-text-block") {

      if (data.mediaType !== "image" && data.mediaType !== "video") {
        return `${toolLabel}: media type is required.`
      }

      if (data.layout !== "image-left" && data.layout !== "image-right") {
        return `${toolLabel}: media layout is required.`
      }

      if (isBlank(data.supportingTitle)) {
        return `${toolLabel}: supporting title is required.`
      }

      if (isBlank(data.supportingDescription)) {
        return `${toolLabel}: supporting description is required.`
      }

      if (data.mediaType === "image" && !hasMediaFileOrKey(data, "imageKey")) {
        return `${toolLabel}: upload an image first.`
      }

      if (data.mediaType === "video" && !hasMediaFileOrKey(data, "videoKey")) {
        return `${toolLabel}: upload a video first.`
      }
    }

    return null
  }

  function validateLesson() {
    if (isBlank(lessonName) || lessonName === "Untitled Lesson") {
      return "Lesson name is required."
    }

    if (sections.length === 0) {
      return "Add at least one section before saving."
    }

    for (
        let currentSectionIndex = 0;
        currentSectionIndex < sections.length;
        currentSectionIndex++
    ) {
      const section = sections[currentSectionIndex]
      const sectionNumber = currentSectionIndex + 1

      if (isBlank(section.sectionName)) {
        return `Section ${sectionNumber} needs a section name.`
      }

      if (!section.content || section.content.length === 0) {
        return `Section ${sectionNumber} needs at least one tool.`
      }

      for (
          let currentToolIndex = 0;
          currentToolIndex < section.content.length;
          currentToolIndex++
      ) {
        const tool = section.content[currentToolIndex]

        const toolError = validateTool(tool, sectionNumber, currentToolIndex + 1)

        if (toolError) {
          return toolError
        }
      }
    }

    return null
  }

  function getUploadedFileKey(uploadResponse) {
    const responseData = uploadResponse?.data ?? uploadResponse

    if (typeof responseData === "string") {
      return responseData.trim().replace(/^"/, "").replace(/"$/, "")
    }

    return (
        responseData?.fileKey ??
        responseData?.key ??
        responseData?.imageKey ??
        responseData?.videoKey ??
        ""
    )
  }

  async function uploadToolMedia(tool, sectionName) {
    const mediaConfig = getMediaToolConfig(tool)

    const currentData = {
      ...(tool.data ?? {}),
    }

    if (!mediaConfig) {
      return {
        ...tool,
        data: removeBrowserFiles(currentData),
      }
    }

    const selectedFile = currentData.file

    if (!isBrowserFile(selectedFile)) {
      return {
        ...tool,
        data: removeBrowserFiles({
          ...currentData,
          file: null,
          [mediaConfig.keyField]: currentData[mediaConfig.keyField] ?? "",
        }),
      }
    }

    const uploadResponse = await MediaFileUpload(
        lessonId,
        sectionName,
        tool.id,
        mediaConfig.folderName,
        selectedFile
    )

    const uploadedFileKey = getUploadedFileKey(uploadResponse)

    if (!uploadedFileKey) {
      throw new Error(`No file key was returned while uploading ${tool.type}.`)
    }

    return {
      ...tool,
      data: removeBrowserFiles({
        ...currentData,
        file: null,
        [mediaConfig.keyField]: uploadedFileKey,
        ...(mediaConfig.oppositeKeyField
            ? {
              [mediaConfig.oppositeKeyField]: "",
            }
            : {}),
      }),
    }
  }

  async function buildSavedLessonStructure(sourceSections = sections) {
    return Promise.all(
        sourceSections.map(async (section) => {
          const savedTools = await Promise.all(
              section.content.map((tool) => uploadToolMedia(tool, section.sectionName))
          )

          return removeBrowserFiles({
            ...section,
            id: section.id || createId(),
            sectionName: section.sectionName ?? "",
            content: savedTools,
          })
        })
    )
  }

  async function handleSaveLesson() {
    if (isLoadingLesson) {
      return
    }

    const error = validateLesson()

    if (error) {
      setValidationError(error)
      return
    }

    try {
      setIsSaving(true)

      const savedLessonStructure = await buildSavedLessonStructure()

      await setLessonComponent(lessonId, savedLessonStructure)

      setSections(savedLessonStructure)
      setIsSuccessDialogOpen(true)

      toast.success("Lesson saved", {
        description: `${lessonName} was saved successfully.`,
      })
    } catch (error) {
      const errorMessage = "Could not save the lesson. Please try again."

      setValidationError(errorMessage)

      toast.error("Could not save lesson", {
        description: error?.message || errorMessage,
      })
    } finally {
      setIsSaving(false)
    }
  }

  const totalBlocks = sections.reduce(
      (count, section) => count + (section.content?.length ?? 0),
      0
  )
  const normalizedSearch = blockSearch.trim().toLowerCase()

  function selectSection(index) {
    setSectionIndex(index)
    const target = sections[index]
    if (target) {
      document
          .getElementById(`lesson-section-${target.id}`)
          ?.scrollIntoView({ behavior: "smooth", block: "start" })
    }
  }

  function insertBlock(toolType) {
    handleAddTool(toolType, sectionIndex)
  }

  function changeZoom(delta) {
    setZoom((current) => Math.min(150, Math.max(50, current + delta)))
  }

  return (
      <section className="relative flex h-full max-h-full min-h-0 w-full min-w-0 flex-col overflow-hidden bg-background">
        <header className="flex shrink-0 items-center justify-between gap-3 border-b bg-background px-3 py-2 sm:px-4">
          <div className="flex min-w-0 items-center gap-2">
            <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={handleCancel}
                aria-label="Back"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>

            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <FileText className="h-4 w-4" />
            </div>

            <div className="min-w-0">
              <h1 className="truncate text-base font-semibold leading-tight tracking-tight">
                {lessonName}
              </h1>
              <p className="text-xs text-muted-foreground">Lesson editor</p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                className="hidden sm:inline-flex"
            >
              Cancel
            </Button>

            <Button
                type="button"
                onClick={handleSaveLesson}
                disabled={isSaving || isLoadingLesson}
                className="gap-2"
            >
              <Save className="h-4 w-4" />
              {isLoadingLesson ? "Loading..." : isSaving ? "Saving..." : "Save"}
            </Button>
          </div>
        </header>

        <LessonFeedbackDialog
            open={isSuccessDialogOpen}
            type="success"
            title="Lesson Saved"
            description={`${lessonName} was saved successfully.`}
            onClose={() => setIsSuccessDialogOpen(false)}
        />

        <LessonFeedbackDialog
            open={Boolean(validationError)}
            type="error"
            title="Cannot Save Lesson"
            description={validationError}
            onClose={() => setValidationError("")}
        />

        <LessonFeedbackDialog
            open={isErrorAddingToolWithoutSection}
            type="error"
            title="Create a Section First"
            description="Add a section before adding lesson content."
            onClose={() => setIsErrorAddingToolWithoutSection(false)}
        />

        <div className="flex min-h-0 flex-1">
          {/* Canva-style side panel */}
          <aside className="hidden w-72 shrink-0 flex-col border-r bg-background md:flex">
            <div className="flex shrink-0 gap-1 border-b p-2">
              {[
                { key: "elements", label: "Elements", icon: Layers },
                { key: "outline", label: "Outline", icon: List },
              ].map((tab) => {
                const Icon = tab.icon
                const isActive = panelTab === tab.key
                return (
                    <button
                        key={tab.key}
                        type="button"
                        onClick={() => setPanelTab(tab.key)}
                        className={`flex flex-1 items-center justify-center gap-2 rounded-md py-2 text-sm font-medium transition ${
                            isActive
                                ? "bg-primary/10 text-primary"
                                : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        }`}
                    >
                      <Icon className="h-4 w-4" />
                      {tab.label}
                    </button>
                )
              })}
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-3">
              {panelTab === "elements" ? (
                  <>
                    <div className="relative mb-3">
                      <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <input
                          value={blockSearch}
                          onChange={(event) => setBlockSearch(event.target.value)}
                          placeholder="Search blocks"
                          className="h-9 w-full rounded-md border bg-background pl-8 pr-8 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                      />
                      {blockSearch && (
                          <button
                              type="button"
                              onClick={() => setBlockSearch("")}
                              aria-label="Clear search"
                              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                      )}
                    </div>

                    <p className="mb-3 text-xs text-muted-foreground">
                      {sections[sectionIndex]
                          ? `Adding to: ${sections[sectionIndex].sectionName || `Section ${sectionIndex + 1}`}`
                          : "Create a section to start adding blocks."}
                    </p>

                    {actionGroups.map((group) => {
                      const items = group.items.filter(
                          (action) =>
                              !normalizedSearch ||
                              action.name.toLowerCase().includes(normalizedSearch) ||
                              action.description.toLowerCase().includes(normalizedSearch)
                      )
                      if (items.length === 0) return null
                      return (
                          <div key={group.label} className="mb-4">
                            <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                              {group.label}
                            </p>
                            <div className="grid grid-cols-2 gap-2">
                              {items.map((action) => {
                                const Icon = action.icon
                                return (
                                    <button
                                        key={action.type}
                                        type="button"
                                        title={action.description}
                                        disabled={isLoadingLesson}
                                        onClick={() => insertBlock(action.type)}
                                        className="group flex flex-col items-center gap-2 rounded-lg border bg-muted/30 px-2 py-3 text-center transition hover:-translate-y-0.5 hover:border-primary/40 hover:bg-primary/5 hover:shadow-sm disabled:opacity-40"
                                    >
                                      <span className="flex h-9 w-9 items-center justify-center rounded-md bg-background text-muted-foreground shadow-sm group-hover:text-primary">
                                        <Icon className="h-4 w-4" />
                                      </span>
                                      <span className="text-xs font-medium leading-tight">
                                        {action.name}
                                      </span>
                                    </button>
                                )
                              })}
                            </div>
                          </div>
                      )
                    })}
                  </>
              ) : (
                  <div className="space-y-1">
                    {sections.map((section, index) => (
                        <button
                            key={section.id}
                            type="button"
                            onClick={() => selectSection(index)}
                            className={`flex w-full items-center gap-3 rounded-md px-2 py-2 text-left text-sm transition ${
                                index === sectionIndex
                                    ? "bg-primary/10 text-primary"
                                    : "hover:bg-muted"
                            }`}
                        >
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-background text-xs font-semibold ring-1 ring-border">
                            {index + 1}
                          </span>
                          <span className="min-w-0 flex-1 truncate">
                            {section.sectionName || "Untitled section"}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {section.content.length}
                          </span>
                        </button>
                    ))}

                    <Button
                        type="button"
                        variant="outline"
                        onClick={handleAddSection}
                        disabled={isLoadingLesson}
                        className="mt-2 w-full gap-2 border-dashed"
                    >
                      <Plus className="h-4 w-4" />
                      Add section
                    </Button>
                  </div>
              )}
            </div>
          </aside>

          {/* Page canvas */}
          <main className="min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-contain bg-muted/60">
            <div
                className="mx-auto w-full max-w-[860px] px-3 py-6 sm:px-8 sm:py-12"
                style={{ zoom: zoom / 100 }}
            >
              {isLoadingLesson ? (
                  <Card className="shadow-md">
                    <CardContent className="flex min-h-[460px] flex-col items-center justify-center px-6 text-center">
                      <div className="h-10 w-10 animate-spin rounded-full border-4 border-muted border-t-primary" />
                      <h3 className="mt-5 text-base font-semibold">
                        Loading lesson content
                      </h3>
                      <p className="mt-2 text-sm text-muted-foreground">
                        Loading sections, blocks, images, and videos.
                      </p>
                    </CardContent>
                  </Card>
              ) : sections.length === 0 ? (
                  <Card className="shadow-md">
                    <CardContent className="flex min-h-[560px] flex-col items-center justify-center px-6 text-center">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                        <BetweenHorizontalEnd className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <h3 className="mt-4 text-base font-semibold">Blank page</h3>
                      <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
                        Add your first section, then pick blocks from
                        the Elements panel.
                      </p>
                      <Button
                          type="button"
                          onClick={handleAddSection}
                          className="mt-5 gap-2"
                      >
                        <Plus className="h-4 w-4" />
                        Add first section
                      </Button>
                    </CardContent>
                  </Card>
              ) : (
                  <div className="space-y-8">
                    {sections.map((section, index) => {
                      const isSelected = sectionIndex === index

                      return (
                          <div
                              key={section.id}
                              id={`lesson-section-${section.id}`}
                              className={`scroll-mt-6 rounded-sm bg-background px-5 py-8 shadow-[0_1px_3px_rgba(0,0,0,0.08),0_8px_24px_rgba(0,0,0,0.06)] transition sm:px-16 sm:py-14 ${
                                  isSelected
                                      ? "ring-2 ring-primary/30"
                                      : "ring-1 ring-transparent hover:ring-border"
                              }`}
                              onMouseDown={() => setSectionIndex(index)}
                              onFocusCapture={() => setSectionIndex(index)}
                          >
                            <Section
                                section={section}
                                sectionIndex={index}
                                onChange={handleSectionChange}
                                onDelete={handleDeleteSection}
                                handleRemovalTool={handleRemoveTool}
                                handleToolDataChange={handleToolDataChange}
                                onClick={() => setSectionIndex(index)}
                            />
                          </div>
                      )
                    })}

                    <Button
                        type="button"
                        variant="outline"
                        onClick={handleAddSection}
                        className="h-12 w-full border-dashed bg-background/60 text-muted-foreground hover:text-foreground"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add another section
                    </Button>
                  </div>
              )}
            </div>
          </main>
        </div>

        {/* Word-style status bar */}
        <footer className="flex shrink-0 items-center justify-between gap-3 border-t bg-muted/40 px-3 py-1 text-xs text-muted-foreground">
          <span>
            {sections.length > 0
                ? `Section ${sectionIndex + 1} of ${sections.length}`
                : "No sections"}
            {` · ${totalBlocks} block${totalBlocks === 1 ? "" : "s"}`}
          </span>
          <div className="flex items-center gap-1">
            <button
                type="button"
                onClick={() => changeZoom(-10)}
                aria-label="Zoom out"
                className="rounded p-1 hover:bg-background hover:text-foreground"
            >
              <Minus className="h-3.5 w-3.5" />
            </button>
            <input
                type="range"
                min={50}
                max={150}
                step={10}
                value={zoom}
                onChange={(event) => setZoom(Number(event.target.value))}
                aria-label="Zoom"
                className="w-24 accent-primary"
            />
            <button
                type="button"
                onClick={() => changeZoom(10)}
                aria-label="Zoom in"
                className="rounded p-1 hover:bg-background hover:text-foreground"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
            <button
                type="button"
                onClick={() => setZoom(100)}
                className="w-10 rounded px-1 text-right tabular-nums hover:text-foreground"
            >
              {zoom}%
            </button>
          </div>
        </footer>
      </section>
  )
}

export default CreateLessons
