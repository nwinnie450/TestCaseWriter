"use client";
import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { getTemplateById } from "@/src/lib/templates";
import { TemplateBasicFields, GeneratedCase } from "@/src/lib/templateTypes";
import { downloadCasesAsCSV } from "@/src/lib/toCsv";

export default function UseTemplatePage() {
  const { id } = useParams<{id:string}>();
  const sp = useSearchParams();
  const router = useRouter();
  const t = getTemplateById(id);
  const [step, setStep] = useState<1|2>(sp.get("preview")==="1" ? 2 : 1);
  const [data, setData] = useState<TemplateBasicFields>({
    outputStyle: "steps",
  });
  const [preview, setPreview] = useState<GeneratedCase[]|null>(null);

  useEffect(() => {
    if (step !== 2) return;
    // Generate sample cases (use template's own generator if provided; else fallback)
    const gen = t?.generate ?? fallbackGenerator;
    const out = gen({...data});
    setPreview(out.slice(0, 3)); // show first 3 for preview
  }, [step, data, t]);

  if (!t) return <div className="p-6 text-sm text-gray-500">Template not found.</div>;

  return (
    <main className="p-6 max-w-3xl mx-auto">
      <div className="mb-4">
        <div className="text-xs text-gray-500">Template</div>
        <h1 className="text-xl font-semibold">{t.name}</h1>
        {t.description && <p className="text-sm text-gray-600 mt-1">{t.description}</p>}
      </div>

      <div className="flex gap-2 mb-4">
        <StepBadge active={step===1}>1. Basics</StepBadge>
        <StepBadge active={step===2}>2. Preview</StepBadge>
      </div>

      {step === 1 && (
        <section className="space-y-4">
          <Field label="Feature / Module" placeholder="e.g., Login, Search, Checkout"
            value={data.feature || ""} onChange={(v)=>setData(d=>({...d, feature:v}))} />
          <Field label="Scope / URL (optional)" placeholder="e.g., /login, /search?q=abc, GET /api/items"
            value={data.scopeOrUrl || ""} onChange={(v)=>setData(d=>({...d, scopeOrUrl:v}))} />
          <Field label="Preconditions (optional)" placeholder="e.g., user exists, account locked" textarea
            value={data.preconditions || ""} onChange={(v)=>setData(d=>({...d, preconditions:v}))} />

          <div>
            <div className="text-sm font-medium mb-1">Output style</div>
            <div className="flex gap-2">
              <Choice active={data.outputStyle==="steps"} onClick={()=>setData(d=>({...d, outputStyle:"steps"}))}>Steps</Choice>
              <Choice active={data.outputStyle==="gherkin"} onClick={()=>setData(d=>({...d, outputStyle:"gherkin"}))}>Gherkin</Choice>
            </div>
            <p className="text-xs text-gray-500 mt-1">You can always switch this later.</p>
          </div>

          <details className="rounded-xl border p-3 bg-white">
            <summary className="cursor-pointer font-medium">Advanced (optional)</summary>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
              <Field label="Priority" placeholder="e.g., P1/P2/High/Medium"
                value={data.priority || ""} onChange={(v)=>setData(d=>({...d, priority:v}))} />
              <Field label="Component" placeholder="e.g., auth, payments"
                value={data.component || ""} onChange={(v)=>setData(d=>({...d, component:v}))} />
              <Field label="Owner" placeholder="e.g., alice"
                value={data.owner || ""} onChange={(v)=>setData(d=>({...d, owner:v}))} />
              <Field label="Tags (comma separated)" placeholder="e.g., smoke, regression"
                value={(data.tags || []).join(",")} onChange={(v)=>setData(d=>({...d, tags: v ? v.split(",").map(s=>s.trim()).filter(Boolean):[]}))} />
            </div>
          </details>

          <div className="flex justify-end gap-2">
            <button onClick={()=>setStep(2)} className="rounded-xl border px-4 py-2 hover:bg-gray-50">Preview</button>
          </div>
        </section>
      )}

      {step === 2 && (
        <section className="space-y-4">
          {!preview ? (
            <div className="text-sm text-gray-500">Generating preview…</div>
          ) : (
            <>
              <div className="rounded-2xl border bg-white p-4">
                <div className="text-sm font-medium mb-2">Preview (first 3)</div>
                <ul className="space-y-3">
                  {preview.map((c, i)=>(
                    <li key={i} className="border rounded-xl p-3">
                      <div className="font-medium mb-1">{c.title}</div>
                      {c.preconditions && <div className="text-xs text-gray-500 mb-2">Preconditions: {c.preconditions}</div>}
                      <pre className="text-xs whitespace-pre-wrap">{c.steps}</pre>
                      {c.expected && <div className="text-xs text-gray-700 mt-1">Expected: {c.expected}</div>}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex items-center justify-between">
                <div className="text-xs text-gray-500">
                  Tip: "Add to Library" downloads a CSV you can import using your current Import template.
                </div>
                <div className="flex gap-2">
                  <button onClick={()=>setStep(1)} className="rounded-xl border px-4 py-2 hover:bg-gray-50">Back</button>
                  <button
                    onClick={()=>{
                      const gen = t.generate ?? fallbackGenerator;
                      const all = gen({...data});
                      downloadCasesAsCSV(all, `${t.id}-${Date.now()}.csv`);
                    }}
                    className="rounded-xl border px-4 py-2 hover:bg-gray-50"
                  >
                    Add to Library (CSV)
                  </button>
                  <button
                    onClick={async ()=>{
                      const gen = t.generate ?? fallbackGenerator;
                      const all = gen({...data});
                      const res = await fetch("/api/runs", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          name: `${t.name} – Quick Run`,
                          projectId: "default",
                          createdBy: "me",
                          selectedTestCaseIds: all.map((c, idx) => `${t.id.toUpperCase()}-${idx+1}`),
                          // Convert generated cases to the format expected by /api/runs
                          testCases: all.map((c, idx) => ({
                            id: `${t.id.toUpperCase()}-${idx+1}`,
                            title: c.title,
                            description: c.steps || "",
                            category: c.component || "General",
                            priority: c.priority || "medium",
                            steps: (c.steps || "").split("\n").map((step, i) => ({
                              step: i + 1,
                              description: step.trim(),
                              expectedResult: i === 0 ? (c.expected || "") : "",
                              testData: ""
                            }))
                          }))
                        }),
                      }).then(r=>r.json());
                      if (res?.runId) router.push(`/execution?runId=${res.runId}`);
                    }}
                    className="rounded-xl border px-4 py-2 hover:bg-gray-50"
                  >
                    Create Run now
                  </button>
                </div>
              </div>
            </>
          )}
        </section>
      )}
    </main>
  );
}

