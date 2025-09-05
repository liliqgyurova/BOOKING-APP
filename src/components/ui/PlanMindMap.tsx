import React, { useMemo, useState } from 'react';
import { ChevronDown, ChevronUp, Lightbulb, Copy, Check } from 'lucide-react';
import { Badge } from './badge';
import { Button } from './button';

/* ---------- Types ---------- */
type Tool = { name: string; link?: string | null; icon?: string | null };
type Group = { title: string; tools: Tool[] };
type Language = 'en' | 'bg';

type PlanMindMapProps = {
  goal: string;
  steps: Group[];
  onOpenTool: (tool: Tool) => void;

  /** optional i18n bridge from App; used only for plain strings */
  t?: (key: string) => string;
  language?: Language;

  /** optional external prompt builder */
  buildPrompt?: (args: {
    goal: string;
    stepTitle: string;
    tools: Tool[];
    language: Language;
  }) => string;
};

/* ---------- Local i18n (fallbacks) ---------- */
const STR = {
  en: {
    assistantSuggestion: 'AI Assistant Suggestion',
    copyPasteReady: 'Copy & Paste Ready',
    copy: 'Copy',
    copied: 'Copied!',
    promptHint:
      '💡 Copy this prompt and paste it into any AI assistant (ChatGPT, Claude, etc.) for personalized guidance on this step.',
    aiTool: 'AI Tool',
    available: 'Available',
    noLink: 'No link',
    myGoalFallback: 'My goal',
  },
  bg: {
    assistantSuggestion: 'Предложение от AI асистент',
    copyPasteReady: 'Готово за копиране',
    copy: 'Копирай',
    copied: 'Копирано!',
    promptHint:
      '💡 Копирай промпта и го постави в AI асистент (ChatGPT, Claude и др.) за персонализирано ръководство за тази стъпка.',
    aiTool: 'AI инструмент',
    available: 'Налично',
    noLink: 'Няма линк',
    myGoalFallback: 'Моята цел',
  },
};

/* ---------- Helpers ---------- */
function detectLanguage(text: string): Language {
  if (!text) return 'en';
  return /[а-яё]/i.test(text) ? 'bg' : 'en';
}

function defaultPromptBuilder({
  goal,
  stepTitle,
  tools,
  language,
}: {
  goal: string;
  stepTitle: string;
  tools: Tool[];
  language: Language;
}) {
  const bg = language === 'bg';
  const goalPart = goal ? (bg ? `Моята главна цел е: "${goal}". ` : `My main goal is: "${goal}". `) : '';
  const ctx =
    tools.length > 0
      ? bg
        ? `Тази стъпка включва ${tools.length} препоръчани инструмента/подхода. `
        : `This step involves ${tools.length} recommended tools/approaches. `
      : '';

  return (
    (bg
      ? 'Ти си експертен асистент, който ми помага да постигам целите си. '
      : 'You are an expert assistant helping me achieve my goals. ') +
    goalPart +
    (bg ? `Нуждая се от помощ със стъпката: "${stepTitle}". ` : `I need help with the step: "${stepTitle}". `) +
    ctx +
    (bg
      ? 'Моля, дай: 1) ясен план стъпка по стъпка, 2) най-добри практики, 3) чести грешки и как да ги избегна, 4) нужни входове и очаквани изходи, 5) критерии за качество. Накрая задай 2–3 уточняващи въпроса за контекст и изисквания.'
      : 'Please provide: 1) a clear step-by-step action plan, 2) best practices, 3) common pitfalls and how to avoid them, 4) required inputs and expected outputs, 5) quality criteria. Then ask 2–3 clarifying questions about my context and requirements.')
  );
}

