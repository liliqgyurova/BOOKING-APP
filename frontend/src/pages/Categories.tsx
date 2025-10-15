import { useEffect, useMemo, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Search, ArrowLeft } from 'lucide-react';
import { Card, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';

const API_BASE =
  (import.meta as any).env?.VITE_API_BASE ||
  (window as any).__API_BASE__ ||
  'http://127.0.0.1:8000';

type Category = {
  id: string;           // cap:* slug от бекенда
  label: string;        // четливо име
  count?: number;       // брой инструменти
  description?: string; // описание
  emoji?: string;       // емоджи
  gradient?: string;    // Tailwind градиент
};

// Мапинг от cap:* тагове към фронтенд визуални данни
const FRONTEND_CATEGORY_MAPPING: Record<
  string,
  { emoji: string; gradient: string; description: string }
> = {
  'cap:text-explain': {
    emoji: '🤖',
    gradient: 'from-blue-500 to-indigo-600',
    description: 'Умни помощници и инструменти за повишаване на продуктивността',
  },
  'cap:text-edit': {
    emoji: '✍️',
    gradient: 'from-emerald-500 to-teal-600',
    description: 'Създаване, редактиране и подобряване на текстово съдържание',
  },
  'cap:text-summarize': {
    emoji: '📝',
    gradient: 'from-amber-500 to-orange-600',
    description: 'Резюмиране и извличане на ключова информация',
  },
  'cap:image-generate': {
    emoji: '🎨',
    gradient: 'from-purple-500 to-pink-600',
    description: 'Генериране, редактиране и дизайн на визуално съдържание',
  },
  'cap:image-edit': {
    emoji: '🖼️',
    gradient: 'from-violet-500 to-purple-600',
    description: 'Редактиране и обработка на изображения',
  },
  'cap:video-generate': {
    emoji: '🎬',
    gradient: 'from-red-500 to-orange-600',
    description: 'Създаване и редактиране на видео и 3D съдържание',
  },
  'cap:video-edit': {
    emoji: '🎞️',
    gradient: 'from-pink-500 to-red-600',
    description: 'Редактиране и монтаж на видео',
  },
  'cap:voice-generate': {
    emoji: '🎵',
    gradient: 'from-amber-500 to-yellow-600',
    description: 'Генериране на звук, музика и гласови записи',
  },
  'cap:audio-transcribe': {
    emoji: '🎙️',
    gradient: 'from-cyan-500 to-blue-500',
    description: 'Транскрипция и обработка на аудио',
  },
  'cap:research-web': {
    emoji: '🔍',
    gradient: 'from-cyan-500 to-blue-600',
    description: 'Уеб търсене, изследвания и анализ на информация',
  },
  'cap:automate-workflow': {
    emoji: '⚡',
    gradient: 'from-violet-500 to-purple-600',
    description: 'Автоматизация на процеси и работни потоци',
  },
  'cap:integrations': {
    emoji: '🔗',
    gradient: 'from-indigo-500 to-purple-600',
    description: 'Интеграции между различни платформи и услуги',
  },
  'cap:slide-generate': {
    emoji: '📊',
    gradient: 'from-teal-600 to-emerald-700',
    description: 'Създаване на презентации и графики',
  },
  'cap:doc-read-pdf': {
    emoji: '📄',
    gradient: 'from-slate-500 to-gray-600',
    description: 'Четене, анализ и обработка на документи',
  },
};

export default function Categories() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        const r = await fetch(`${API_BASE}/catalog/categories`);
        if (!r.ok) throw new Error(`HTTP ${r.status}: ${r.statusText}`);
        const data = await r.json();

        // API shape: { categories: [{ id, label, count }, ...] }
        const arr: any[] = data?.categories || [];
        const mapped: Category[] = arr.map((c: any) => {
          const id = c.id as string;
          const label = c.label as string;

          const mapping =
            FRONTEND_CATEGORY_MAPPING[id] || {
              emoji: '✨',
              gradient: 'from-slate-500 to-gray-600',
              description: 'Специални инструменти за конкретни области',
            };

          return {
            id,
            label,
            count: c.count ?? 0,
            description: mapping.description,
            emoji: mapping.emoji,
            gradient: mapping.gradient,
          };
        });

        if (!cancelled) {
          setCategories(mapped);
          setLoading(false);
        }
      } catch (e) {
        console.error('Failed to fetch categories', e);
        if (!cancelled) {
          setError('Неуспешно зареждане на категориите. Проверете връзката към сървъра.');
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return categories;
    return categories.filter(
      (c) =>
        c.label.toLowerCase().includes(term) ||
        (c.description || '').toLowerCase().includes(term) ||
        c.id.toLowerCase().includes(term),
    );
  }, [categories, search]);

  const totalTools = categories.reduce((sum, cat) => sum + (cat.count || 0), 0);

  return (
    <main className="max-w-6xl mx-auto px-4 py-8 pb-24 md:pb-12">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-slate-600 hover:text-blue-600 transition-colors p-2 -ml-2 rounded-xl"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="font-medium">Назад</span>
          </button>
          <div className="w-px h-6 bg-slate-300" />
          <div>
            <h1 className="text-3xl text-slate-800 font-bold">AI Категории Инструменти</h1>
            <p className="text-slate-600 text-sm mt-1">
              Разгледайте нашата колекция от AI инструменти, организирани по предназначение и функционалност.
            </p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="mb-8">
        <div className="relative max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <Input
            placeholder="Търсене в категории..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-12 bg-white/80 border-slate-200/50 h-12 rounded-2xl backdrop-blur-sm font-medium"
          />
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="text-center py-10">
          <div className="text-red-600 font-medium mb-4 p-4 bg-red-50 rounded-2xl border border-red-200 max-w-2xl mx-auto">
            {error}
          </div>
          <button onClick={() => window.location.reload()} className="text-blue-600 hover:underline">
            Опитайте отново
          </button>
        </div>
      )}

      {/* Loading */}
      {loading && !error && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="h-40 bg-slate-100 rounded-3xl animate-pulse" />
          ))}
        </div>
      )}

      {/* Empty */}
      {!loading && !error && filtered.length === 0 && (
        <div className="text-center py-20">
          <div className="w-20 h-20 bg-slate-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <Search className="w-10 h-10 text-slate-400" />
          </div>
          <h3 className="text-slate-800 mb-3 font-bold text-xl">Няма намерени категории</h3>
          <p className="text-slate-600">Опитайте с друга дума за търсене.</p>
        </div>
      )}

      {/* Categories Grid */}
      {!loading && !error && filtered.length > 0 && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((category) => (
            <Link
              key={category.id}
              to={`/categories/${encodeURIComponent(category.id)}`}
              className="group"
            >
              <Card className="border-slate-200/50 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 bg-white/90 backdrop-blur-sm cursor-pointer overflow-hidden">
                <CardContent className="p-6 relative">
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${category.gradient} opacity-5 group-hover:opacity-10 transition-opacity duration-300`}
                  />
                  <div className="relative">
                    <div className="flex items-start justify-between mb-4">
                      <div
                        className={`w-16 h-16 rounded-3xl bg-gradient-to-br ${category.gradient} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}
                      >
                        <span className="text-2xl">{category.emoji || '✨'}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-slate-700">{category.count ?? 0}</div>
                        <div className="text-xs text-slate-400">инструмента</div>
                      </div>
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 mb-2 group-hover:text-slate-900 transition-colors">
                      {category.label}
                    </h3>
                    {category.description && (
                      <p className="text-sm text-slate-600 mb-4 leading-relaxed">
                        {category.description}
                      </p>
                    )}
                    <div className="flex items-center justify-between">
                      <Badge
                        variant="secondary"
                        className={`text-xs font-medium px-3 py-1 bg-gradient-to-r ${category.gradient} text-white border-0`}
                      >
                        Разгледай категория
                      </Badge>
                      <ArrowLeft className="w-4 h-4 text-slate-400 rotate-180 group-hover:translate-x-1 transition-transform duration-300" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* Stats */}
      {!loading && !error && categories.length > 0 && (
        <div className="mt-12 text-center">
          <div className="inline-flex items-center gap-6 bg-white/80 border border-slate-200/50 rounded-2xl px-6 py-4 backdrop-blur-sm">
            <div className="text-center">
              <div className="text-2xl font-bold text-slate-800">{filtered.length}</div>
              <div className="text-xs text-slate-500">Категории</div>
            </div>
            <div className="w-px h-8 bg-slate-300" />
            <div className="text-center">
              <div className="text-2xl font-bold text-slate-800">{totalTools}</div>
              <div className="text-xs text-slate-500">Общо инструменти</div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
