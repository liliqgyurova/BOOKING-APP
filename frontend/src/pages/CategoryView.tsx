import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Skeleton } from "../components/ui/skeleton";
import { Separator } from "../components/ui/separator";
import { ToggleGroup, ToggleGroupItem } from "../components/ui/toggle-group";
import { ArrowLeft, ExternalLink, Star, Sparkles } from "lucide-react";

type Tool = {
  name: string;
  description?: string;
  tags?: string[];
  icon?: string | null;
  link?: string | null;
  rating?: number | null;
};

const API_BASE =
  (import.meta as any).env?.VITE_API_BASE ||
  (window as any).__API_BASE__ ||
  "http://127.0.0.1:8000";

// Multilingual support
type Language = 'en' | 'bg';

const translations = {
  en: {
    back: 'Back',
    loading: 'Loading...',
    toolsInCategory: 'tools in this category',
    all: 'All',
    free: 'Free',
    popular: 'Popular',
    errorLoading: 'Failed to load tools',
    tryAgain: 'Try Again',
    noTools: 'No tools in this category',
    noResults: 'No results for this filter',
    tryOtherCategory: 'Try another category or go back.',
    tryOtherFilter: 'Try a different filter or remove the current one.',
    removeFilter: 'Remove filter',
    openTool: 'Open Tool',
    noLink: 'No available link',
    showing: 'Showing',
    of: 'of',
    tools: 'tools',
    filter: 'Filter',
  },
  bg: {
    back: 'Назад',
    loading: 'Зареждане...',
    toolsInCategory: 'инструмента в тази категория',
    all: 'Всички',
    free: 'Безплатни',
    popular: 'Популярни',
    errorLoading: 'Неуспешно зареждане на инструментите',
    tryAgain: 'Опитайте отново',
    noTools: 'Няма инструменти в тази категория',
    noResults: 'Няма резултати за този филтър',
    tryOtherCategory: 'Опитайте друга категория или се върнете назад.',
    tryOtherFilter: 'Опитайте с друг филтър или премахнете текущия.',
    removeFilter: 'Премахни филтъра',
    openTool: 'Отвори инструмент',
    noLink: 'Няма налична връзка',
    showing: 'Показани',
    of: 'от',
    tools: 'инструмента',
    filter: 'Филтър',
  }
};

// Category names for both languages
const CAP_DISPLAY_NAMES_EN: Record<string, string> = {
  "cap:text-explain": "Assistants & Productivity",
  "cap:text-edit": "Text Generation & Writing",
  "cap:text-summarize": "Text Summarization",
  "cap:image-generate": "Images & Design",
  "cap:image-edit": "Image Editing",
  "cap:video-generate": "Video & 3D",
  "cap:video-edit": "Video Editing",
  "cap:voice-generate": "Audio & Music",
  "cap:audio-transcribe": "Audio Transcription",
  "cap:research-web": "Web Search & Research",
  "cap:automate-workflow": "Automation & Agents",
  "cap:integrations": "Integrations",
  "cap:slide-generate": "Presentations & Data",
  "cap:doc-read-pdf": "Document Analysis",
  "assistants-productivity": "Assistants & Productivity",
  "text-writing": "Text Generation & Writing",
  "images-design": "Images & Design",
  "video-3d": "Video & 3D",
  "audio-music": "Audio & Music",
  "business-marketing": "Business, Marketing & Social Media",
  "coding-development": "Coding & Development",
  "automation-agents": "Automation & Agents",
  "data-analysis": "Data & Analysis",
  "education-learning": "Education & Learning",
  "health-wellness": "Health & Wellness",
  "specialized-niche": "Specialized & Niche"
};

