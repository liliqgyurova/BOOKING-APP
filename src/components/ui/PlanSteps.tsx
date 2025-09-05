import React, { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, ExternalLink, Sparkles } from "lucide-react";
import { Card, CardContent } from "./card";
import { Button } from "./button";
import { Badge } from "./badge";

type Tool = { name: string; link?: string | null; icon?: string | null };
type Group = { title: string; tools: Tool[] };

type Props = {
  goal?: string;
  groups: Group[];
};

export default function PlanSteps({ goal, groups }: Props) {
  const [active, setActive] = useState(0);

  // безопасно активен индекс
  const safeActive = Math.min(Math.max(active, 0), Math.max(groups.length - 1, 0));
  const step = groups[safeActive];

  useEffect(() => {
    // стрелки ← → за навигация между стъпките
    const onKey = (e: KeyboardEvent) => {
      if (!groups.length) return;
      if (e.key === "ArrowLeft") setActive((i) => Math.max(0, i - 1));
      if (e.key === "ArrowRight") setActive((i) => Math.min(groups.length - 1, i + 1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [groups.length]);

  if (!groups?.length) return null;

  return (
    <section className="mt-10">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-2xl font-bold text-slate-800">Plan overview</h3>
        {goal ? <Badge variant="secondary" className="capitalize">{goal}</Badge> : null}
      </div>

      {/* Хоризонтална последователност от стъпки */}
      <div className="relative rounded-2xl border border-slate-200 bg-white/80 backdrop-blur-sm p-3">
        <div className="flex items-center overflow-x-auto gap-3 px-1 pb-2">
          {groups.map((g, i) => {
            const isActive = i === safeActive;
            return (
              <div key={g.title} className="flex items-center">
                <button
                  onClick={() => setActive(i)}
                  className={`group relative max-w-[360px] truncate rounded-2xl border px-4 py-2 text-sm font-semibold transition
                    ${isActive
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"}`}
                  title={g.title}
                >
                  <span className={`mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full text-xs
                    ${isActive ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-700"}`}>
                    {i + 1}
                  </span>
                  <span className="align-middle">{g.title}</span>
                </button>
                {i < groups.length - 1 && (
                  <div className="mx-3 h-[2px] w-8 shrink-0 rounded bg-slate-200" />
                )}
              </div>
            );
          })}
        </div>

        {/* Навигационни бутони */}
        <div className="mt-2 flex items-center justify-between">
          <Button variant="outline" size="sm" onClick={() => setActive((i) => Math.max(0, i - 1))} disabled={safeActive === 0}>
            <ChevronLeft className="mr-1 h-4 w-4" /> Prev
          </Button>
          <div className="text-xs text-slate-500">
            Step {safeActive + 1} of {groups.length}
          </div>
          <Button variant="outline" size="sm" onClick={() => setActive((i) => Math.min(groups.length - 1, i + 1))}
            disabled={safeActive === groups.length - 1}>
            Next <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Детайли за активната стъпка */}
      <Card className="mt-5 border-slate-200/60 bg-white/80 backdrop-blur-sm">
        <CardContent className="p-6">
          <div className="mb-3 flex items-center justify-between">
            <h4 className="text-lg font-semibold text-slate-800">{step.title}</h4>
            <Badge variant="secondary">{step.tools.length} tools</Badge>
          </div>

          {/* “Балончета” за инструменти */}
          <div className="flex flex-wrap gap-3">
            {step.tools.map((t) => {
              const href = t.link || "#";
              const hasLink = Boolean(t.link);
              return (
                <a
                  key={t.name}
                  href={href}
                  target={hasLink ? "_blank" : undefined}
                  rel={hasLink ? "noreferrer noopener" : undefined}
                  className={`group inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm transition
                    ${hasLink
                      ? "border-slate-200 bg-white hover:shadow"
                      : "border-slate-200 bg-slate-50 cursor-default"}`}
                  title={t.name}
                >
                  {t.icon ? (
                    <img
                      src={t.icon}
                      alt=""
                      className="h-5 w-5 rounded object-contain"
                      loading="lazy"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        const img = e.currentTarget as HTMLImageElement;
                        img.onerror = null;
                        img.src = "/icons/default-tool.svg";
                      }}
                    />
                  ) : (
                    <Sparkles className="h-4 w-4 text-slate-400" />
                  )}
                  <span className="font-medium text-slate-700">{t.name}</span>
                  {hasLink && <ExternalLink className="h-3.5 w-3.5 text-slate-400 opacity-0 transition group-hover:opacity-100" />}
                </a>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
