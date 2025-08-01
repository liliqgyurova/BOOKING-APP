import React, { useState } from 'react';
import { Search, Star, Heart, User, MessageCircle, Grid3x3, Sparkles, Zap, Brain, Palette, Video, Code, TrendingUp, Users, BookOpen } from 'lucide-react';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { Badge } from './components/ui/badge';
import { Card, CardContent } from './components/ui/card';

const aiTools = [
  {
    id: 1,
    name: "ChatGPT",
    icon: MessageCircle,
    rating: 4.8,
    category: "Writing",
    isPaid: true,
    difficulty: "Easy",
    description: "AI-powered writing assistant",
    color: "from-emerald-400 to-emerald-500"
  },
  {
    id: 2,
    name: "Midjourney",
    icon: Palette,
    rating: 4.9,
    category: "Design",
    isPaid: true,
    difficulty: "Easy",
    description: "AI image generation tool",
    color: "from-purple-400 to-purple-500"
  },
  {
    id: 3,
    name: "Runway ML",
    icon: Video,
    rating: 4.7,
    category: "Video",
    isPaid: true,
    difficulty: "Advanced",
    description: "AI video editing and generation",
    color: "from-orange-400 to-orange-500"
  },
  {
    id: 4,
    name: "GitHub Copilot",
    icon: Code,
    rating: 4.6,
    category: "Development",
    isPaid: true,
    difficulty: "Advanced",
    description: "AI coding assistant",
    color: "from-slate-400 to-slate-500"
  },
  {
    id: 5,
    name: "Perplexity AI",
    icon: Brain,
    rating: 4.5,
    category: "Research",
    isPaid: false,
    difficulty: "Easy",
    description: "AI research assistant",
    color: "from-blue-400 to-blue-500"
  },
  {
    id: 6,
    name: "Canva AI",
    icon: Sparkles,
    rating: 4.4,
    category: "Design",
    isPaid: false,
    difficulty: "Easy",
    description: "AI-powered design tools",
    color: "from-pink-400 to-pink-500"
  }
];

const starterPacks = [
  {
    title: "Content Creator Pack",
    description: "Perfect for social media and blog content",
    tools: ["ChatGPT", "Canva AI", "Midjourney"],
    icon: TrendingUp,
    gradient: "from-blue-500 to-cyan-500",
    bgGradient: "from-blue-50 to-cyan-50"
  },
  {
    title: "Student Essentials",
    description: "Research, writing, and study tools",
    tools: ["Perplexity AI", "ChatGPT", "Notion AI"],
    icon: BookOpen,
    gradient: "from-indigo-500 to-purple-500",
    bgGradient: "from-indigo-50 to-purple-50"
  },
  {
    title: "Marketing Pro",
    description: "Complete marketing automation suite",
    tools: ["Copy.ai", "Canva AI", "Analytics AI"],
    icon: Users,
    gradient: "from-violet-500 to-pink-500",
    bgGradient: "from-violet-50 to-pink-50"
  }
];

