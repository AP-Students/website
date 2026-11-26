import Ajv2020 from "ajv/dist/2020";

const schemas: Record<string, object> = {
  chapter: { type: "object", required: ["time", "version", "blocks"], properties: { time: { type: "number" }, version: { type: "string" }, blocks: { type: "array" } } },
  test: { type: "object", required: ["questions", "time", "directions"], properties: { questions: { type: "array" }, time: { type: "number" }, directions: { type: "string" } } },
  frq: { type: "object", required: ["title", "directions", "questions"], properties: { title: { type: "string" }, directions: { type: "string" }, questions: { type: "array" }, timeLimitMinutes: { type: "number" } } },
};

export function validateMcpSchema(contentType: string, content: unknown) {
  const schema = schemas[contentType];
  if (!schema) return [{ code: "INVALID_CONTENT_TYPE", severity: "blocking" as const, message: "Unknown MCP content type." }];
  const ajv = new Ajv2020({ allErrors: true, strict: false });
  const validate = ajv.compile(schema);
  const valid = validate(content);
  if (valid) return [];
  return (validate.errors ?? []).map((error) => ({ code: "SCHEMA_VALIDATION", severity: "blocking" as const, targetPointer: error.instancePath || "/", message: error.message ?? "Schema validation failed." }));
}
