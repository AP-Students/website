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
import type { QuestionFormat, QuestionInput } from "@/types/questions";
import { Clock3, Eye, Info, Plus, Save, Trash2 } from "lucide-react";
import type { FRQTemplate, FRQTemplateQuestion } from "@/types/frq";
import { useMemo, useState } from "react";

type QuestionStatus = "public" | "legacy";
type InputType = "text" | "equation";
type BatchVisibility = "public" | "private";

interface GradingCriterion {
  id: string;
  description: string;
  points: number;
}

interface EditorQuestion {
  id: string;
  questionData: QuestionFormat;
  status: QuestionStatus;
  inputType: InputType;
  criteria: GradingCriterion[];
}

interface EditorFRQ {
  id: string;
  title: string;
  description: QuestionInput;
  questions: EditorQuestion[];
}

interface PracticeGradingCriterion {
  id: string;
  text: string;
  points: number;
}

interface PracticeQuestion {
  id: string;
  isVisible?: boolean;
  prompt?: QuestionInput;
  answerType?: InputType;
  gradingCriteria?: PracticeGradingCriterion[];
}

interface PracticeFrq {
  id: string;
  name: string;
  description?: QuestionInput;
  questions?: PracticeQuestion[];
}

type CompatibleFrqTemplate = FRQTemplate & {
  name?: string;
  isVisible?: boolean;
  timeLimit?: number;
  timeLimitMinutes?: number;
  frqs?: PracticeFrq[];
};

interface FRQEditorRendererProps {
  frqFound: boolean;
  frqTemplate: FRQTemplate | null;
}

const createQuestionInput = (value = ""): QuestionInput => ({
  value,
  files: [],
});

const cloneQuestionInput = (
  input: QuestionInput | undefined,
  fallbackValue = "",
): QuestionInput => ({
  value: input?.value ?? fallbackValue,
  files: input ? [...input.files] : [],
});

/**
 * Unique, immutable ID built from the current time plus a short random suffix,
 * per the FRQ system spec. The random half is what makes it collision-safe:
 * a timestamp alone repeats when several IDs are minted in the same
 * millisecond.
 */