const CAP_DISPLAY_NAMES_BG: Record<string, string> = {
  "cap:text-explain": "Асистенти и продуктивност",
  "cap:text-edit": "Генерация на текст и писане",
  "cap:text-summarize": "Резюмиране на текстове",
  "cap:image-generate": "Изображения и дизайн",
  "cap:image-edit": "Редакция на изображения",
  "cap:video-generate": "Видео и 3D",
  "cap:video-edit": "Редакция на видео",
  "cap:voice-generate": "Аудио и музика",
  "cap:audio-transcribe": "Транскрипция на аудио",
  "cap:research-web": "Уеб търсене и изследвания",
  "cap:automate-workflow": "Автоматизация и агенти",
  "cap:integrations": "Интеграции",
  "cap:slide-generate": "Презентации и данни",
  "cap:doc-read-pdf": "Анализ на документи",
  "assistants-productivity": "Асистенти и продуктивност",
  "text-writing": "Генерация на текст и писане",
  "images-design": "Изображения и дизайн",
  "video-3d": "Видео и 3D",
  "audio-music": "Аудио и музика",
  "business-marketing": "Бизнес, маркетинг и социални медии",
  "coding-development": "Кодиране и разработка",
  "automation-agents": "Автоматизация и агенти",
  "data-analysis": "Данни и анализ",
  "education-learning": "Образование и обучение",
  "health-wellness": "Здраве и благополучие",
  "specialized-niche": "Специализирани/нишови"
};

interface CategoryViewProps {
  cap?: string;
  language?: Language;
}

