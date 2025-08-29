// Lightweight, token-free outline extractor from raw chunk text
export type OutlineItem = { id: string; name: string; note?: string };
export type OutlineMap = {
  features: OutlineItem[];
  flows: OutlineItem[];
  rules: OutlineItem[];
  entities: OutlineItem[];
};

const slug = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");

const uniqPush = (arr: OutlineItem[], item: OutlineItem) => {
  if (!arr.some(x => x.id === item.id)) arr.push(item);
};

export function mapOutlineFromChunk(chunkText: string): OutlineMap {
  // Basic signals
  const lines = chunkText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);

  const headers = lines.filter(l => /^#{1,6}\s+|^[A-Z][A-Za-z0-9 ]+:$/.test(l));
  const bullets  = lines.filter(l => /^[-*•]\s+/.test(l));
  const rulesSig = /(must|shall|should|require|permission|validation|limit|SLA|auth|role)/i;
  const flowSig  = /(flow|process|scenario|use case|happy path|step \d+|precondition|postcondition)/i;
  const featureSig = /(module|feature|screen|page|endpoint|service|component)/i;
  const entitySig  = /(entity|table|field|attribute|schema|object)/i;

  const out: OutlineMap = { features: [], flows: [], rules: [], entities: [] };

  // 1) Headers become likely features/flows
  headers.forEach(h => {
    const name = h.replace(/^#{1,6}\s+/, "").replace(/:$/, "").trim();
    const id = slug(name);
    if (flowSig.test(h)) uniqPush(out.flows, { id: `flow.${id}`, name });
    else uniqPush(out.features, { id: `feature.${id}`, name });
  });

  // 2) Bullet lines with "flow/process/steps" → flows
  bullets.forEach(b => {
    const name = b.replace(/^[-*•]\s+/, "");
    if (flowSig.test(name)) {
      const id = slug(name.split(/[:.]/)[0]);
      uniqPush(out.flows, { id: `flow.${id}`, name });
    }
  });

  // 3) Rules (permissions/validation)
  lines.forEach(l => {
    if (rulesSig.test(l)) {
      const key = l.split(/[.:]/)[0].slice(0, 60);
      const id = slug(key);
      uniqPush(out.rules, { id: `rule.${id}`, name: key, note: l });
    }
  });

  // 4) Entities & fields
  lines.forEach(l => {
    if (entitySig.test(l) || /\b(id|name|email|status|amount|created_at)\b/i.test(l)) {
      const key = l.split(/[.:]/)[0].slice(0, 60);
      const id = slug(key);
      uniqPush(out.entities, { id: `entity.${id}`, name: key });
    }
  });

  // Compact & cap (keep only the first N to stay small)
  const cap = <T>(xs: T[], n = 30) => xs.slice(0, n);
  out.features = cap(out.features);
  out.flows    = cap(out.flows);
  out.rules    = cap(out.rules, 40);
  out.entities = cap(out.entities);

  return out;
}