import { useEffect, useRef, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { Check, NotebookPenIcon, Plus, StickyNote, Trash2 } from "@/components/icons"
import { Button } from "@/components/ui/button"
import { BentoSkeleton, BentoTile } from "@/components/commons/bento.jsx"
import {
  STUDY_DESK_NOTES_KEY,
  addNote,
  clearNotes,
  deleteNote,
  getNotes,
  updateNote,
} from "@/services/studyDeskService.js"

const RULED_PAPER =
  "bg-[length:100%_28px] bg-[linear-gradient(to_bottom,transparent_27px,rgba(203,58,44,0.22)_27px,rgba(203,58,44,0.22)_28px)] dark:bg-[linear-gradient(to_bottom,transparent_27px,rgba(255,122,107,0.20)_27px,rgba(255,122,107,0.20)_28px)]"

export function StudyNotesTile({ certificationId }) {
  const queryClient = useQueryClient()
  const [draft, setDraft] = useState("")

  const [editingId, setEditingId] = useState(null)
  const [editDraft, setEditDraft] = useState("")

  const composerRef = useRef(null)

  const pendingId = useRef(0)

  const notesKey = [STUDY_DESK_NOTES_KEY, String(certificationId ?? "")]

  const notesQuery = useQuery({
    queryKey: notesKey,
    queryFn: () => getNotes(certificationId),
    enabled: Boolean(certificationId),
    staleTime: 30_000,
  })

  const notes = Array.isArray(notesQuery.data) ? notesQuery.data : []
  const doneCount = notes.filter((note) => note.done).length

  useEffect(() => setDraft(""), [certificationId])

  const cached = () => {
    const current = queryClient.getQueryData(notesKey)
    return Array.isArray(current) ? current : []
  }

  const optimistic = ({ message, apply, settle }) => ({
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: notesKey })
      const previous = cached()
      queryClient.setQueryData(notesKey, apply(previous, variables))
      return { previous }
    },
    onSuccess: settle
      ? (result, variables) =>
          queryClient.setQueryData(notesKey, (current) =>
            settle(Array.isArray(current) ? current : [], result, variables)
          )
      : undefined,
    onError: (error, _variables, context) => {
      if (context?.previous) queryClient.setQueryData(notesKey, context.previous)
      queryClient.invalidateQueries({ queryKey: notesKey })
      toast.error(message, {
        description: error?.response?.data?.message ?? error?.message ?? "Please try again.",
      })
    },
  })

  const addMutation = useMutation({
    mutationFn: ({ body }) => addNote(certificationId, body),
    ...optimistic({
      message: "Could not add that note",
      apply: (notes, { body, tempId }) => [
        ...notes,
        { noteId: tempId, body, done: false, pending: true },
      ],
      settle: (notes, created, { tempId }) =>
        notes.map((note) => (note.noteId === tempId ? created : note)),
    }),
  })

  const toggleMutation = useMutation({
    mutationFn: ({ noteId, done }) => updateNote(noteId, { done }),
    ...optimistic({
      message: "Could not update that note",
      apply: (notes, { noteId, done }) =>
        notes.map((note) => (note.noteId === noteId ? { ...note, done } : note)),
      settle: (notes, updated) =>
        notes.map((note) => (note.noteId === updated.noteId ? updated : note)),
    }),
  })

  const editMutation = useMutation({
    mutationFn: ({ noteId, body }) => updateNote(noteId, { body }),
    ...optimistic({
      message: "Could not save that note",
      apply: (notes, { noteId, body }) =>
        notes.map((note) => (note.noteId === noteId ? { ...note, body } : note)),
      settle: (notes, updated) =>
        notes.map((note) => (note.noteId === updated.noteId ? updated : note)),
    }),
  })

  const deleteMutation = useMutation({
    mutationFn: (noteId) => deleteNote(noteId),
    ...optimistic({
      message: "Could not delete that note",
      apply: (notes, noteId) => notes.filter((note) => note.noteId !== noteId),
    }),
  })

  const clearMutation = useMutation({
    mutationFn: (completedOnly) => clearNotes(certificationId, completedOnly),
    ...optimistic({
      message: "Could not clear your notes",
      apply: (notes, completedOnly) => (completedOnly ? notes.filter((note) => !note.done) : []),
    }),
  })

  const startEditing = (note) => {
    if (note.pending) return
    setEditingId(note.noteId)
    setEditDraft(note.body)
  }

  const commitEdit = (note) => {
    const body = editDraft.trim()
    setEditingId(null)
    if (!body || body === note.body) return
    editMutation.mutate({ noteId: note.noteId, body })
  }

  const submit = (event) => {
    event.preventDefault()
    const body = draft.trim()
    if (!body) return

    setDraft("")
    pendingId.current -= 1
    addMutation.mutate({ body, tempId: pendingId.current })
  }

  return (
    <BentoTile
      col={3}
      row={2}
      className="relative overflow-hidden border-[#e6ddcf] bg-[#fffdf9] p-0 sm:p-0 dark:border-[#332f29] dark:bg-[#1c1a17]"
    >
      <div className="relative shrink-0 px-5 pb-1.5">
        <div className="mt-2 flex flex-wrap items-end justify-between gap-x-3 gap-y-1 border-b border-[#e6ddcf] pb-2.5 dark:border-[#332f29]">
          <div className="flex min-w-0 items-center gap-2">
            <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-[#efe7d8] text-[#7a6a4f] dark:bg-[#2a251d] dark:text-[#c9b892]">
              <StickyNote className="size-4" aria-hidden="true" />
            </span>

            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase leading-tight tracking-wider text-[#8a7c62] dark:text-[#b0a184]">
                Your Checklist
              </p>

              <h2 className="truncate font-rb-display text-sm font-extrabold lowercase text-[#2f2a22] dark:text-[#eae4d8]">
                study notes
              </h2>

              <p className="mt-0.5 truncate text-[11px] font-medium text-[#7c7367] dark:text-[#a49b8d]">
                {notes.length
                  ? `${doneCount} of ${notes.length} done`
                  : "Jot down what to come back to."}
              </p>
            </div>
          </div>

          {notes.length ? (
            <div className="-mb-0.5 flex items-center gap-1">
              {doneCount > 0 ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs text-[#7c7367] hover:bg-black/5 hover:text-[#2f2a22] dark:text-[#a49b8d] dark:hover:bg-white/10 dark:hover:text-[#eae4d8]"
                  disabled={clearMutation.isPending}
                  onClick={() => clearMutation.mutate(true)}
                >
                  Clear done
                </Button>
              ) : null}

              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-[#7c7367] dark:text-[#a49b8d] hover:bg-rb-cardinal/10 hover:text-rb-cardinal"
                disabled={clearMutation.isPending}
                onClick={() => clearMutation.mutate(false)}
              >
                Clear all
              </Button>
            </div>
          ) : null}
        </div>
      </div>

      <div
        className="relative min-h-0 flex-1 overflow-y-auto"
        onClick={(event) => {
          if (event.target === event.currentTarget) composerRef.current?.focus()
        }}
      >
        <div
          className="pointer-events-none absolute inset-y-0 left-10 w-px bg-[#cb3a2c]/45 dark:bg-[#ff7a6b]/40"
          aria-hidden="true"
        />

        {notesQuery.isLoading ? (
          <BentoSkeleton rows={3} className="mt-3 px-5" />
        ) : notes.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center px-6 py-6 text-center">
            <NotebookPenIcon className="size-5 text-[#b3aa9c] dark:text-[#6f6759]" aria-hidden="true" />

            <p className="mt-2 text-sm font-semibold text-[#2f2a22] dark:text-[#eae4d8]">
              Nothing written down yet
            </p>

            <p className="mt-1 text-xs text-[#7c7367] dark:text-[#a49b8d]">
              Jot down what to come back to. Tick things off as you cover them.
            </p>
          </div>
        ) : (
          <ul
            className={`min-h-full pl-12 pr-3 ${RULED_PAPER}`}
            onClick={(event) => {
              if (event.target === event.currentTarget) composerRef.current?.focus()
            }}
          >
            {notes.map((note) => (
              <li key={note.noteId} className="group flex items-start gap-2.5">
                <input
                  type="checkbox"
                  checked={note.done}
                  disabled={note.pending}
                  onChange={(event) =>
                    toggleMutation.mutate({ noteId: note.noteId, done: event.target.checked })
                  }
                  className="my-1.5 size-4 shrink-0 cursor-pointer accent-[#cb3a2c] disabled:cursor-default disabled:opacity-40"
                  aria-label={note.body}
                />


                {editingId === note.noteId ? (
                  <input
                    autoFocus
                    value={editDraft}
                    maxLength={500}
                    onChange={(event) => setEditDraft(event.target.value)}
                    onBlur={() => commitEdit(note)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault()
                        commitEdit(note)
                      } else if (event.key === "Escape") {
                        event.preventDefault()
                        setEditingId(null)
                      }
                    }}
                    aria-label={`Edit note: ${note.body}`}
                    className="h-7 min-w-0 flex-1 border-0 bg-transparent p-0 text-sm leading-7 text-[#2b2620] outline-none focus:ring-0 dark:text-[#eae4d8]"
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => startEditing(note)}
                    disabled={note.pending}
                    title="Click to edit"
                    className={`min-w-0 flex-1 cursor-text break-words text-left text-sm leading-7 disabled:cursor-default ${
                      note.done
                        ? "text-[#a49b8d] line-through decoration-[#cb3a2c]/70 decoration-2 dark:text-[#7d7566]"
                        : "text-[#2b2620] dark:text-[#eae4d8]"
                    }`}
                  >
                    {note.body}
                  </button>
                )}

                <button
                  type="button"
                  disabled={note.pending}
                  onClick={() => deleteMutation.mutate(note.noteId)}
                  aria-label={`Delete note: ${note.body}`}
                  className="grid size-7 shrink-0 place-items-center rounded-md p-0 text-[#a49b8d] opacity-0 transition hover:bg-rb-cardinal/10 hover:text-rb-cardinal focus-visible:opacity-100 group-hover:opacity-100 disabled:hidden"
                >
                  <Trash2 className="size-3.5" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {doneCount > 0 && doneCount === notes.length ? (
        <p className="flex shrink-0 items-center gap-1.5 px-5 py-1.5 text-xs font-semibold text-[#2f2a22] dark:text-[#eae4d8]">
          <Check className="size-3.5" aria-hidden="true" />
          Everything on this list is covered.
        </p>
      ) : null}

      <form
        onSubmit={submit}
        className="flex shrink-0 items-center gap-2 border-t border-[#e6ddcf] bg-[#fbf7ef] px-3 py-1.5 dark:border-[#332f29] dark:bg-[#221f1b]"
      >
        <NotebookPenIcon className="size-4 shrink-0 text-[#b3aa9c] dark:text-[#6f6759]" aria-hidden="true" />

        <input
          ref={composerRef}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          maxLength={500}
          placeholder="Write a note — a topic to revisit, a formula to memorize…"
          aria-label="New note"
          className="h-8 min-w-0 flex-1 border-0 bg-transparent p-0 text-sm text-[#2b2620] outline-none placeholder:text-[#b3aa9c] focus:ring-0 dark:text-[#eae4d8] dark:placeholder:text-[#6f6759]"
        />

        <Button
          type="submit"
          size="sm"
          className="h-8 shrink-0 gap-1.5"
          disabled={!draft.trim()}
        >
          <Plus className="size-4" aria-hidden="true" />
          Add
        </Button>
      </form>
    </BentoTile>
  )
}
