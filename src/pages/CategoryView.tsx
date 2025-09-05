import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
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

// Мапинг от cap:* тагове към човешки имена + категории от App.tsx
const CAP_DISPLAY_NAMES: Record<string, string> = {
  // Оригиналните cap: записи
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
  
  // Добавяме категориите от App.tsx за случай че са подадени директно
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
}

export default function CategoryView({ cap = "" }: CategoryViewProps) {
  console.log('CategoryView received cap:', cap); // DEBUG
  const [loading, setLoading] = useState(true);
  const [tools, setTools] = useState<Tool[]>([]);
  const [filter, setFilter] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Получаваме човешкото име на категорията
  const categoryDisplayName = CAP_DISPLAY_NAMES[cap] || cap;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        // Правилният API endpoint с cap parameter
        const url = `${API_BASE}/catalog/tools?cap=${encodeURIComponent(cap || "")}&limit=100`;
        console.log('Fetching tools from:', url);
        
        const r = await fetch(url);
        if (!r.ok) {
          throw new Error(`HTTP ${r.status}: ${r.statusText}`);
        }
        const data = await r.json();
        console.log('API Response:', data);

        // API shape: { total, items: [...], limit, offset }
        const arr: Tool[] = (data?.items || []).map((t: any) => ({
          name: t.name,
          description: t.description ?? "",
          tags: t.tags ?? [],
          icon: t.icon ?? null, // от _tool_icon функцията в catalog_router.py
          link: t.link ?? null, // от links.website
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
  }, [cap]);

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
            <span className="font-medium">Назад</span>
          </button>
          <div className="w-px h-6 bg-slate-300" />
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-800">
              {categoryDisplayName}
            </h1>
            <p className="text-slate-600 mt-1">
              {loading ? 'Зареждане...' : `${shown.length} инструмента в тази категория`}
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
            Всички
          </ToggleGroupItem>
          <ToggleGroupItem value="free" aria-label="Free">
            Безплатни
          </ToggleGroupItem>
          <ToggleGroupItem value="popular" aria-label="Popular">
            Популярни
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
            Опитайте отново
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
            {tools.length === 0 ? 'Няма инструменти в тази категория' : 'Няма резултати за този филтър'}
          </h3>
          <p className="text-slate-600">
            {tools.length === 0 
              ? 'Опитайте друга категория или се върнете назад.' 
              : 'Опитайте с друг филтър или премахнете текущия.'
            }
          </p>
          {filter && (
            <Button variant="outline" onClick={() => setFilter(null)} className="mt-4">
              Премахни филтъра
            </Button>
          )}
        </div>
      )}

      {/* Tools Grid */}
      {!loading && !error && shown.length > 0 && (
       <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
         {shown.map((tool, index) => ( // Добави index
           <Card 
             key={`${tool.name}-${index}`} // Направи key уникален
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
                          // Показваме fallback иконата
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
                      Отвори инструмент 
                      <ExternalLink className="w-4 h-4 ml-2" />
                    </Button>
                  </a>
                ) : (
                  <Button disabled className="w-full rounded-2xl h-11 bg-slate-100 text-slate-400">
                    Няма налична връзка
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
              Показани <span className="font-semibold text-slate-800">{shown.length}</span> от 
              <span className="font-semibold text-slate-800"> {tools.length}</span> инструмента
            </span>
            {filter && (
              <Badge variant="secondary" className="text-xs">
                Филтър: {filter}
              </Badge>
            )}
          </div>
        </div>
      )}
    </main>
  );
}