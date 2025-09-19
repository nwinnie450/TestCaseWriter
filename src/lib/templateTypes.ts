export type OutputStyle = "steps" | "gherkin";

export type TemplateUIMeta = {
  beginner?: boolean;           // show on "Simple" tab if true
  useFor?: string;              // one-liner: "Web app sign-in pages"
  bullets?: string[];           // 2–4 bullets shown on card
  keywords?: string[];          // optional search tags
};

export type TemplateBasicFields = {
  feature?: string;             // module/feature name
  scopeOrUrl?: string;          // optional scope, URL, endpoint
  preconditions?: string;       // optional preconditions
  outputStyle: OutputStyle;     // steps or gherkin
  // advanced (collapsed by default)
  priority?: string;
  tags?: string[];
  owner?: string;
  component?: string;
  estimate?: string;
};

export type GeneratedCase = {
  title: string;
  preconditions?: string;
  steps?: string;               // for CSV import
  expected?: string;            // for CSV import
  priority?: string;
  tags?: string;
  owner?: string;
  component?: string;
};

export type TemplateDef = {
  id: string;
  name: string;
  description?: string;
  // your existing schema fields can stay as-is; we don't use them directly here
  schema?: Record<string, any>;
  uiMeta?: TemplateUIMeta;
  // OPTIONAL: if you have your own generator, wire it here later.
  generate?: (input: TemplateBasicFields) => GeneratedCase[];
};