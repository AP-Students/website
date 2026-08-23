import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LEGACY_QUESTION_ID,
  getAllParts,
  getPartLabel,
  normalizeFrqTemplate,
} from "../src/lib/frq/template.ts";

const identity = { id: "t1", subject: "calc", unitId: "u1" };

/**
 * Mirrors buildTemplatePayload in editorRenderer.tsx: the editor holds a flat
 * part list and writes it back wrapped in one question. Kept in step with that
 * function by shape, so this exercises the real save format.
 */
const simulateEditorSave = (
  template: ReturnType<typeof normalizeFrqTemplate>,
) => ({
  title: template.title,
  directions: template.directions,
  directionsFiles: template.directionsFiles,
  timeLimitMinutes: template.timeLimitMinutes,
  isPublic: template.isPublic,
  questions: [
    {
      id: LEGACY_QUESTION_ID,
      stimulus: "",
      stimulusFiles: [],
      parts: getAllParts(template).map((part, index) => ({
        id: part.id,
        title: getPartLabel(index),
        prompt: part.prompt,
        promptFiles: part.promptFiles,
        answerType: part.answerType,
        status: part.status,
        criteria: part.criteria,
      })),
    },
  ],
});

// A realistic pre-migration document: flat parts, stimulus in `directions`,
// mixed statuses, real criteria.
const legacyDocument = {
  title: "Unit 3 FRQ",
  directions: "<p>The graph shows velocity over time.</p>",
  directionsFiles: [{ key: "graph.png", name: "graph.png" }],
  timeLimitMinutes: 45,
  isPublic: true,
  questions: [
    {
      id: "part-abc123",
      title: "A",
      prompt: "<p>Find the acceleration.</p>",
      answerType: "text",
      status: "public",
      criteria: [{ id: "crit-1", description: "Correct value", points: 2 }],
    },
    {
      id: "part-def456",
      title: "B",
      prompt: "<p>Justify your answer.</p>",
      answerType: "equation",
      status: "public",
      criteria: [{ id: "crit-2", description: "Valid reasoning", points: 3 }],
    },
    {
      id: "part-ghi789",
      title: "C",
      prompt: "<p>Retired part.</p>",
      status: "legacy",
      criteria: [],
    },
  ],
};

test("round trip: a legacy document survives load -> save -> reload", () => {
  const loaded = normalizeFrqTemplate(legacyDocument, identity);
  const reloaded = normalizeFrqTemplate(simulateEditorSave(loaded), identity);

  const before = getAllParts(loaded);
  const after = getAllParts(reloaded);

  // The property existing submissions and grades depend on: every part id
  // survives a save unchanged and in order.
  assert.deepEqual(
    after.map((part) => part.id),
    before.map((part) => part.id),
    "part ids must survive the round trip",
  );
  assert.deepEqual(
    after.map((part) => part.prompt),
    before.map((part) => part.prompt),
  );
  assert.deepEqual(
    after.map((part) => part.status),
    before.map((part) => part.status),
    "legacy status must not be silently promoted to public",
  );
  assert.deepEqual(
    after.map((part) => part.answerType),
    before.map((part) => part.answerType),
  );
  assert.deepEqual(
    after.flatMap((part) => (part.criteria ?? []).map((c) => c.points)),
    before.flatMap((part) => (part.criteria ?? []).map((c) => c.points)),
  );
});

test("round trip: exam-wide directions and files are not lost", () => {
  const loaded = normalizeFrqTemplate(legacyDocument, identity);
  const reloaded = normalizeFrqTemplate(simulateEditorSave(loaded), identity);

  assert.equal(reloaded.directions, legacyDocument.directions);
  assert.deepEqual(
    reloaded.directionsFiles?.map((file) => file.key),
    ["graph.png"],
  );
  assert.equal(reloaded.timeLimitMinutes, 45);
  assert.equal(reloaded.isPublic, true);
});

test("round trip is idempotent: saving twice changes nothing", () => {
  const once = normalizeFrqTemplate(legacyDocument, identity);
  const twice = normalizeFrqTemplate(simulateEditorSave(once), identity);
  const thrice = normalizeFrqTemplate(simulateEditorSave(twice), identity);

  assert.deepEqual(getAllParts(thrice), getAllParts(twice));
  assert.equal(twice.questions.length, 1);
  assert.equal(thrice.questions.length, 1);
});

test("a saved document is read back as nested, not re-wrapped as legacy", () => {
  const loaded = normalizeFrqTemplate(legacyDocument, identity);
  const saved = simulateEditorSave(loaded);
  const reloaded = normalizeFrqTemplate(saved, identity);

  // If the save were read as the legacy shape again, the single question would
  // be treated as one flat part and its 3 parts would collapse to nothing.
  assert.equal(reloaded.questions.length, 1);
  assert.equal(reloaded.questions[0]?.id, LEGACY_QUESTION_ID);
  assert.equal(reloaded.questions[0]?.parts.length, 3);
});
