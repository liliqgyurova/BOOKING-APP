// src/pages/Layout.tsx
import React from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { Sparkles, Star, Menu, Grid3x3, MessageCircle, Heart, User } from 'lucide-react';
import { Button } from '../components/ui/button';

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const active = (path: string) => location.pathname === path;

  const favCount = 0; // ако пазиш любими в context/localStorage – вържи тук

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200/50">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3 cursor-pointer">
              <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/25">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl text-slate-800 font-semibold">My AI</span>
            </Link>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-8">
              <Link
                to="/"
                className={`font-medium transition-colors ${active('/') ? 'text-blue-600' : 'text-slate-600 hover:text-blue-600'}`}
              >
                Откриване
              </Link>
              <Link
                to="/categories"
                className={`font-medium transition-colors ${active('/categories') ? 'text-blue-600' : 'text-slate-600 hover:text-blue-600'}`}
              >
                Категории
              </Link>
              <Link
                to="/learn"
                className={`font-medium transition-colors ${active('/learn') ? 'text-blue-600' : 'text-slate-600 hover:text-blue-600'}`}
              >
                Научи
              </Link>

              <Link
                to="/favorites"
                className={`inline-flex items-center gap-2 font-medium transition-colors ${
                  active('/favorites') ? 'text-blue-600' : 'text-slate-700 hover:text-blue-600'
                }`}
                title="Любими"
              >
                <Star className={`w-4 h-4 ${favCount ? 'fill-yellow-400 text-yellow-500' : ''}`} />
                <span className="hidden lg:inline">Любими</span>
                <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-full">{favCount}</span>
              </Link>
            </nav>

            {/* Mobile menu btn (можеш да развиеш ако ползваш) */}
            <Button variant="outline" size="sm" className="md:hidden">
              <Menu className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <Outlet />

      {/* Bottom nav (mobile) */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-slate-200/50 md:hidden z-50">
        <div className="flex items-center justify-around py-2">
          {[
            { name: 'Начало', icon: Grid3x3, to: '/' },
            { name: 'Категории', icon: MessageCircle, to: '/categories' },
            { name: 'Любими', icon: Heart, to: '/favorites' },
            { name: 'Профил', icon: User, to: '/profile' },
          ].map((item) => {
            const Icon = item.icon;
            const isActive = active(item.to);
            return (
              <button
                key={item.to}
                onClick={() => navigate(item.to)}
                className={`flex flex-col items-center py-2 px-3 rounded-xl transition-colors ${
                  isActive ? 'text-blue-600 bg-blue-50' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <Icon className="w-5 h-5 mb-1" />
                <span className="text-xs font-medium">{item.name}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
