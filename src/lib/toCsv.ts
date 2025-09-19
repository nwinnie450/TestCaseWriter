import { GeneratedCase } from "./templateTypes";

// NOTE: Keep columns aligned to your existing Import template.
// If your import expects different headers, edit here (UI stays the same).
const HEADERS = ["Title","Preconditions","Steps","Expected","Priority","Tags","Owner","Component"] as const;

export function downloadCasesAsCSV(rows: GeneratedCase[], filename: string) {
  const esc = (s?: string) => {
    const v = (s ?? "").replace(/\r?\n/g, "\\n");
    return /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
  };

  const lines = [
    HEADERS.join(","),
    ...rows.map(r => [
      esc(r.title),
      esc(r.preconditions),
      esc(r.steps),
      esc(r.expected),
      esc(r.priority),
      esc(r.tags),
      esc(r.owner),
      esc(r.component),
    ].join(","))
  ];
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
}