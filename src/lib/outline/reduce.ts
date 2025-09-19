import type { OutlineItem, OutlineMap } from "./map";

const SIM_LIMIT = 0.85;
const norm = (s:string) => s.toLowerCase().replace(/\s+/g,' ').trim();
const jaccard = (a: string, b: string) => {
  const A = new Set(norm(a).split(" ")); const B = new Set(norm(b).split(" "));
  const I = new Set([...A].filter(x => B.has(x))).size;
  const U = new Set([...A, ...B]).size;
  return U ? I / U : 0;
};

function mergeCategory(items: OutlineItem[]): OutlineItem[] {
  const merged: OutlineItem[] = [];
  for (const it of items) {
    const hit = merged.find(m => jaccard(m.name, it.name) >= SIM_LIMIT);
    if (!hit) merged.push(it);
    else if (it.note && !hit.note) hit.note = it.note;
  }
  return merged;
}

export function reduceOutline(chunks: OutlineMap[]): OutlineMap {
  const all = {
    features: chunks.flatMap(c => c.features),
    flows:    chunks.flatMap(c => c.flows),
    rules:    chunks.flatMap(c => c.rules),
    entities: chunks.flatMap(c => c.entities),
  };
  return {
    features: mergeCategory(all.features).map(x => ({ ...x, id: x.id.startsWith("feature.") ? x.id : `feature.${x.id}` })),
    flows:    mergeCategory(all.flows).map(x => ({ ...x, id: x.id.startsWith("flow.") ? x.id : `flow.${x.id}` })),
    rules:    mergeCategory(all.rules).map(x => ({ ...x, id: x.id.startsWith("rule.") ? x.id : `rule.${x.id}` })),
    entities: mergeCategory(all.entities).map(x => ({ ...x, id: x.id.startsWith("entity.") ? x.id : `entity.${x.id}` })),
  };
}