"use client";

import AdvancedTextbox from "@/components/article-creator/custom_questions/AdvancedTextbox";
import FRQEditorFooter from "@/components/frq/editorFooter";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { getFrqTemplateDocRef } from "@/lib/firestore/frqRefs";
import {
  DEFAULT_TIME_LIMIT_MINUTES,
  getPartLabel,
  getQuestionPoints,
  toQuestionInput,
} from "@/lib/frq/template";
import type { QuestionFormat, QuestionInput } from "@/types/questions";
import { serverTimestamp, updateDoc } from "firebase/firestore";
import { Clock3, Info, Plus, Save, Trash2 } from "lucide-react";
import type {
  FRQAnswerType,
  FRQGradingCriterion,
  FRQQuestionStatus,
  FRQTemplate,
  FRQTemplateQuestion,
} from "@/types/frq";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

interface EditorQuestion {
  id: string;
  questionData: QuestionFormat;
  status: FRQQuestionStatus;
  answerType: FRQAnswerType;
  criteria: FRQGradingCriterion[];
}

interface FRQEditorRendererProps {
  frqFound: boolean;
  frqTemplate: FRQTemplate | null;
}

type SaveState = "idle" | "saving" | "saved" | "error";

const createQuestionInput = (value = ""): QuestionInput => ({
  value,
  files: [],
});

/**
 * Unique, immutable ID built from the current time plus a short random suffix.
 * The random half is what makes it collision-safe: a timestamp alone repeats
 * when several IDs are minted in the same millisecond.
 */
