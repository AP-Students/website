"use client";

import { AdminEditorBackLinks } from "@/app/admin/subject/link";
import { Blocker } from "@/app/admin/subject/navigation-block";
import FRQEditorFooter from "@/components/frq/editorFooter";
import QuestionCard from "@/components/frq/editor/questionCard";
import { getEditorPartAnchorId } from "@/components/frq/editor/partCard";
import RichPromptEditor from "@/components/frq/editor/richPromptEditor";
import { Accordion } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getFrqTemplateDocRef } from "@/lib/firestore/frqRefs";
import type {
  EditorPart,
  EditorQuestion,
  EditorState,
} from "@/lib/frq/editorState";
import {
  buildInitialState,
  buildPartLocationIndex,
  buildTemplatePayload,
  canMovePartIndexed,
  createEditorPart,
  createEditorQuestion,
  deletePartById,
  formatPoints,
  getEditorTotalPoints,
  locatePart,
  movePart,
  updatePartById,
} from "@/lib/frq/editorState";
import { getPartLabel } from "@/lib/frq/template";
import type { FRQTemplate } from "@/types/frq";
import type { QuestionFormat } from "@/types/questions";
import { deleteField, serverTimestamp, updateDoc } from "firebase/firestore";
import { Clock3, Plus, Save } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

interface FRQEditorRendererProps {
  frqFound: boolean;
  frqTemplate: FRQTemplate | null;
}

type SaveState = "idle" | "saving" | "saved" | "error";

/**
 * Firestore rejects `undefined`, and omitting a key from `updateDoc` leaves
 * whatever is stored in place — so clearing a section heading has to be written
 * as an explicit delete, or the old heading outlives the edit that cleared it.
 * Deleting rather than storing `""` is also what keeps `normalizeFrqTemplate`'s
 * "absent means unconfigured" rule true of documents this editor writes.
 */
const toFirestoreUpdate = (
  payload: ReturnType<typeof buildTemplatePayload>,
) => ({
  ...payload,
  sectionLabel: payload.sectionLabel || deleteField(),
  sectionSubtitle: payload.sectionSubtitle || deleteField(),
  updatedAt: serverTimestamp(),
});