const makeId = (prefix: string) =>
  `${prefix}-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;

/**
 * A question's point value is the sum of its grading criteria. Criteria are the
 * single source of truth so the editor can never disagree with what the grading
 * page will actually award.
 */
const getQuestionPoints = (question: EditorQuestion) =>
  question.criteria.reduce((total, criterion) => total + criterion.points, 0);

const formatPoints = (points: number) =>
  `${points} ${points === 1 ? "point" : "points"}`;

const createDescriptionQuestion = (
  description: QuestionInput,
): QuestionFormat => ({
  question: {
    value: description.value,
    files: [...description.files],
  },
  type: "frq",
  options: [],
  answers: [],
  explanation: createQuestionInput(),
  content: createQuestionInput(),
  topic: "",
});

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
  inputType: "text",
  criteria: [],
});

const createEditorQuestionFromTemplate = (
  templateQuestion: FRQTemplateQuestion,
): EditorQuestion => {
  const trimmedPrompt = templateQuestion.prompt?.trim();
  const prompt =
    trimmedPrompt && trimmedPrompt.length > 0
      ? trimmedPrompt
      : templateQuestion.title;

  return {
    id: templateQuestion.id,
    questionData: createQuestionData(createQuestionInput(prompt)),
    status: "public",
    inputType: "text",
    criteria: [],
  };
};

const createEditorQuestionFromPracticeData = (
  question: PracticeQuestion,
): EditorQuestion => ({
  id: question.id,
  questionData: createQuestionData(cloneQuestionInput(question.prompt)),
  status: question.isVisible === false ? "legacy" : "public",
  inputType: question.answerType === "equation" ? "equation" : "text",
  criteria:
    question.gradingCriteria?.map((criterion) => ({
      id: criterion.id,
      description: criterion.text,
      points: Math.max(0, criterion.points),
    })) ?? [],
});

/**
 * AP-style subquestion label: 1a, 1b, 1c. Past 26 questions it rolls over to
 * two letters (1aa, 1ab) rather than walking off the end of the alphabet into
 * punctuation, which is what a bare String.fromCharCode(97 + index) would do.
 */
const getSubquestionLabel = (frqIndex: number, questionIndex: number) => {
  let label = "";
  let remaining = questionIndex;

  do {
    label = String.fromCharCode(97 + (remaining % 26)) + label;
    remaining = Math.floor(remaining / 26) - 1;
  } while (remaining >= 0);

  return `${frqIndex + 1}${label}`;
};

const createEditorFrqFromTemplate = (template: FRQTemplate): EditorFRQ => {
  const trimmedTitle = template.title.trim();

  return {
    id: template.id ?? makeId("frq"),
    title: trimmedTitle.length > 0 ? trimmedTitle : "Untitled FRQ",
    description: createQuestionInput(template.directions ?? ""),
    questions: template.questions.map(createEditorQuestionFromTemplate),
  };
};

const createEditorFrqFromPracticeData = (frq: PracticeFrq): EditorFRQ => ({
  id: frq.id,
  title: frq.name.trim().length > 0 ? frq.name.trim() : "Untitled FRQ",
  description: cloneQuestionInput(frq.description),
  questions: frq.questions?.map(createEditorQuestionFromPracticeData) ?? [],
});

const createBlankEditorFrq = (position: number): EditorFRQ => ({
  id: makeId("frq"),
  title: `FRQ ${position}`,
  description: createQuestionInput(),
  questions: [],
});

const createEditorFrqsFromTemplate = (template: FRQTemplate): EditorFRQ[] => {
  const compatibleTemplate = template as CompatibleFrqTemplate;

  if (compatibleTemplate.frqs && compatibleTemplate.frqs.length > 0) {
    return compatibleTemplate.frqs.map(createEditorFrqFromPracticeData);
  }

  return [createEditorFrqFromTemplate(template)];
};

const getBatchName = (template: FRQTemplate | null) => {
  if (!template) {
    return "Untitled FRQ";
  }

  const compatibleTemplate = template as CompatibleFrqTemplate;
  const practiceName = compatibleTemplate.name?.trim();

  if (practiceName && practiceName.length > 0) {
    return practiceName;
  }

  const templateTitle = template.title.trim();

  return templateTitle.length > 0 ? templateTitle : "Untitled FRQ";
};

const getBatchVisibility = (template: FRQTemplate | null): BatchVisibility => {
  if (!template) {
    return "private";
  }

  const compatibleTemplate = template as CompatibleFrqTemplate;
  const isVisible =
    typeof compatibleTemplate.isVisible === "boolean"
      ? compatibleTemplate.isVisible
      : template.isPublic === true;

  return isVisible ? "public" : "private";
};

const getInitialTimeLimit = (template: FRQTemplate | null) => {
  if (!template) {
    return 90;
  }

  const compatibleTemplate = template as CompatibleFrqTemplate;
  const configuredLimit =
    compatibleTemplate.timeLimitMinutes ?? compatibleTemplate.timeLimit;

  return typeof configuredLimit === "number" &&
    Number.isFinite(configuredLimit) &&
    configuredLimit >= 1
    ? Math.floor(configuredLimit)
    : 90;
};

const FRQEditorRenderer = ({
  frqFound,
  frqTemplate,
}: FRQEditorRendererProps) => {
  const [frqs, setFrqs] = useState<EditorFRQ[]>(() =>
    frqTemplate ? createEditorFrqsFromTemplate(frqTemplate) : [],
  );
  const [currentFrqIndex, setCurrentFrqIndex] = useState(0);
  const batchName = getBatchName(frqTemplate);
  const batchVisibility = getBatchVisibility(frqTemplate);
  const [timeLimitMinutes, setTimeLimitMinutes] = useState(() =>
    getInitialTimeLimit(frqTemplate),
  );

  const goToPreviousFrq = () => {
    setCurrentFrqIndex((index) => Math.max(index - 1, 0));
  };

  const goToNextFrq = () => {
    setCurrentFrqIndex((index) => Math.min(index + 1, frqs.length - 1));
  };

  const updateCurrentFrq = (updater: (frq: EditorFRQ) => EditorFRQ) => {
    setFrqs((currentFrqs) =>
      currentFrqs.map((frq, index) =>
        index === currentFrqIndex ? updater(frq) : frq,
      ),
    );
  };

  const createFrq = () => {
    const newFrq = createBlankEditorFrq(frqs.length + 1);

    setFrqs((currentFrqs) => [...currentFrqs, newFrq]);
    setCurrentFrqIndex(frqs.length);
  };

  const deleteCurrentFrq = () => {
    if (frqs.length <= 1) {
      return;
    }

    const remainingFrqs = frqs.filter(
      (_frq, index) => index !== currentFrqIndex,
    );

    setFrqs(remainingFrqs);
    setCurrentFrqIndex(Math.min(currentFrqIndex, remainingFrqs.length - 1));
  };

  const addQuestion = () => {
    updateCurrentFrq((frq) => ({
      ...frq,
      questions: [...frq.questions, createEditorQuestion()],
    }));
  };

  const updateQuestion = (
    questionId: string,
    updater: (question: EditorQuestion) => EditorQuestion,
  ) => {
    updateCurrentFrq((frq) => ({
      ...frq,
      questions: frq.questions.map((question) =>
        question.id === questionId ? updater(question) : question,
      ),
    }));
  };

  const deleteQuestion = (questionId: string) => {
    updateCurrentFrq((frq) => ({
      ...frq,
      questions: frq.questions.filter((question) => question.id !== questionId),
    }));
  };

  const addCriterion = (questionId: string) => {
    updateQuestion(questionId, (question) => ({
      ...question,
      criteria: [
        ...question.criteria,
        {
          id: makeId("criterion"),
          description: "",
          points: 1,
        },
      ],
    }));
  };

  const updateCriterion = (
    questionId: string,
    criterionId: string,
    changes: Partial<Pick<GradingCriterion, "description" | "points">>,
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

  const currentFrq = frqs[currentFrqIndex];

  // Read through to the fields the memos actually depend on. AdvancedTextbox
  // treats its `questions[qIndex]` entry as a stable reference, so these must
  // keep their identity across unrelated re-renders instead of being rebuilt
  // fresh every time the parent renders. Both memos sit above the early returns
  // so the hooks stay unconditional.
  const currentDescription = currentFrq?.description;
  const currentQuestions = currentFrq?.questions;

  const descriptionQuestions = useMemo(
    () =>
      currentDescription ? [createDescriptionQuestion(currentDescription)] : [],
    [currentDescription],
  );

  const questionFormats = useMemo(
    () => currentQuestions?.map((question) => question.questionData) ?? [],
    [currentQuestions],
  );

  if (!frqFound || !currentFrq) {
    return <div>Failed to load FRQ.</div>;
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="fixed inset-x-0 top-0 z-50 grid h-16 grid-cols-3 items-center border-b bg-background px-5 shadow-sm">
        <div>
          <Button
            type="button"
            variant="outline"
            disabled
            title="Preview is not implemented yet"
          >
            <Eye className="mr-2 size-4" />
            Preview
          </Button>
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

        <div className="justify-self-end">
          <Button
            type="button"
            disabled
            title="Saving to Firestore is not implemented yet"
          >
            <Save className="mr-2 size-4" />
            Save Changes
          </Button>
        </div>
      </header>

      <main className="fixed inset-x-0 bottom-20 top-16 overflow-hidden bg-muted/20">
        <div className="grid h-full grid-cols-1 overflow-y-auto lg:grid-cols-2 lg:overflow-hidden">
          <section className="min-h-0 overflow-y-auto border-b p-6 lg:border-b-0 lg:border-r">
            <div className="mb-6">
              <p className="text-sm font-medium text-muted-foreground">
                FRQ {currentFrqIndex + 1} of {frqs.length}
              </p>

              <label
                htmlFor="frq-title"
                className="mt-4 block text-sm font-medium"
              >
                FRQ title
              </label>
              <Input
                id="frq-title"
                value={currentFrq.title}
                onChange={(event) =>
                  updateCurrentFrq((frq) => ({
                    ...frq,
                    title: event.target.value,
                  }))
                }
                className="mt-2 max-w-md text-base font-semibold"
              />
            </div>

            <div>
              <h1 className="text-xl font-semibold">FRQ Description</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Add the source material and directions students need for this
                FRQ.
              </p>

              <div className="mt-4">
                <AdvancedTextbox
                  key={`${currentFrq.id}-description`}
                  questions={descriptionQuestions}
                  setQuestions={(updatedQuestions) => {
                    const updatedDescription = updatedQuestions[0]?.question;

                    if (!updatedDescription) {
                      return;
                    }

                    updateCurrentFrq((frq) => ({
                      ...frq,
                      description: updatedDescription,
                    }));
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
                  {currentFrq.questions.length} questions in this FRQ
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
              key={currentFrq.id}
              type="multiple"
              defaultValue={currentFrq.questions.map((question) => question.id)}
              className="space-y-4"
            >
              {currentFrq.questions.map((question, questionIndex) => (
                <AccordionItem
                  key={question.id}
                  value={question.id}
                  className="rounded-lg border bg-background px-4 shadow-sm"
                >
                  <AccordionTrigger
                    variant="secondary"
                    className="mr-0 py-4 hover:no-underline"
                  >
                    <div className="flex flex-1 items-center justify-between pr-3">
                      <span className="flex items-center gap-2">
                        <span className="font-semibold">
                          {getSubquestionLabel(currentFrqIndex, questionIndex)}
                        </span>

                        {question.status === "legacy" && (
                          <span className="rounded bg-muted px-1.5 py-0.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                            Legacy
                          </span>
                        )}
                      </span>
                      <span className="text-sm font-normal text-muted-foreground">
                        {formatPoints(getQuestionPoints(question))}
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
                              {question.inputType === "text"
                                ? "Text"
                                : "Equation"}
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start">
                            <DropdownMenuRadioGroup
                              value={question.inputType}
                              onValueChange={(value) => {
                                if (value !== "text" && value !== "equation") {
                                  return;
                                }

                                updateQuestion(
                                  question.id,
                                  (currentQuestion) => ({
                                    ...currentQuestion,
                                    inputType: value,
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
                          grading criteria. Set its response type and status
                          above.
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
                          No grading criteria have been added.
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
        frqs={frqs}
        currentFrqIndex={currentFrqIndex}
        batchName={batchName}
        batchVisibility={batchVisibility}
        onCreateFrq={createFrq}
        onDeleteFrq={deleteCurrentFrq}
        onSelectFrq={setCurrentFrqIndex}
        onPrevious={goToPreviousFrq}
        onNext={goToNextFrq}
      />
    </div>
  );
};

export default FRQEditorRenderer;