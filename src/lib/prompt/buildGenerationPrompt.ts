import type { OutlineMap } from "@/lib/outline/map";

type OutlineSlice = { features:string[]; flows:string[]; rules:string[] };

export function buildGenerationPrompt(opts: {
  docId: string;
  chunkIndex: number;
  chunkText: string;
  outline: OutlineMap | null;       // full outline
  slice: OutlineSlice;       // just the IDs linked for this chunk
  maxCases: number;
  schemaJson: string;        // your JSON schema string
}) {
  const { docId, chunkIndex, chunkText, outline, slice, maxCases, schemaJson } = opts;

  const byId = <T extends {id:string; name:string; note?:string}>(xs:T[], ids:string[]) =>
    ids.map(id => xs.find(x => x.id===id)).filter(Boolean) as T[];

  const features = outline ? byId(outline.features, slice.features) : [];
  const flows    = outline ? byId(outline.flows, slice.flows) : [];
  const rules    = outline ? byId(outline.rules, slice.rules) : [];

  const ctxLines: string[] = [];
  if (features.length) {
    ctxLines.push("Features:");
    features.forEach(f => ctxLines.push(`- ${f.id}: ${f.name}`));
  }
  if (flows.length) {
    ctxLines.push("Flows:");
    flows.forEach(f => ctxLines.push(`- ${f.id}: ${f.name}`));
  }
  if (rules.length) {
    ctxLines.push("Global rules:");
    rules.forEach(r => ctxLines.push(`- ${r.id}: ${r.name}${r.note ? ` — ${r.note}` : ""}`));
  }

  const outlineSlice = ctxLines.join("\n");

  return [
    "SYSTEM: You are a QA test case generator. Output ONLY valid JSON per schema.",
    `CONTEXT (doc ${docId}, chunk #${chunkIndex}):`,
    "----- OUTLINE SLICE (use only for names/IDs/invariants; do not invent details) -----",
    outlineSlice || "(none)",
    "----- REQUIREMENT CHUNK (derive all details from here) -----",
    chunkText,
    "----- RULES -----",
    "1) Use exact names/IDs from the outline slice for consistency across the document.",
    "2) Derive test details ONLY from the requirement chunk.",
    "3) Keep each test atomic; avoid redundancy.",
    `4) Produce at most ${maxCases} test cases.`,
    "5) Fill `links.feature_ids` / `links.flow_ids` / `links.rule_ids` appropriately.",
    "6) Follow the JSON schema exactly.",
    "----- JSON SCHEMA -----",
    schemaJson,
  ].join("\n");
}