export default function CategoryView({ cap = "", language = 'bg' }: CategoryViewProps) {
  const t = (key: string) => {
    const translationKey = key as keyof typeof translations.en;
    return translations[language][translationKey] || key;
  };
  
  const CAP_NAMES = language === 'bg' ? CAP_DISPLAY_NAMES_BG : CAP_DISPLAY_NAMES_EN;
  console.log('CategoryView received cap:', cap);
  
  const [loading, setLoading] = useState(true);
  const [tools, setTools] = useState<Tool[]>([]);
  const [filter, setFilter] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const categoryDisplayName = CAP_NAMES[cap] || cap;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        const url = `${API_BASE}/catalog/tools?cap=${encodeURIComponent(cap || "")}&language=${language}&limit=100`;
        console.log('Fetching tools from:', url);
        
        const r = await fetch(url);
        if (!r.ok) {
          throw new Error(`HTTP ${r.status}: ${r.statusText}`);
        }
        const data = await r.json();
        console.log('API Response:', data);

        const arr: Tool[] = (data?.items || []).map((t: any) => ({
          name: t.name,
          description: t.description ?? "",
          tags: t.tags ?? [],
          icon: t.icon ?? null,
          link: t.link ?? null,
          rating: t.rating ?? null,
        }));

        if (!cancelled) {
          setTools(arr);
          setLoading(false);
          console.log(`Loaded ${arr.length} tools for category ${cap}`);
        }
      } catch (e) {
        console.error("CategoryView fetch failed", e);
        if (!cancelled) {
          setError(`Неуспешно зареждане на инструментите: ${e instanceof Error ? e.message : 'Неизвестна грешка'}`);
          setLoading(false);
        }
      }
    })();

    return () => { cancelled = true; };
  }, [cap, language]);

  const shown = useMemo(() => {
    if (!filter) return tools;
    const f = filter.toLowerCase();
    return tools.filter((t) =>
      (t.tags || []).some((x) => (x || "").toLowerCase().includes(f)) ||
      (t.name || "").toLowerCase().includes(f) ||
      (t.description || "").toLowerCase().includes(f)
    );
  }, [tools, filter]);

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 pb-24 md:pb-12">
      <div className="flex items-end justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => window.location.hash = '#/categories'}
            className="inline-flex items-center gap-2 text-slate-600 hover:text-blue-600 transition-colors p-2 -ml-2 rounded-xl"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="font-medium">{t('back')}</span>
          </button>
          <div className="w-px h-6 bg-slate-300" />
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-800">
              {categoryDisplayName}
            </h1>
            <p className="text-slate-600 mt-1">
              {loading ? t('loading') : `${shown.length} ${t('toolsInCategory')}`}
            </p>
          </div>
        </div>

        <ToggleGroup
          type="single"
          value={filter ?? ""}
          onValueChange={(v) => setFilter(v || null)}
          className="bg-slate-100 rounded-xl p-1"
        >
          <ToggleGroupItem value="" aria-label="All">
            {t('all')}
          </ToggleGroupItem>
          <ToggleGroupItem value="free" aria-label="Free">
            {t('free')}
          </ToggleGroupItem>
          <ToggleGroupItem value="popular" aria-label="Popular">
            {t('popular')}
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      <Separator className="my-6" />

      {/* Error State */}
      {error && (
        <div className="text-center py-10">
          <div className="text-red-600 font-medium mb-4 p-4 bg-red-50 rounded-2xl border border-red-200 max-w-2xl mx-auto">
            {error}
          </div>
          <Button variant="outline" onClick={() => window.location.reload()}>
            {t('tryAgain')}
          </Button>
        </div>
      )}

      {/* Loading State */}
      {loading && !error && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 9 }).map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-2xl" />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && shown.length === 0 && (
        <div className="text-center py-20">
          <div className="w-20 h-20 bg-slate-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <Sparkles className="w-10 h-10 text-slate-400" />
          </div>
          <h3 className="text-slate-800 mb-3 font-bold text-xl">
            {tools.length === 0 ? t('noTools') : t('noResults')}
          </h3>
          <p className="text-slate-600">
            {tools.length === 0 ? t('tryOtherCategory') : t('tryOtherFilter')}
          </p>
          {filter && (
            <Button variant="outline" onClick={() => setFilter(null)} className="mt-4">
              {t('removeFilter')}
            </Button>
          )}
        </div>
      )}

      {/* Tools Grid */}
      {!loading && !error && shown.length > 0 && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {shown.map((tool, index) => (
            <Card 
              key={`${tool.name}-${index}`}
              className="group border-slate-200/50 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-white/90 backdrop-blur-sm"
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  {/* Icon */}
                  <div className="w-14 h-14 rounded-2xl overflow-hidden bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform duration-300">
                    {tool.icon ? (
                      <img
                        src={tool.icon}
                        alt={tool.name}
                        className="w-8 h-8 object-contain"
                        loading="lazy"
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          const img = e.currentTarget as HTMLImageElement;
                          img.onerror = null;
                          img.style.display = 'none';
                          img.parentElement!.innerHTML = '<div class="w-8 h-8 flex items-center justify-center text-white font-bold text-sm">AI</div>';
                        }}
                      />
                    ) : (
                      <Sparkles className="w-7 h-7 text-white" />
                    )}
                  </div>

                  {/* Rating */}
                  {tool.rating != null && (
                    <div className="flex items-center gap-1 px-2 py-1 bg-yellow-100 border border-yellow-200 rounded-lg">
                      <Star className="w-3 h-3 fill-yellow-400 text-yellow-500" />
                      <span className="text-xs font-medium text-yellow-700">
                        {tool.rating.toFixed(1)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Title and Description */}
                <h3 className="text-slate-800 mb-2 font-bold text-lg leading-tight">
                  {tool.name}
                </h3>
                <p className="text-sm text-slate-600 mb-4 line-clamp-2 leading-relaxed">
                  {tool.description || "AI инструмент за автоматизация и повишаване на продуктивността."}
                </p>

                {/* Tags */}
                <div className="flex flex-wrap gap-1 mb-4">
                  <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700 font-medium px-2 py-1">
                    AI Tool
                  </Badge>
                  {(tool.tags || []).slice(0, 2).map((tag, i) => (
                    <Badge key={i} variant="outline" className="text-xs px-2 py-1">
                      {tag.replace('cap:', '')}
                    </Badge>
                  ))}
                </div>

                {/* Action Button */}
                {tool.link ? (
                  <a
                    href={tool.link}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="block"
                  >
                    <Button className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-2xl h-11 font-medium shadow-lg shadow-blue-500/25 transition-all duration-200">
                      {t('openTool')} 
                      <ExternalLink className="w-4 h-4 ml-2" />
                    </Button>
                  </a>
                ) : (
                  <Button disabled className="w-full rounded-2xl h-11 bg-slate-100 text-slate-400">
                    {t('noLink')}
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Results Summary */}
      {!loading && !error && shown.length > 0 && (
        <div className="mt-12 text-center">
          <div className="inline-flex items-center gap-4 bg-white/80 border border-slate-200/50 rounded-2xl px-6 py-3 backdrop-blur-sm">
            <span className="text-sm text-slate-600">
              {t('showing')} <span className="font-semibold text-slate-800">{shown.length}</span> {t('of')} 
              <span className="font-semibold text-slate-800"> {tools.length}</span> {t('tools')}
            </span>
            {filter && (
              <Badge variant="secondary" className="text-xs">
                {t('filter')}: {filter}
              </Badge>
            )}
          </div>
        </div>
      )}
    </main>
  );
}