export default function PlanMindMap({
  goal,
  steps,
  onOpenTool,
  t,
  language,
  buildPrompt,
}: PlanMindMapProps) {
  const lang: Language = language || detectLanguage(goal || steps.map((s) => s.title).join(' '));
  const L = STR[lang];

  // plain-string translator with safe fallback
  const s = (key: keyof typeof L): string => {
    const defVal = L[key];
    if (t) {
      try {
        const v = t(key as any);
        if (typeof v === 'string' && v) return v;
      } catch {
        /* ignore */
      }
    }
    return defVal;
  };

  // dynamic labels (never call t for these)
  const stepLabel = (n: number) => (lang === 'bg' ? `Стъпка ${n}` : `Step ${n}`);
  const recCountLabel = (n: number) =>
    lang === 'bg' ? `${n} препоръчани инструмента` : `${n} recommended tools`;

  // state
  const [openTools, setOpenTools] = useState<Set<number>>(new Set([0]));
  const [openPrompts, setOpenPrompts] = useState<Set<number>>(new Set());
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const headerTitle = useMemo(() => goal || s('myGoalFallback'), [goal, lang]);

  const toggle = (set: Set<number>, idx: number) => {
    const next = new Set(set);
    next.has(idx) ? next.delete(idx) : next.add(idx);
    return next;
  };

  const copyPrompt = async (text: string, i: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIdx(i);
      setTimeout(() => setCopiedIdx(null), 1600);
    } catch {
      alert(s('promptHint'));
    }
  };

  return (
    <div className="space-y-6">
      {/* Goal header */}
      <div className="text-center">
        <div className="inline-flex items-center gap-3 bg-white/80 border border-slate-200 rounded-2xl px-4 py-3 shadow-sm">
          <span className="text-slate-700">{headerTitle}</span>
          {goal && (
            <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200">
              {goal}
            </Badge>
          )}
        </div>
      </div>

      {/* Steps */}
      <div className="space-y-6">
        {steps.map((step, i) => {
          const n = i + 1;
          const toolsOpened = openTools.has(i);
          const promptOpened = openPrompts.has(i);

          const promptText =
            (buildPrompt &&
              buildPrompt({ goal, stepTitle: step.title, tools: step.tools, language: lang })) ||
            defaultPromptBuilder({ goal, stepTitle: step.title, tools: step.tools, language: lang });

          return (
            <div
              key={`${step.title}-${i}`}
              className={`rounded-2xl border bg-white shadow-sm ${
                toolsOpened || promptOpened ? 'border-blue-200' : 'border-slate-200'
              }`}
            >
              {/* Header */}
              <div className="flex items-start gap-3 px-4 sm:px-5 pt-4">
                {/* Left step badge */}
                <div
                  className={`w-9 h-9 sm:w-10 sm:h-10 rounded-2xl flex items-center justify-center text-white font-bold shadow-md
                    ${
                      i % 3 === 0
                        ? 'bg-gradient-to-br from-blue-500 to-indigo-600 shadow-blue-500/25'
                        : i % 3 === 1
                        ? 'bg-gradient-to-br from-purple-500 to-pink-600 shadow-purple-500/25'
                        : 'bg-gradient-to-br from-emerald-500 to-green-600 shadow-emerald-500/25'
                    }`}
                >
                  {n}
                </div>

                {/* Title & subtitle */}
                <div className="flex-1 min-w-0 pb-4">
                  <div className="text-slate-800 font-semibold truncate">{step.title}</div>
                  <div className="text-xs text-slate-500">{recCountLabel(step.tools.length)}</div>
                </div>

                {/* Right controls */}
                <div className="flex items-center gap-2 pb-4">
                  {/* AI assistant button */}
                  <button
                    onClick={() => setOpenPrompts((sset) => toggle(sset, i))}
                    className={`inline-flex items-center gap-2 px-3 h-9 rounded-xl text-white shadow-sm transition relative
                      ${
                        promptOpened
                          ? 'bg-orange-500'
                          : 'bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600'
                      }
                    `}
                    title={s('assistantSuggestion')}
                  >
                    <Lightbulb className="w-4 h-4" />
                    <span className="text-sm font-medium hidden sm:inline">{s('assistantSuggestion')}</span>
                  </button>

                  {/* "Step X" pill */}
                  <button
                    onClick={() => setOpenTools((sset) => toggle(sset, i))}
                    className="inline-flex items-center gap-2 px-3 h-9 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200"
                    title={stepLabel(n)}
                  >
                    <span className="text-sm font-medium">{stepLabel(n)}</span>
                    {toolsOpened ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* PROMPT panel */}
              {promptOpened && (
                <div className="px-4 sm:px-5 pb-4">
                  <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/60 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 text-white flex items-center justify-center flex-shrink-0">
                        <Lightbulb className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-semibold text-amber-800">{s('assistantSuggestion')}</span>
                          <Badge
                            variant="secondary"
                            className="text-xs bg-amber-100 text-amber-700 border-amber-200"
                          >
                            {s('copyPasteReady')}
                          </Badge>
                        </div>

                        <div className="bg-white/80 border border-amber-200 rounded-lg p-3 text-sm text-slate-700">
                          {promptText}
                        </div>

                        <div className="mt-2 flex items-center justify-between">
                          <span className="text-xs text-amber-700">{s('promptHint')}</span>
                          <Button
                            variant="outline"
                            onClick={() => copyPrompt(promptText, i)}
                            className={`h-8 px-3 rounded-lg border-amber-200 ${
                              copiedIdx === i
                                ? 'bg-green-50 border-green-200 text-green-700'
                                : 'text-amber-700 hover:bg-amber-50'
                            }`}
                          >
                            {copiedIdx === i ? <Check className="w-4 h-4 mr-1" /> : <Copy className="w-4 h-4 mr-1" />}
                            <span className="text-xs font-medium">
                              {copiedIdx === i ? s('copied') : s('copy')}
                            </span>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TOOLS panel */}
              {toolsOpened && (
                <div className="px-4 sm:px-5 pb-5">
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {step.tools.map((tool) => (
                      <button
                        key={`${step.title}-${tool.name}`}
                        onClick={() => tool.link && onOpenTool(tool)}
                        className={`flex items-center gap-3 rounded-xl border p-3 text-left transition ${
                          tool.link
                            ? 'bg-white border-slate-200 hover:shadow-md hover:-translate-y-[2px]'
                            : 'bg-slate-50 border-slate-200 opacity-70 cursor-default'
                        }`}
                      >
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center overflow-hidden">
                          {tool.icon ? (
                            <img
                              src={tool.icon}
                              alt={tool.name}
                              className="w-6 h-6 object-contain"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <span className="text-white text-sm font-semibold">{tool.name.slice(0, 1)}</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-slate-800 truncate">{tool.name}</div>
                          <div className="text-xs text-slate-500 truncate">
                            {tool.link ? s('available') : s('noLink')}
                          </div>
                        </div>
                        <Badge variant="secondary" className="text-[10px] bg-blue-50 text-blue-700 border-blue-200">
                          {s('aiTool')}
                        </Badge>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
