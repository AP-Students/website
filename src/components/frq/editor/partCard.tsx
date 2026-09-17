"use client";

import RichPromptEditor from "@/components/frq/editor/richPromptEditor";
import {
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
import type { EditorPart } from "@/lib/frq/editorState";
import {
  createEditorCriterion,
  formatPoints,
  getEditorPartPoints,
} from "@/lib/frq/editorState";
import type { QuestionFormat } from "@/types/questions";
import { ChevronDown, ChevronUp, Info, Plus, Trash2 } from "lucide-react";

/**
 * DOM id of one part's card. The footer's jump-to-part shortcut scrolls to
 * this.
 *
 * Read back with `getElementById` rather than `querySelector`, because a part
 * id comes from Firestore and may contain characters that need escaping in a
 * CSS selector but are fine in an id lookup.
 */
export const getEditorPartAnchorId = (partId: string) =>
  `frq-editor-part-${partId}`;

interface PartCardProps {
  part: EditorPart;
  /** Display label within its question, restarting at A for each question. */
  label: string;
  onChange: (updater: (part: EditorPart) => EditorPart) => void;
  onDelete: () => void;
  onMove: (direction: -1 | 1) => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
}

const PartCard = ({
  part,
  label,
  onChange,
  onDelete,
  onMove,
  canMoveUp,
  canMoveDown,
}: PartCardProps) => {
  const addCriterion = () => {
    onChange((current) => ({
      ...current,
      criteria: [...current.criteria, createEditorCriterion()],
    }));
  };

  /**
   * Addressed by criterion id and applied through the part's own functional
   * updater, for the reason `updatePartById` is addressed by part id: a file
   * upload resolves long after it began, and the author may have added or
   * removed a rubric line in between. Routing by index would land the returned
   * download URL on whichever criterion now sits at that position.
   */
  const updateCriterion = (
    criterionId: string,
    changes: { description?: QuestionFormat; points?: number },
  ) => {
    onChange((current) => ({
      ...current,
      criteria: current.criteria.map((criterion) =>
        criterion.id === criterionId ? { ...criterion, ...changes } : criterion,
      ),
    }));
  };

  const deleteCriterion = (criterionId: string) => {
    onChange((current) => ({
      ...current,
      criteria: current.criteria.filter(
        (criterion) => criterion.id !== criterionId,
      ),
    }));
  };

  return (
    <AccordionItem
      value={part.id}
      id={getEditorPartAnchorId(part.id)}
      className="rounded-lg border bg-background px-4 shadow-sm"
    >
      <AccordionTrigger
        variant="secondary"
        className="mr-0 py-4 hover:no-underline"
      >
        <div className="flex flex-1 items-center justify-between pr-3">
          <span className="flex items-center gap-2">
            <span className="font-semibold">Part {label}</span>

            {part.status === "legacy" && (
              <span className="rounded bg-muted px-1.5 py-0.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Legacy
              </span>
            )}
          </span>
          <span className="text-sm font-normal text-muted-foreground">
            {formatPoints(getEditorPartPoints(part))}
          </span>
        </div>
      </AccordionTrigger>

      {/* ui/accordion.tsx hardcodes opacity-70 on the content root and routes
          className to an inner div, so there is no class-based override.
          Without this the editor's inputs all render washed out. Remove once
          accordion.tsx exposes it. */}
      <AccordionContent
        style={{ opacity: 1 }}
        className="space-y-5 pb-5 text-foreground"
      >
        <div>
          <label className="text-sm font-medium">Part prompt</label>
          <div className="mt-2">
            <RichPromptEditor
              value={part.prompt}
              onChange={(prompt) =>
                onChange((current) => ({ ...current, prompt }))
              }
              placeholder="Enter the prompt for this part here."
            />
          </div>
        </div>

        {/* No part-level points field: the total is derived from the grading
            criteria below, which is what the grader actually awards against. */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-sm font-medium">Input type</label>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className="mt-2 w-full justify-between"
                >
                  {part.answerType === "text" ? "Text" : "Equation"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuRadioGroup
                  value={part.answerType}
                  onValueChange={(value) => {
                    if (value !== "text" && value !== "equation") {
                      return;
                    }

                    onChange((current) => ({ ...current, answerType: value }));
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
                  {part.status === "public" ? "Public" : "Legacy"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuRadioGroup
                  value={part.status}
                  onValueChange={(value) => {
                    if (value !== "public" && value !== "legacy") {
                      return;
                    }

                    onChange((current) => ({ ...current, status: value }));
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
          <Button type="button" variant="outline" onClick={addCriterion}>
            <Plus className="mr-2 size-4" />
            Add Criteria
          </Button>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                aria-label="Part information"
                className="px-3"
              >
                <Info className="size-4" />
              </Button>
            </PopoverTrigger>

            <PopoverContent align="start" className="w-72 text-sm">
              A part&apos;s point total is calculated from its grading criteria.
              Graders award points against these exact lines. A criterion can
              carry images as well as text, so a graph or sketch question can
              show the model answer it is scored against.
            </PopoverContent>
          </Popover>

          {/* Moving past either end of a question carries the part into the
              neighbouring one, which is how an existing flat FRQ gets split
              into real questions without retyping a prompt. */}
          <Button
            type="button"
            variant="outline"
            onClick={() => onMove(-1)}
            disabled={!canMoveUp}
            aria-label={`Move part ${label} up`}
            title="Move up, into the previous question if this is the first part"
            className="px-3"
          >
            <ChevronUp className="size-4" />
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={() => onMove(1)}
            disabled={!canMoveDown}
            aria-label={`Move part ${label} down`}
            title="Move down, into the next question if this is the last part"
            className="px-3"
          >
            <ChevronDown className="size-4" />
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={onDelete}
            title="Delete this part"
            className="ml-auto text-destructive"
          >
            <Trash2 className="mr-2 size-4" />
            Delete Part
          </Button>
        </div>

        <div className="space-y-3">
          <h4 className="text-sm font-semibold">Grading Criteria</h4>

          {part.criteria.length === 0 ? (
            <p className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
              No grading criteria have been added. A part with no criteria is
              worth zero points.
            </p>
          ) : (
            part.criteria.map((criterion, criterionIndex) => (
              <div
                key={criterion.id}
                className="space-y-3 rounded-md border bg-muted/20 p-4"
              >
                {/* Points and delete sit above the description rather than
                    beside it: the description is the same rich editor the
                    prompts use, so it carries file cards under the text box
                    and has no fixed height to align a side column against. */}
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <label className="text-sm font-medium">
                    Criterion {criterionIndex + 1}
                  </label>

                  <div className="flex items-end gap-3">
                    <div>
                      <label className="text-sm font-medium">Points</label>
                      <Input
                        type="number"
                        min={0}
                        step={1}
                        value={criterion.points}
                        onChange={(event) =>
                          updateCriterion(criterion.id, {
                            points: Math.max(
                              0,
                              Number(event.target.value) || 0,
                            ),
                          })
                        }
                        className="mt-2 w-28"
                      />
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => deleteCriterion(criterion.id)}
                      title="Delete criterion"
                      aria-label={`Delete criterion ${criterionIndex + 1}`}
                      className="size-10 shrink-0 p-0 text-destructive"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>

                <RichPromptEditor
                  value={criterion.description}
                  onChange={(description) =>
                    updateCriterion(criterion.id, { description })
                  }
                  placeholder="Describe what earns these points. Use Add file to attach a model graph or sketch."
                />
              </div>
            ))
          )}
        </div>
      </AccordionContent>
    </AccordionItem>
  );
};

export default PartCard;