export default function App() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [activeTab, setActiveTab] = useState('Home');

  const filters = ['Free', 'Paid', 'Easy', 'Advanced'];

  const toggleFilter = (filter: string) => {
    setActiveFilters(prev => 
      prev.includes(filter) 
        ? prev.filter(f => f !== filter)
        : [...prev, filter]
    );
  };

  const filteredTools = aiTools.filter(tool => {
    const matchesSearch = tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         tool.category.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilters = activeFilters.length === 0 || activeFilters.every(filter => {
      if (filter === 'Free') return !tool.isPaid;
      if (filter === 'Paid') return tool.isPaid;
      if (filter === 'Easy') return tool.difficulty === 'Easy';
      if (filter === 'Advanced') return tool.difficulty === 'Advanced';
      return true;
    });

    return matchesSearch && matchesFilters;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/70 backdrop-blur-xl border-b border-slate-200/50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/25">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl text-slate-800 font-semibold">My AI</span>
          </div>
          
          <nav className="hidden md:flex items-center space-x-8">
            <a href="#" className="text-slate-600 hover:text-blue-600 transition-colors font-medium">Discover</a>
            <a href="#" className="text-slate-600 hover:text-blue-600 transition-colors font-medium">Categories</a>
            <a href="#" className="text-slate-600 hover:text-blue-600 transition-colors font-medium">Learn</a>
            <Button variant="outline" size="sm" className="border-blue-300 text-blue-600 hover:bg-blue-50 font-medium">
              Sign In
            </Button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-12 pb-24 md:pb-12">
        
        {/* Hero Section with Chat Input */}
        <section className="text-center mb-16">
          <div className="mb-10">
            <h1 className="text-5xl md:text-6xl text-slate-800 mb-6 font-bold tracking-tight">
              Discover AI tools that 
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent"> actually help</span>
            </h1>
            <p className="text-xl text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed">
              From writing essays to creating art, find the perfect AI tools for your goals. 
              No technical jargon, just results.
            </p>
          </div>

          {/* Large Chat Input */}
          <div className="max-w-2xl mx-auto mb-10">
            <div className="relative bg-white/80 backdrop-blur-sm rounded-3xl p-8 border border-slate-200/50 shadow-2xl shadow-blue-500/10">
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/25">
                  <MessageCircle className="w-6 h-6 text-white" />
                </div>
                <span className="text-slate-700 text-lg font-medium">What do you want to achieve with AI?</span>
              </div>
              <div className="flex space-x-3">
                <Input
                  placeholder="e.g., Write better emails, create a logo, analyze data..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  className="flex-1 bg-slate-50/80 border-slate-200 text-base h-14 rounded-2xl px-5 font-medium placeholder:text-slate-400"
                />
                <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 px-8 h-14 rounded-2xl shadow-lg shadow-blue-500/25 font-medium">
                  <Zap className="w-5 h-5 mr-2" />
                  Find Tools
                </Button>
              </div>
            </div>
          </div>

          {/* Quick suggestions */}
          <div className="flex flex-wrap justify-center gap-3 mb-12">
            {['Write content', 'Create images', 'Edit videos', 'Learn coding', 'Analyze data'].map((suggestion) => (
              <Button
                key={suggestion}
                variant="outline"
                size="sm"
                className="bg-white/80 border-slate-200/50 text-slate-600 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 rounded-2xl px-5 py-2.5 font-medium backdrop-blur-sm"
              >
                {suggestion}
              </Button>
            ))}
          </div>
        </section>

        {/* Starter Packs */}
        <section className="mb-16">
          <h2 className="text-3xl text-slate-800 mb-8 font-bold flex items-center">
            <span className="mr-3">🚀</span>
            AI Starter Packs
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {starterPacks.map((pack, index) => {
              const IconComponent = pack.icon;
              return (
                <Card key={index} className="border-slate-200/50 hover:shadow-xl transition-all duration-300 hover:-translate-y-2 bg-white/80 backdrop-blur-sm overflow-hidden group">
                  <CardContent className="p-0">
                    <div className={`h-24 bg-gradient-to-r ${pack.bgGradient} relative overflow-hidden`}>
                      <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent"></div>
                      <div className={`absolute top-4 left-6 w-12 h-12 bg-gradient-to-r ${pack.gradient} rounded-2xl flex items-center justify-center shadow-lg`}>
                        <IconComponent className="w-6 h-6 text-white" />
                      </div>
                    </div>
                    <div className="p-6">
                      <h3 className="text-slate-800 mb-2 font-bold text-lg">{pack.title}</h3>
                      <p className="text-slate-600 text-sm mb-4 leading-relaxed">{pack.description}</p>
                      <div className="flex flex-wrap gap-2 mb-5">
                        {pack.tools.map((tool) => (
                          <Badge key={tool} variant="secondary" className="text-xs bg-slate-100 text-slate-700 font-medium px-3 py-1">
                            {tool}
                          </Badge>
                        ))}
                      </div>
                      <Button size="sm" className="w-full bg-slate-800 hover:bg-slate-900 text-white font-medium h-10 rounded-xl">
                        Get Started
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        {/* Search and Filters */}
        <section className="mb-10">
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
              <Input
                placeholder="Search tools, categories, or goals..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 bg-white/80 border-slate-200/50 h-12 rounded-2xl backdrop-blur-sm font-medium"
              />
            </div>
          </div>

          {/* Filter Chips */}
          <div className="flex flex-wrap gap-3">
            {filters.map((filter) => (
              <Button
                key={filter}
                variant={activeFilters.includes(filter) ? "default" : "outline"}
                size="sm"
                onClick={() => toggleFilter(filter)}
                className={`rounded-2xl px-5 py-2.5 font-medium transition-all duration-200 ${
                  activeFilters.includes(filter)
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/25'
                    : 'bg-white/80 border-slate-200/50 text-slate-600 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 backdrop-blur-sm'
                }`}
              >
                {filter}
              </Button>
            ))}
          </div>
        </section>

        {/* Tools Grid */}
        <section>
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl text-slate-800 font-bold">
              {searchQuery ? `Results for "${searchQuery}"` : 'Popular AI Tools'}
            </h2>
            <span className="text-slate-500 font-medium">{filteredTools.length} tools</span>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTools.map((tool) => {
              const IconComponent = tool.icon;
              return (
                <Card key={tool.id} className="border-slate-200/50 hover:shadow-xl transition-all duration-300 hover:-translate-y-2 bg-white/80 backdrop-blur-sm group">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-5">
                      <div className={`w-14 h-14 bg-gradient-to-br ${tool.color} rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                        <IconComponent className="w-7 h-7 text-white" />
                      </div>
                      <div className="flex items-center space-x-1 bg-yellow-50 px-3 py-1.5 rounded-xl">
                        <Star className="w-4 h-4 text-yellow-500 fill-current" />
                        <span className="text-sm text-yellow-700 font-medium">{tool.rating}</span>
                      </div>
                    </div>
                    
                    <h3 className="text-slate-800 mb-2 font-bold text-lg">{tool.name}</h3>
                    <p className="text-slate-600 text-sm mb-5 leading-relaxed">{tool.description}</p>
                    
                    <div className="flex items-center justify-between mb-5">
                      <div className="flex space-x-2">
                        <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700 font-medium px-3 py-1">
                          {tool.category}
                        </Badge>
                        <Badge variant="secondary" className={`text-xs font-medium px-3 py-1 ${
                          tool.isPaid ? 'bg-orange-100 text-orange-700' : 'bg-emerald-100 text-emerald-700'
                        }`}>
                          {tool.isPaid ? 'Paid' : 'Free'}
                        </Badge>
                      </div>
                    </div>
                    
                    <Button className="w-full bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white rounded-2xl h-11 font-medium shadow-lg shadow-red-500/25">
                      Open Tool
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {filteredTools.length === 0 && (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-slate-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <Search className="w-10 h-10 text-slate-400" />
              </div>
              <h3 className="text-slate-800 mb-3 font-bold text-xl">No tools found</h3>
              <p className="text-slate-600">Try adjusting your search or filters</p>
            </div>
          )}
        </section>
      </main>

      {/* Bottom Navigation (Mobile) */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-slate-200/50 md:hidden z-50">
        <div className="flex items-center justify-around py-3">
          {[
            { name: 'Home', icon: Grid3x3, active: true },
            { name: 'Chat', icon: MessageCircle, active: false },
            { name: 'Favorites', icon: Heart, active: false },
            { name: 'My Tools', icon: Zap, active: false },
            { name: 'Profile', icon: User, active: false }
          ].map((item) => {
            const IconComponent = item.icon;
            return (
              <button
                key={item.name}
                onClick={() => setActiveTab(item.name)}
                className={`flex flex-col items-center py-2 px-4 rounded-2xl transition-colors ${
                  activeTab === item.name 
                    ? 'text-blue-600 bg-blue-50' 
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <IconComponent className="w-5 h-5 mb-1" />
                <span className="text-xs font-medium">{item.name}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}