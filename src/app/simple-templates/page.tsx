"use client";
import { useMemo, useState } from "react";
import TemplateCard from "@/components/TemplateCard";
import { templates } from "@/lib/templates";

type Tab = "simple" | "advanced" | "mine";

export default function SimpleTemplatesPage() {
  const [tab, setTab] = useState<Tab>("simple");
  const list = useMemo(() => {
    if (tab === "simple") return templates.filter(t => t.uiMeta?.beginner);
    if (tab === "advanced") return templates; // show all (unchanged)
    if (tab === "mine") return []; // TODO: load user-saved templates
    return templates;
  }, [tab]);

  return (
    <main className="p-6">
      <div className="mb-4">
        <h1 className="text-xl font-semibold">Test Case Generators</h1>
        <p className="text-sm text-gray-600 mt-0.5">Pick a generator → fill basics → preview → add to Library or create a Run.</p>
      </div>

      <div className="mb-4 flex items-center gap-2">
        <TabButton active={tab==="simple"} onClick={()=>setTab("simple")}>Simple</TabButton>
        <TabButton active={tab==="advanced"} onClick={()=>setTab("advanced")}>Advanced</TabButton>
        <TabButton active={tab==="mine"} onClick={()=>setTab("mine")}>Mine</TabButton>
      </div>

      {list.length === 0 ? (
        <div className="rounded-2xl border p-10 text-center bg-white">
          <div className="text-4xl mb-3">✨</div>
          <div className="text-lg font-semibold">No generators here yet</div>
          <p className="text-sm text-gray-600 mt-1">Try another tab or create your own.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {list.map(t => <TemplateCard key={t.id} t={t} />)}
        </div>
      )}
    </main>
  );
}

function TabButton({active, children, onClick}:{active:boolean; children:React.ReactNode; onClick:()=>void}) {
  return (
    <button onClick={onClick}
      className={`text-sm rounded-lg border px-3 py-1.5 ${active ? "bg-black text-white border-black" : "hover:bg-gray-50"}`}>
      {children}
    </button>
  );
}