const FRQEditorRenderer = ({
  frqFound,
  frqTemplate,
}: FRQEditorRendererProps) => {
  // Lazy: useRef(buildInitialState(...)) would rebuild the state on every
  // render and throw it away, minting a wasted question id each time.
  const [initialState] = useState(() => buildInitialState(frqTemplate));

  const [title, setTitle] = useState(initialState.title);
  const [description, setDescription] = useState<QuestionFormat>(
    initialState.description,
  );
  const [sectionLabel, setSectionLabel] = useState(initialState.sectionLabel);
  const [sectionSubtitle, setSectionSubtitle] = useState(
    initialState.sectionSubtitle,
  );
  const [questions, setQuestions] = useState<EditorQuestion[]>(
    initialState.questions,
  );
  const [timeLimitMinutes, setTimeLimitMinutes] = useState(
    initialState.timeLimitMinutes,
  );
  const [isPublic, setIsPublic] = useState(initialState.isPublic);

  // Both accordions are controlled. With Radix's uncontrolled `defaultValue`
  // the open list is read once at mount, so anything added or moved afterwards
  // renders collapsed: "Add Part" would look broken, and a part moved into a
  // collapsed question would disappear from the page the moment it was moved.
  const [openQuestions, setOpenQuestions] = useState(() =>
    initialState.questions.map((question) => question.id),
  );
  const [openParts, setOpenParts] = useState(() =>
    initialState.questions.flatMap((question) =>
      question.parts.map((part) => part.id),
    ),
  );

  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedSignature, setSavedSignature] = useState(() =>
    JSON.stringify(buildTemplatePayload(initialState)),
  );

  const currentPayload = useMemo(
    () =>
      buildTemplatePayload({
        title,
        description,
        sectionLabel,
        sectionSubtitle,
        questions,
        timeLimitMinutes,
        isPublic,
      } satisfies EditorState),
    [
      title,
      description,
      sectionLabel,
      sectionSubtitle,
      questions,
      timeLimitMinutes,
      isPublic,
    ],
  );

  const hasUnsavedChanges = useMemo(
    () => JSON.stringify(currentPayload) !== savedSignature,
    [currentPayload, savedSignature],
  );

  useEffect(() => {
    if (!hasUnsavedChanges) {
      return;
    }

    const warnBeforeLeaving = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", warnBeforeLeaving);

    return () => {
      window.removeEventListener("beforeunload", warnBeforeLeaving);
    };
  }, [hasUnsavedChanges]);

  const updateQuestion = (
    questionId: string,
    updater: (question: EditorQuestion) => EditorQuestion,
  ) => {
    setQuestions((current) =>
      current.map((question) =>
        question.id === questionId ? updater(question) : question,
      ),
    );
  };

  const reveal = (setOpen: typeof setOpenQuestions, id: string) =>
    setOpen((open) => (open.includes(id) ? open : [...open, id]));

  const addQuestion = () => {
    const question = createEditorQuestion();

    setQuestions((current) => [...current, question]);
    reveal(setOpenQuestions, question.id);
  };

  const deleteQuestion = (questionId: string) => {
    setQuestions((current) =>
      current.filter((question) => question.id !== questionId),
    );
  };

  const addPart = (questionId: string) => {
    const part = createEditorPart();

    setQuestions((current) =>
      current.map((question) =>
        question.id === questionId
          ? { ...question, parts: [...question.parts, part] }
          : question,
      ),
    );
    reveal(setOpenParts, part.id);
  };

  // Part edits address the part by id, never by the question it sat in when
  // this handler was created. A part can change parent mid-edit: an upload
  // started in question 1 can resolve after the author moved that part into
  // question 2, and a question-scoped update would then match nothing and
  // silently drop the file's download URL.
  const updatePart = (
    partId: string,
    updater: (part: EditorPart) => EditorPart,
  ) => {
    setQuestions((current) => updatePartById(current, partId, updater));
  };

  const deletePart = (partId: string) => {
    setQuestions((current) => deletePartById(current, partId));
  };

  const movePartBy = (partId: string, direction: -1 | 1) => {
    // Computed outside the updater: revealing is a second state write, and
    // React invokes updaters twice in StrictMode.
    const next = movePart(questions, partId, direction);
    const landed = locatePart(next, partId);
    const questionId = landed ? next[landed.questionIndex]?.id : undefined;

    setQuestions(next);

    // Open wherever it landed, or a move into a collapsed question reads as
    // the part vanishing off the page.
    if (questionId) {
      reveal(setOpenQuestions, questionId);
      reveal(setOpenParts, partId);
    }
  };

  /** Reveal a part the footer jumped to, then scroll once it is mounted. */
  const selectPart = (partId: string) => {
    const location = locatePart(questions, partId);
    const questionId = location ? questions[location.questionIndex]?.id : null;

    if (!questionId) {
      return;
    }

    reveal(setOpenQuestions, questionId);
    reveal(setOpenParts, partId);

    requestAnimationFrame(() => {
      document
        .getElementById(getEditorPartAnchorId(partId))
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  const saveTemplate = useCallback(async () => {
    if (!frqTemplate?.id) {
      setSaveState("error");
      setSaveError("This FRQ has no document to save to.");
      return;
    }

    setSaveState("saving");
    setSaveError(null);

    try {
      await updateDoc(
        getFrqTemplateDocRef(
          frqTemplate.subject,
          frqTemplate.unitId,
          frqTemplate.id,
        ),
        toFirestoreUpdate(currentPayload),
      );

      // Re-baseline against exactly what was written, so an edit made while the
      // save was in flight still registers as unsaved.
      setSavedSignature(JSON.stringify(currentPayload));
      setSaveState("saved");
    } catch (error) {
      // The previous version swallowed this entirely, which is why a
      // permission-denied rule looked identical to a successful save.
      console.error("Error saving FRQ template:", error);

      setSaveState("error");
      setSaveError(
        error instanceof Error
          ? error.message
          : "Unknown error while saving this FRQ.",
      );
    }
  }, [currentPayload, frqTemplate]);

  const partLocationIndex = useMemo(
    () => buildPartLocationIndex(questions),
    [questions],
  );

  const totalPoints = getEditorTotalPoints(questions);
  const totalParts = questions.reduce(
    (total, question) => total + question.parts.length,
    0,
  );

  if (!frqFound || !frqTemplate) {
    return <div>Failed to load FRQ.</div>;
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Arms the confirm inside the `Link` below. Without it the back button
          would discard an unsaved edit silently, which is the whole reason the
          MCQ test editor pairs the two. */}
      {hasUnsavedChanges && <Blocker />}

      {/* Columns are sized to their content rather than split into equal
          thirds: a fixed third no longer fits the back links beside the points
          total, which truncated it to "0 points t...". */}
      <header className="fixed inset-x-0 top-0 z-50 grid h-16 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-4 border-b bg-background px-5 shadow-sm">
        <div className="flex min-w-0 items-center gap-3">
          {/* The same pair the MCQ test editor uses, from the same component:
              these confirm before discarding unsaved work. */}
          <AdminEditorBackLinks
            subjectSlug={frqTemplate.subject}
            unsavedChanges={hasUnsavedChanges}
            layout="inline"
          />

          <span className="truncate text-sm text-muted-foreground">
            {formatPoints(totalPoints)} total
          </span>
        </div>

        <div className="flex items-center justify-center gap-2">
          <Clock3 className="size-4 text-muted-foreground" />
          <label htmlFor="frq-time-limit" className="text-sm font-medium">
            Time limit
          </label>
          <Input
            id="frq-time-limit"
            type="number"
            min={1}
            value={timeLimitMinutes}
            onChange={(event) =>
              setTimeLimitMinutes(Math.max(1, Number(event.target.value) || 1))
            }
            className="h-9 w-20"
          />
          <span className="text-sm text-muted-foreground">minutes</span>
        </div>

        <div className="flex items-center justify-end gap-3">
          {saveState === "saved" && !hasUnsavedChanges && (
            <span className="text-sm text-green-700">Saved</span>
          )}

          {saveState === "error" && (
            <span
              className="max-w-64 truncate text-sm text-destructive"
              title={saveError ?? undefined}
            >
              {saveError}
            </span>
          )}

          <Button
            type="button"
            onClick={() => void saveTemplate()}
            disabled={saveState === "saving" || !hasUnsavedChanges}
            title={hasUnsavedChanges ? "Save this FRQ" : "No changes to save"}
          >
            <Save className="mr-2 size-4" />
            {saveState === "saving" ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </header>

      <main className="fixed inset-x-0 bottom-20 top-16 overflow-hidden bg-muted/20">
        <div className="grid h-full grid-cols-1 overflow-y-auto lg:grid-cols-2 lg:overflow-hidden">
          <section className="min-h-0 overflow-y-auto border-b p-6 lg:border-b-0 lg:border-r">
            <div className="mb-6">
              <label
                htmlFor="frq-title"
                className="mt-4 block text-sm font-medium"
              >
                FRQ title
              </label>
              <Input
                id="frq-title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                className="mt-2 max-w-md text-base font-semibold"
              />

              <div className="mt-4 flex items-center gap-2">
                <input
                  id="frq-visibility"
                  type="checkbox"
                  checked={isPublic}
                  onChange={(event) => setIsPublic(event.target.checked)}
                />
                <label htmlFor="frq-visibility" className="text-sm font-medium">
                  Visible to students
                </label>
              </div>
            </div>

            <div className="mb-6">
              <h2 className="text-sm font-semibold">Section heading</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Shown above the timer while students take this FRQ. Leave both
                blank to keep the standard wording.
              </p>

              <div className="mt-3 grid gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="frq-section-label"
                    className="text-sm font-medium"
                  >
                    Section label
                  </label>
                  <Input
                    id="frq-section-label"
                    value={sectionLabel}
                    onChange={(event) => setSectionLabel(event.target.value)}
                    placeholder="Section II"
                    className="mt-2"
                  />
                </div>

                <div>
                  <label
                    htmlFor="frq-section-subtitle"
                    className="text-sm font-medium"
                  >
                    Section subtitle
                  </label>
                  <Input
                    id="frq-section-subtitle"
                    value={sectionSubtitle}
                    onChange={(event) => setSectionSubtitle(event.target.value)}
                    placeholder="Free response"
                    className="mt-2"
                  />
                </div>
              </div>
            </div>

            <div>
              <h1 className="text-xl font-semibold">FRQ Description</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Directions that apply to the whole FRQ. Source material for a
                single question belongs in that question&apos;s stimulus.
              </p>

              <div className="mt-4">
                <RichPromptEditor
                  key={`${frqTemplate.id}-description`}
                  value={description}
                  onChange={setDescription}
                  placeholder="Enter the FRQ description here."
                />
              </div>
            </div>
          </section>

          <section className="min-h-0 overflow-y-auto p-6">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold">Questions</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {questions.length}{" "}
                  {questions.length === 1 ? "question" : "questions"} &middot;{" "}
                  {totalParts} {totalParts === 1 ? "part" : "parts"}
                </p>
              </div>

              <Button
                type="button"
                onClick={addQuestion}
                title="Add a question to this FRQ"
              >
                <Plus className="mr-2 size-4" />
                Add Question
              </Button>
            </div>

            <Accordion
              type="multiple"
              value={openQuestions}
              onValueChange={setOpenQuestions}
              className="space-y-4"
            >
              {questions.map((question, questionIndex) => (
                <QuestionCard
                  key={question.id}
                  question={question}
                  index={questionIndex}
                  onChange={(updater) => updateQuestion(question.id, updater)}
                  onDelete={() => deleteQuestion(question.id)}
                  onAddPart={() => addPart(question.id)}
                  onUpdatePart={updatePart}
                  onDeletePart={deletePart}
                  onMovePart={movePartBy}
                  canMovePart={(partId, direction) =>
                    canMovePartIndexed(
                      questions,
                      partLocationIndex,
                      partId,
                      direction,
                    )
                  }
                  canDelete={questions.length > 1}
                  openParts={openParts}
                  onOpenPartsChange={setOpenParts}
                />
              ))}
            </Accordion>
          </section>
        </div>
      </main>

      <FRQEditorFooter
        parts={questions.flatMap((question, questionIndex) =>
          question.parts.map((part, partIndex) => ({
            id: part.id,
            // Part labels restart at A per question, so the jump-to grid needs
            // the question number too for "1A" to be distinct from "2A".
            label: `${questionIndex + 1}${getPartLabel(partIndex)}`,
          })),
        )}
        frqName={title.trim() || "Untitled FRQ"}
        visibility={isPublic ? "public" : "private"}
        hasUnsavedChanges={hasUnsavedChanges}
        onSelectPart={selectPart}
      />
    </div>
  );
};

export default FRQEditorRenderer;