function Field({label, placeholder, value, onChange, textarea}:{label:string; placeholder?:string; value:string; onChange:(v:string)=>void; textarea?:boolean}) {
  return (
    <label className="block">
      <div className="text-sm font-medium mb-1">{label}</div>
      {textarea ? (
        <textarea className="w-full text-sm border rounded-xl p-2" rows={3} placeholder={placeholder} value={value} onChange={(e)=>onChange(e.target.value)} />
      ) : (
        <input className="w-full text-sm border rounded-xl p-2" placeholder={placeholder} value={value} onChange={(e)=>onChange(e.target.value)} />
      )}
    </label>
  );
}

function Choice({active, children, onClick}:{active:boolean; children:React.ReactNode; onClick:()=>void}) {
  return (
    <button onClick={onClick}
      className={`text-sm rounded-lg border px-3 py-1.5 ${active ? "bg-black text-white border-black" : "hover:bg-gray-50"}`}>
      {children}
    </button>
  );
}

function StepBadge({active, children}:{active:boolean; children:React.ReactNode}) {
  return (
    <div className={`text-xs rounded-full px-3 py-1 border ${active ? "bg-black text-white border-black" : "bg-white"}`}>{children}</div>
  );
}

// Fallback generator (keeps wizard usable even if a template has no generate())
function fallbackGenerator(input: TemplateBasicFields): GeneratedCase[] {
  const feat = input.feature || "Feature";
  const prec = input.preconditions?.trim();
  return [
    { title: `${feat}: happy path`, preconditions: prec, steps: "Step 1\nStep 2\nStep 3", expected: "Works as expected" },
    { title: `${feat}: invalid input shows error`, preconditions: prec, steps: "Open page\nSubmit invalid data", expected: "Validation error shown" },
    { title: `${feat}: boundary conditions`, preconditions: prec, steps: "Open page\nSubmit boundary data", expected: "Edge cases handled" },
  ];
}