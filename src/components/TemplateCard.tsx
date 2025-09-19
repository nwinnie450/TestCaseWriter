"use client";
import Link from "next/link";
import { TemplateDef } from "@/lib/templateTypes";

export default function TemplateCard({ t }: { t: TemplateDef }) {
  const bullets = t.uiMeta?.bullets || [];
  return (
    <div className="rounded-2xl border bg-white p-4 shadow-sm flex flex-col">
      <div className="flex-1">
        <div className="text-base font-semibold">{t.name}</div>
        {t.uiMeta?.useFor && <div className="text-xs text-gray-500 mt-0.5">Use for: {t.uiMeta.useFor}</div>}
        {t.description && <p className="text-sm text-gray-600 mt-2">{t.description}</p>}
        {bullets.length > 0 && (
          <ul className="text-sm text-gray-700 mt-3 list-disc pl-5 space-y-0.5">
            {bullets.slice(0, 3).map((b, i) => <li key={i}>{b}</li>)}
          </ul>
        )}
      </div>
      <div className="mt-4 flex gap-2">
        <Link href={`/simple-templates/${t.id}/use`} className="rounded-xl border px-3 py-1.5 hover:bg-gray-50 text-sm">Use generator</Link>
        <Link href={`/simple-templates/${t.id}/use?preview=1`} className="rounded-xl border px-3 py-1.5 hover:bg-gray-50 text-sm">Preview sample</Link>
      </div>
    </div>
  );
}