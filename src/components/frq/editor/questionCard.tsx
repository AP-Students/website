"use client";

import PartCard from "@/components/frq/editor/partCard";
import RichPromptEditor from "@/components/frq/editor/richPromptEditor";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import type { EditorPart, EditorQuestion } from "@/lib/frq/editorState";
import {
  formatPoints,
  getEditorQuestionPoints,
} from "@/lib/frq/editorState";
import { getPartLabel } from "@/lib/frq/template";
import { Plus, Trash2 } from "lucide-react";

interface QuestionCardProps {
  question: EditorQuestion;
  /** Zero-based position; questions are numbered 1, 2, 3 for the author. */
  index: number;
  /** Edits this question's own fields. Its parts are addressed separately. */
  onChange: (updater: (question: EditorQuestion) => EditorQuestion) => void;
  onDelete: () => void;
  onAddPart: () => void;
  /**
   * Part handlers take a part id and live in the editor, not here. A part can
   * move to another question while an edit to it is still in flight, so an
   * update scoped to the question this card renders would land nowhere.
   */
  onUpdatePart: (
    partId: string,
    updater: (part: EditorPart) => EditorPart,
  ) => void;
  onDeletePart: (partId: string) => void;
  onMovePart: (partId: string, direction: -1 | 1) => void;
  canMovePart: (partId: string, direction: -1 | 1) => boolean;
  canDelete: boolean;
  /** Open part ids across the whole FRQ; part ids are unique per document. */
  openParts: string[];
  onOpenPartsChange: (openParts: string[]) => void;
}

const QuestionCard = ({
  question,
  index,
  onChange,
  onDelete,
  onAddPart,
  onUpdatePart,
  onDeletePart,
  onMovePart,
  canMovePart,
  canDelete,
  openParts,
  onOpenPartsChange,
}: QuestionCardProps) => {
  return (
    <AccordionItem
      value={question.id}
      data-frq-question={question.id}
      className="rounded-lg border-2 bg-muted/30 px-4 shadow-sm"
    >
      <AccordionTrigger className="py-4 hover:no-underline">
        <div className="flex flex-1 items-center justify-between pr-3">
          <span className="text-lg font-semibold">Question {index + 1}</span>
          <span className="text-sm font-normal text-muted-foreground">
            {question.parts.length}{" "}
            {question.parts.length === 1 ? "part" : "parts"} &middot;{" "}
            {formatPoints(getEditorQuestionPoints(question))}
          </span>
        </div>
      </AccordionTrigger>

      {/* See partCard.tsx: ui/accordion.tsx hardcodes opacity-70 on the content
          root, and there is no class-based override. */}
      <AccordionContent
        style={{ opacity: 1 }}
        className="space-y-5 pb-5 text-foreground"
      >
        <div>
          <label className="text-sm font-medium">Question stimulus</label>
          <p className="mt-1 text-sm text-muted-foreground">
            Source material for this question only. Students see it beside every
            part of this question. Directions that apply to the whole FRQ belong
            in the description on the left.
          </p>
          <div className="mt-2">
            <RichPromptEditor
              value={question.stimulus}
              onChange={(stimulus) =>
                onChange((current) => ({ ...current, stimulus }))
              }
              placeholder="Enter the stimulus for this question here."
            />
          </div>
        </div>

        {question.parts.length === 0 ? (
          <p className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
            This question has no parts yet. A question with no parts is not
            shown to students.
          </p>
        ) : (
          <Accordion
            type="multiple"
            value={openParts}
            // This accordion reports only the parts it owns, so the ids of
            // every other question's open parts have to be carried across or
            // opening one part would collapse the rest of the FRQ.
            onValueChange={(next) => {
              const owned = new Set(question.parts.map((part) => part.id));

              onOpenPartsChange([
                ...openParts.filter((id) => !owned.has(id)),
                ...next,
              ]);
            }}
            className="space-y-3"
          >
            {question.parts.map((part, partIndex) => (
              <PartCard
                key={part.id}
                part={part}
                // Labels restart at A inside every question, which is how AP
                // numbers them.
                label={getPartLabel(partIndex)}
                onChange={(updater) => onUpdatePart(part.id, updater)}
                onDelete={() => onDeletePart(part.id)}
                onMove={(direction) => onMovePart(part.id, direction)}
                canMoveUp={canMovePart(part.id, -1)}
                canMoveDown={canMovePart(part.id, 1)}
              />
            ))}
          </Accordion>
        )}

        <div className="flex flex-wrap items-center gap-2 border-t pt-4">
          <Button type="button" variant="outline" onClick={onAddPart}>
            <Plus className="mr-2 size-4" />
            Add Part
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={onDelete}
            disabled={!canDelete}
            title={
              canDelete
                ? "Delete this question and every part in it"
                : "An FRQ needs at least one question"
            }
            className="ml-auto text-destructive"
          >
            <Trash2 className="mr-2 size-4" />
            Delete Question
          </Button>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
};

export default QuestionCard;
