import { mapOutlineFromChunk } from "./map";
import { reduceOutline } from "./reduce";
import { simpleHash } from "../caseSignature";

export interface RequirementOutline {
  id: string;
  docId: string;
  version: number;
  hash: string;
  outline: any; // OutlineMap but stored as JSON
  createdAt: Date;
}

const STORAGE_KEY = 'testCaseWriter_requirementOutlines';

function getStoredOutlines(): RequirementOutline[] {
  try {
    // Check if we're in a browser environment
    if (typeof localStorage === 'undefined') {
      return [];
    }
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    return JSON.parse(stored).map((outline: any) => ({
      ...outline,
      createdAt: new Date(outline.createdAt)
    }));
  } catch (error) {
    console.error('Failed to load stored outlines:', error);
    return [];
  }
}

function saveOutline(outline: RequirementOutline): void {
  try {
    // Check if we're in a browser environment
    if (typeof localStorage === 'undefined') {
      return;
    }
    const existing = getStoredOutlines();
    const updated = existing.filter(o => !(o.docId === outline.docId && o.version === outline.version));
    updated.push(outline);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Failed to save outline:', error);
  }
}

export function buildOrGetOutline(docId: string, chunks: { chunkIndex:number; text:string }[]): RequirementOutline {
  const docHash = simpleHash(chunks.map(c => c.text).join("\n"));
  const existing = getStoredOutlines()
    .filter(o => o.docId === docId)
    .sort((a, b) => b.version - a.version)[0]; // Get latest version
  
  if (existing && existing.hash === docHash) {
    console.log(`📋 Outline cache hit for doc ${docId?.substring(0, 8) || 'unknown'}...`);
    return existing; // cache hit
  }

  console.log(`📋 Building new outline for doc ${docId?.substring(0, 8) || 'unknown'}... (${chunks.length} chunks)`);
  const maps = chunks.map(c => mapOutlineFromChunk(c.text));
  const reduced = reduceOutline(maps);
  const version = (existing?.version ?? 0) + 1;
  
  const newOutline: RequirementOutline = {
    id: simpleHash(`${docId}|${version}`),
    docId,
    version,
    hash: docHash,
    outline: reduced,
    createdAt: new Date()
  };
  
  saveOutline(newOutline);
  console.log(`✅ Built outline v${version}:`, {
    features: reduced.features.length,
    flows: reduced.flows.length,
    rules: reduced.rules.length,
    entities: reduced.entities.length
  });
  
  return newOutline;
}

export function getOutlineStats(): {
  totalOutlines: number;
  byDocId: Record<string, { versions: number; latestVersion: number }>;
} {
  const outlines = getStoredOutlines();
  const byDocId: Record<string, { versions: number; latestVersion: number }> = {};
  
  for (const outline of outlines) {
    if (!byDocId[outline.docId]) {
      byDocId[outline.docId] = { versions: 0, latestVersion: 0 };
    }
    byDocId[outline.docId].versions++;
    byDocId[outline.docId].latestVersion = Math.max(byDocId[outline.docId].latestVersion, outline.version);
  }
  
  return {
    totalOutlines: outlines.length,
    byDocId
  };
}