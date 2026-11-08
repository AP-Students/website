import assert from "node:assert/strict";
import { test } from "node:test";
import {
  previewQuestions,
  syncPreviewRoots,
  type MountedPreview,
} from "../src/components/article-creator/questionPreviews.ts";

/** Stand-ins for placeholder elements and React roots; only identity matters. */
type Node = { name: string };
type Root = { on: Node };

const node = (name: string): Node => ({ name });
const createRoot = (element: Node): Root => ({ on: element });

function sync(
  mounted: Map<string, MountedPreview<Node, Root>>,
  placeholders: [string, Node][],
) {
  return syncPreviewRoots(mounted, new Map(placeholders), createRoot);
}

test("mounts a card in every question placeholder", () => {
  const single = node("single");
  const quiz = node("quiz");
  const { mounted, stale } = sync(new Map(), [
    ["qa-single", single],
    ["qa-quiz", quiz],
  ]);

  assert.equal(mounted.get("qa-single")?.root.on, single);
  assert.equal(mounted.get("qa-quiz")?.root.on, quiz);
  assert.deepEqual(stale, []);
});

test("keeps a card whose placeholder is still the same node", () => {
  const single = node("single");
  const first = sync(new Map(), [["qa-single", single]]);
  const second = sync(first.mounted, [["qa-single", single]]);

  // Same root, so a quiz the author has clicked through keeps its state.
  assert.equal(second.mounted.get("qa-single"), first.mounted.get("qa-single"));
  assert.deepEqual(second.stale, []);
});

test("remounts a card when its placeholder was replaced with the same content (#440)", () => {
  // The bug: the preview's HTML was rewritten on an unrelated re-render (the
  // autosave status changing), with identical markup. The placeholder was a
  // new node, and the card stayed behind in the old, detached one.
  const before = node("single, before re-render");
  const after = node("single, after re-render");
  const first = sync(new Map(), [["qa-single", before]]);
  const oldRoot = first.mounted.get("qa-single")!.root;

  const second = sync(first.mounted, [["qa-single", after]]);

  assert.equal(second.mounted.get("qa-single")?.root.on, after);
  assert.notEqual(second.mounted.get("qa-single")?.root, oldRoot);
  assert.deepEqual(second.stale, [oldRoot]);
});

test("returns the cards of deleted question blocks for unmounting", () => {
  const single = node("single");
  const quiz = node("quiz");
  const first = sync(new Map(), [
    ["qa-single", single],
    ["qa-quiz", quiz],
  ]);
  const quizRoot = first.mounted.get("qa-quiz")!.root;

  const second = sync(first.mounted, [["qa-single", single]]);

  assert.equal(second.mounted.has("qa-quiz"), false);
  assert.deepEqual(second.stale, [quizRoot]);
});

test("does not mount a card for a block whose placeholder is missing", () => {
  const { mounted } = sync(new Map(), []);

  assert.equal(mounted.size, 0);
});

test("fills in the fields an older saved question can lack", () => {
  const [question] = previewQuestions([
    { options: [{ id: "a" }], answers: undefined },
  ]);

  assert.deepEqual(question?.question, { value: "", files: [] });
  assert.deepEqual(question?.explanation, { value: "", files: [] });
  assert.deepEqual(question?.options, [
    { id: "a", value: { value: "", files: [] } },
  ]);
  assert.deepEqual(question?.answers, []);
  assert.equal(question?.type, "mcq");
});

test("keeps the stored question content as it is", () => {
  const stored = {
    question: { value: "<strong>Pick B</strong>", files: [] },
    type: "multi-answer",
    options: [{ id: "b", value: { value: "B", files: [] } }],
    answers: ["b"],
    explanation: { value: "Because.", files: [] },
    content: { value: "", files: [] },
    topic: "cells",
  };

  assert.deepEqual(previewQuestions([stored]), [stored]);
});

test("shows no questions for missing or malformed question data", () => {
  assert.deepEqual(previewQuestions(undefined), []);
  assert.deepEqual(previewQuestions("not a list"), []);
  assert.deepEqual(previewQuestions([null, 3]), []);
});
