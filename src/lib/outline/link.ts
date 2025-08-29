import type { OutlineMap } from "./map";

const N = (s:string) => s.toLowerCase();

export function linkChunkToOutline(chunkText: string, outline: OutlineMap) {
  const text = N(chunkText);
  const has = (name: string) => {
    const key = N(name).split(/[()]/)[0].trim();
    return key && text.includes(key);
  };

  const featureIds = outline.features.filter(f => has(f.name)).map(f => f.id);
  const flowIds    = outline.flows.filter(f => has(f.name)).map(f => f.id);
  const ruleIds    = outline.rules.filter(r => has(r.name) || (r.note && has(r.note!))).map(r => r.id);

  // Cap to keep prompt small
  return {
    featureIds: featureIds.slice(0, 8),
    flowIds: flowIds.slice(0, 12),
    ruleIds: ruleIds.slice(0, 12),
  };
}