const makeId = (prefix: string) =>
  `${prefix}-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;

const formatPoints = (points: number) =>
  `${points} ${points === 1 ? "point" : "points"}`;

const createQuestionData = (
  question = createQuestionInput(),
): QuestionFormat => ({
  question,
  type: "frq",
  options: [],
  answers: [],
  explanation: createQuestionInput(),
  content: createQuestionInput(),
  topic: "",
});

const createEditorQuestion = (): EditorQuestion => ({
  id: makeId("question"),
  questionData: createQuestionData(),
  status: "public",
  answerType: "text",
  criteria: [],
});

const createEditorQuestionFromTemplate = (
  templateQuestion: FRQTemplateQuestion,
): EditorQuestion => ({
  id: templateQuestion.id,
  questionData: createQuestionData(
    toQuestionInput(templateQuestion.prompt, templateQuestion.promptFiles),
  ),
  status: templateQuestion.status ?? "public",
  answerType: templateQuestion.answerType ?? "text",
  criteria: templateQuestion.criteria ?? [],
});

interface EditorState {
  title: string;
  description: QuestionInput;
  questions: EditorQuestion[];
  timeLimitMinutes: number;
  isPublic: boolean;
}

const buildInitialState = (template: FRQTemplate | null): EditorState => ({
  title: template?.title ?? "",
  description: toQuestionInput(
    template?.directions,
    template?.directionsFiles,
  ),
  questions: (template?.questions ?? []).map(createEditorQuestionFromTemplate),
  timeLimitMinutes: template?.timeLimitMinutes ?? DEFAULT_TIME_LIMIT_MINUTES,
  isPublic: template?.isPublic === true,
});

/**
 * The exact document body a save writes, minus the server timestamp. Unsaved
 * state is detected by comparing this against the last persisted version rather
 * than by watching for state updates: React StrictMode double-invokes effects
 * in development, and the rich-text children re-emit equal values on mount, so
 * a "something changed" listener reported unsaved work before any edit.
 */
const buildTemplatePayload = (state: EditorState) => ({
  title: state.title.trim() || "Untitled FRQ",
  directions: state.description.value,
  directionsFiles: state.description.files,
  timeLimitMinutes: state.timeLimitMinutes,
  isPublic: state.isPublic,
  questions: state.questions.map((question, index) => ({
    id: question.id,
    title: getPartLabel(index),
    prompt: question.questionData.question.value,
    promptFiles: question.questionData.question.files,
    answerType: question.answerType,
    status: question.status,
    criteria: question.criteria,
  })),
});

const FRQEditorRenderer = ({
  frqFound,
  frqTemplate,
}: FRQEditorRendererProps) => {
  const initialState = useRef(buildInitialState(frqTemplate)).current;

  const [title, setTitle] = useState(initialState.title);
  const [description, setDescription] = useState<QuestionInput>(
    initialState.description,
  );
  const [questions, setQuestions] = useState<EditorQuestion[]>(
    initialState.questions,
  );
  const [timeLimitMinutes, setTimeLimitMinutes] = useState(
    initialState.timeLimitMinutes,
  );
  const [isPublic, setIsPublic] = useState(initialState.isPublic);

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
        questions,
        timeLimitMinutes,
        isPublic,
      }),
    [title, description, questions, timeLimitMinutes, isPublic],
  );

  const hasUnsavedChanges = JSON.stringify(currentPayload) !== savedSignature;

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
    setQuestions((currentQuestions) =>
      currentQuestions.map((question) =>
        question.id === questionId ? updater(question) : question,
      ),
    );
  };

  const addQuestion = () => {
    setQuestions((currentQuestions) => [
      ...currentQuestions,
      createEditorQuestion(),
    ]);
  };

  const deleteQuestion = (questionId: string) => {
    setQuestions((currentQuestions) =>
      currentQuestions.filter((question) => question.id !== questionId),
    );
  };

  const addCriterion = (questionId: string) => {
    updateQuestion(questionId, (question) => ({
      ...question,
      criteria: [
        ...question.criteria,
        { id: makeId("criterion"), description: "", points: 1 },
      ],
    }));
  };

  const updateCriterion = (
    questionId: string,
    criterionId: string,
    changes: Partial<Pick<FRQGradingCriterion, "description" | "points">>,
  ) => {
    updateQuestion(questionId, (question) => ({
      ...question,
      criteria: question.criteria.map((criterion) =>
        criterion.id === criterionId ? { ...criterion, ...changes } : criterion,
      ),
    }));
  };

  const deleteCriterion = (questionId: string, criterionId: string) => {
    updateQuestion(questionId, (question) => ({
      ...question,
      criteria: question.criteria.filter(
        (criterion) => criterion.id !== criterionId,
      ),
    }));
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
        { ...currentPayload, updatedAt: serverTimestamp() },
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

  // AdvancedTextbox treats its `questions[qIndex]` entry as a stable reference,
  // so these must keep identity across unrelated re-renders instead of being
  // rebuilt fresh. Both memos sit above the early return so hooks stay
  // unconditional.
  const descriptionQuestions = useMemo(
    () => [createQuestionData(description)],
    [description],
  );

  const questionFormats = useMemo(
    () => questions.map((question) => question.questionData),
    [questions],
  );

  const totalPoints = questions.reduce(
    (total, question) =>
      total +
      getQuestionPoints({
        id: question.id,
        title: "",
        criteria: question.criteria,
      }),
    0,
  );

  if (!frqFound || !frqTemplate) {
    return <div>Failed to load FRQ.</div>;
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="fixed inset-x-0 top-0 z-50 grid h-16 grid-cols-3 items-center border-b bg-background px-5 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">
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
            title={
              hasUnsavedChanges
                ? "Save this FRQ"
                : "No changes to save"
            }
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

            <div>
              <h1 className="text-xl font-semibold">FRQ Description</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Add the source material and directions students need for this
                FRQ. This is what students see beside the response box.
              </p>

              <div className="mt-4">
                <AdvancedTextbox
                  key={`${frqTemplate.id}-description`}
                  questions={descriptionQuestions}
                  setQuestions={(updatedQuestions) => {
                    const updatedDescription = updatedQuestions[0]?.question;

                    if (!updatedDescription) {
                      return;
                    }

                    setDescription(updatedDescription);
                  }}
                  origin="question"
                  qIndex={0}
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
                  {questions.length} questions in this FRQ
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
              defaultValue={questions.map((question) => question.id)}
              className="space-y-4"
            >
              {questions.map((question, questionIndex) => (
                <AccordionItem
                  key={question.id}
                  value={question.id}
                  data-frq-part={question.id}
                  className="rounded-lg border bg-background px-4 shadow-sm"
                >
                  <AccordionTrigger
                    variant="secondary"
                    className="mr-0 py-4 hover:no-underline"
                  >
                    <div className="flex flex-1 items-center justify-between pr-3">
                      <span className="flex items-center gap-2">
                        <span className="font-semibold">
                          {getPartLabel(questionIndex)}
                        </span>

                        {question.status === "legacy" && (
                          <span className="rounded bg-muted px-1.5 py-0.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                            Legacy
                          </span>
                        )}
                      </span>
                      <span className="text-sm font-normal text-muted-foreground">
                        {formatPoints(
                          getQuestionPoints({
                            id: question.id,
                            title: "",
                            criteria: question.criteria,
                          }),
                        )}
                      </span>
                    </div>
                  </AccordionTrigger>

                  {/* ui/accordion.tsx hardcodes opacity-70 on the content root
                      and routes className to an inner div, so there is no
                      class-based override. Without this the editor's inputs all
                      render washed out. Remove once accordion.tsx exposes it. */}
                  <AccordionContent
                    style={{ opacity: 1 }}
                    className="space-y-5 pb-5 text-foreground"
                  >
                    <div>
                      <label className="text-sm font-medium">
                        Question prompt
                      </label>
                      <div className="mt-2">
                        <AdvancedTextbox
                          questions={questionFormats}
                          // AdvancedTextbox hands back the whole array, but only
                          // this question's entry is ours to write. An in-flight
                          // file upload resolves against the array it captured
                          // when the upload started, so copying every index back
                          // would let a slow upload overwrite edits made to the
                          // sibling questions in the meantime.
                          setQuestions={(updatedQuestions) =>
                            updateQuestion(question.id, (currentQuestion) => ({
                              ...currentQuestion,
                              questionData:
                                updatedQuestions[questionIndex] ??
                                currentQuestion.questionData,
                            }))
                          }
                          origin="question"
                          qIndex={questionIndex}
                          placeholder="Enter the question prompt here."
                        />
                      </div>
                    </div>

                    {/* No question-level points field: the total is derived from
                        the grading criteria below, which is what the grader
                        actually awards against. */}
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="text-sm font-medium">
                          Input type
                        </label>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              type="button"
                              variant="outline"
                              className="mt-2 w-full justify-between"
                            >
                              {question.answerType === "text"
                                ? "Text"
                                : "Equation"}
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start">
                            <DropdownMenuRadioGroup
                              value={question.answerType}
                              onValueChange={(value) => {
                                if (value !== "text" && value !== "equation") {
                                  return;
                                }

                                updateQuestion(
                                  question.id,
                                  (currentQuestion) => ({
                                    ...currentQuestion,
                                    answerType: value,
                                  }),
                                );
                              }}
                            >
                              <DropdownMenuRadioItem value="text">
                                Text
                              </DropdownMenuRadioItem>
                              <DropdownMenuRadioItem value="equation">
                                Equation
                              </DropdownMenuRadioItem>
                            </DropdownMenuRadioGroup>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      <div>
                        <label className="text-sm font-medium">Status</label>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              type="button"
                              variant="outline"
                              className="mt-2 w-full justify-between"
                            >
                              {question.status === "public"
                                ? "Public"
                                : "Legacy"}
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start">
                            <DropdownMenuRadioGroup
                              value={question.status}
                              onValueChange={(value) => {
                                if (value !== "public" && value !== "legacy") {
                                  return;
                                }

                                updateQuestion(
                                  question.id,
                                  (currentQuestion) => ({
                                    ...currentQuestion,
                                    status: value,
                                  }),
                                );
                              }}
                            >
                              <DropdownMenuRadioItem value="public">
                                Public
                              </DropdownMenuRadioItem>
                              <DropdownMenuRadioItem value="legacy">
                                Legacy
                              </DropdownMenuRadioItem>
                            </DropdownMenuRadioGroup>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 border-t pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => addCriterion(question.id)}
                      >
                        <Plus className="mr-2 size-4" />
                        Add Criteria
                      </Button>

                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            type="button"
                            variant="outline"
                            aria-label="Question information"
                            className="px-3"
                          >
                            <Info className="size-4" />
                          </Button>
                        </PopoverTrigger>

                        <PopoverContent align="start" className="w-72 text-sm">
                          A question&apos;s point total is calculated from its
                          grading criteria. Graders award points against these
                          exact lines.
                        </PopoverContent>
                      </Popover>

                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => deleteQuestion(question.id)}
                        title="Delete this question"
                        className="ml-auto text-destructive"
                      >
                        <Trash2 className="mr-2 size-4" />
                        Delete Question
                      </Button>
                    </div>

                    <div className="space-y-3">
                      <h3 className="text-sm font-semibold">
                        Grading Criteria
                      </h3>

                      {question.criteria.length === 0 ? (
                        <p className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
                          No grading criteria have been added. A question with
                          no criteria is worth zero points.
                        </p>
                      ) : (
                        question.criteria.map((criterion, criterionIndex) => (
                          <div
                            key={criterion.id}
                            className="grid gap-3 rounded-md border bg-muted/20 p-4 md:grid-cols-[minmax(0,1fr)_7rem_auto]"
                          >
                            <div>
                              <label className="text-sm font-medium">
                                Criterion {criterionIndex + 1}
                              </label>
                              <Textarea
                                value={criterion.description}
                                onChange={(event) =>
                                  updateCriterion(question.id, criterion.id, {
                                    description: event.target.value,
                                  })
                                }
                                placeholder="Describe what earns these points."
                                className="mt-2 min-h-24"
                              />
                            </div>

                            <div>
                              <label className="text-sm font-medium">
                                Points
                              </label>
                              <Input
                                type="number"
                                min={0}
                                step={1}
                                value={criterion.points}
                                onChange={(event) =>
                                  updateCriterion(question.id, criterion.id, {
                                    points: Math.max(
                                      0,
                                      Number(event.target.value) || 0,
                                    ),
                                  })
                                }
                                className="mt-2"
                              />
                            </div>

                            <Button
                              type="button"
                              variant="outline"
                              onClick={() =>
                                deleteCriterion(question.id, criterion.id)
                              }
                              title="Delete criterion"
                              aria-label={`Delete criterion ${
                                criterionIndex + 1
                              }`}
                              className="mt-7 size-10 p-0 text-destructive"
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          </div>
                        ))
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </section>
        </div>
      </main>

      <FRQEditorFooter
        parts={questions.map((question, index) => ({
          id: question.id,
          label: getPartLabel(index),
        }))}
        frqName={title.trim() || "Untitled FRQ"}
        visibility={isPublic ? "public" : "private"}
        hasUnsavedChanges={hasUnsavedChanges}
      />
    </div>
  );
};

export default FRQEditorRenderer;
