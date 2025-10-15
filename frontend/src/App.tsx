import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Search, Star, MessageCircle, Zap, Sparkles, History, X, ArrowLeft, Copy, Check, Grid3x3, Heart, User, Menu, Lightbulb, Wand2 } from 'lucide-react';
import { useNavigate } from "react-router-dom";
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { Badge } from './components/ui/badge';
import { Card, CardContent } from './components/ui/card';

import { openOAuthPopup, fetchMe, refreshSession, logout } from './auth';
import PlanMindMap from './components/ui/PlanMindMap';
import CategoryView from './pages/CategoryView';
import { ArrowRight } from 'lucide-react';

// Mapping между категории от App.tsx и cap параметри
const CATEGORY_TO_CAP_MAPPING: Record<string, string> = {
  'assistants-productivity': 'cap:text-explain',
  'text-writing': 'cap:text-edit', 
  'images-design': 'cap:image-generate',
  'video-3d': 'cap:video-generate',
  'audio-music': 'cap:voice-generate',
  'business-marketing': 'cap:research-web',
  'coding-development': 'cap:automate-workflow',
  'automation-agents': 'cap:automate-workflow',
  'data-analysis': 'cap:slide-generate',
  'education-learning': 'cap:doc-read-pdf',
  'health-wellness': 'cap:integrations',
  'specialized-niche': 'cap:integrations'
};

/* ---------- API base ---------- */
const API_BASE =
  (import.meta as any).env?.VITE_API_BASE ||
  (window as any).__API_BASE__ ||
  'http://127.0.0.1:8000';

/* ---------- Types matching backend ---------- */
type Tool = { name: string; link?: string | null; icon?: string | null };
type Group = { title: string; tools: Tool[] };
type PlanItem = { task: string; tools: Tool[] };
type PlanResponse = { goal: string; plan: PlanItem[]; groups?: Group[] };

type CurrentUser = {
  id: number;
  email: string;
  name?: string | null;
  picture?: string | null;
} | null;

/* ---------- Language and Localization ---------- */
type Language = 'en' | 'bg';

const translations = {
  en: {
    // Header
    discover: 'Discover',
    categories: 'Categories',
    learn: 'Learn',
    favorites: 'Favorites',
    signIn: 'Sign In',
    profile: 'Profile',
    signOut: 'Sign Out',
    
    // Hero
    heroTitle: 'Discover AI tools that',
    heroTitleHighlight: 'actually help',
    heroSubtitle: 'From writing essays to creating art, find the perfect AI tools for your goals.',
    inputPlaceholder: 'What do you want to achieve with AI?',
    inputExamples: 'e.g., Write better emails, create a logo, analyze data...',
    findTools: 'Find Tools',
    
    // Recent prompts
    recentPrompts: 'Recent prompts',
    clearAll: 'Clear all',
    
    // Status messages
    loading: '🔄 Finding the best tools for you...',
    errorGeneric: '⚠️ Something went wrong while fetching tools.',
    
    // Search and filters
    searchPlaceholder: 'Search tools, categories, or goals...',
    favoritesOnly: 'Favorites only',
    
    // Journey section
    journeyTitle: 'Your AI Journey',
    journeySubtitle: 'Interactive visualization of your personalized AI workflow',
    
    // Results section
    resultsTitle: 'AI Tools & Suggestions',
    resultsSubtitle: 'Detailed step-by-step guide with AI assistance',
    resultsFor: 'Results for',
    toolsFound: 'tools',
    savedCount: 'saved',
    
    // Prompt suggestion
    assistantSuggestion: 'AI Assistant Suggestion',
    copyPasteReady: 'Copy & Paste Ready',
    copy: 'Copy',
    copied: 'Copied!',
    promptHint: '💡 Copy this prompt and paste it into any AI assistant (ChatGPT, Claude, etc.) for personalized guidance on this step.',
    recommendedTools: 'recommended tools',
    
    // Mind map specific
    stepSpecificTools: 'Step-specific tools',
    sharedToolsForStep: 'Shared tools for this step',
    usedInXSteps: 'Used in {count} steps',
    uniqueTools: 'unique tools',
    sharedAcrossSteps: 'shared across steps',
    stepsTotal: 'steps total',
    
    // Tool cards
    aiTool: 'AI Tool',
    free: 'Free',
    openTool: 'Open Tool',
    noLink: 'No Link Available',
    save: 'Save',
    saved: 'Saved',
    addToFavorites: 'Add to favorites',
    removeFromFavorites: 'Remove from favorites',
    
    // Empty states
    readyTitle: 'Ready to discover AI tools?',
    readySubtitle: 'Tell us what you want to achieve and we\'ll find the perfect tools for you.',
    noToolsTitle: 'No tools found',
    noToolsSubtitle: 'Try adjusting your search or filters.',
    
    // Favorites page
    myFavorites: 'My Favorites',
    back: 'Back',
    noFavoritesTitle: 'No favorites yet',
    noFavoritesSubtitle: 'Mark tools with the star to save them here for quick access.',
    discoverTools: 'Discover Tools',
    
    // Categories page
    categoriesTitle: 'AI Tool Categories',
    categoriesSubtitle: 'Browse our comprehensive collection of AI tools organized by purpose and functionality.',
    searchCategories: 'Search categories...',
    browseCategory: 'Browse Category',
    toolsInCategory: 'tools in this category',
    totalCategories: 'Categories',
    totalTools: 'Total Tools',
    
    // Featured categories (home page)
    featuredCategories: 'Popular Categories',
    featuredCategoriesSubtitle: 'Explore the most used AI tool categories and discover what\'s possible',
    viewAllCategories: 'View All Categories',
    quickStart: 'Quick Start',
    popularTools: 'Popular Tools',
    sampleTool: 'Try Now',
    
    // Featured tools section
    featuredToolsTitle: 'Most Popular AI Tools',
    featuredToolsSubtitle: 'Start using these powerful AI tools right away - no planning needed',
    tryTool: 'Try Tool',
    mostUsed: 'Most Used',
    
    // Categories overview
    exploreCategories: 'Explore Categories',
    exploreCategoriesSubtitle: 'Browse our organized collection of AI tools by category',
    browseAllCategories: 'Browse All Categories',
    
    // Auth
    createAccount: 'Create account',
    emailPassword: 'email / password',
    signInWithGoogle: 'Sign in with Google',
    createYourAccount: 'Create your account',
    signInToAccount: 'Sign in to your account',
    yourName: 'Your name (optional)',
    email: 'Email',
    password: 'Password',
    alreadyHaveAccount: 'Already have an account?',
    dontHaveAccount: 'Don\'t have an account?',
    cancel: 'Cancel',
    orContinueWith: 'or continue with',
    google: 'Google',
    
    // Profile
    yourProfile: 'Your Profile',
    name: 'Name',
    avatarUrl: 'Avatar URL',
    saveChanges: 'Save changes',
    
    // Mobile nav
    home: 'Home',
    chat: 'Chat',
    
    // Errors
    signInFailed: 'Sign in failed. Check backend/.env and CORS.',
    signUpFailed: 'Sign up failed.',
    profileUpdateFailed: 'Profile update failed.',
    copyFailed: 'Copy failed. Please select and copy manually.',
    
    // Execution summary
    executionSummary: 'Execution Summary',
    executionSummarySubtitle: 'Quick overview of your AI workflow',
    forSteps: 'For steps',
    forStep: 'For step',
    useTheseTool: 'use this tool',
    useTheseTools: 'use these tools',
    toolRecommendation: 'Tool Recommendation',
  },
  bg: {
    // Header
    discover: 'Откриване',
    categories: 'Категории',
    learn: 'Научи',
    favorites: 'Любими',
    signIn: 'Вход',
    profile: 'Профил',
    signOut: 'Изход',
    
    // Hero
    heroTitle: 'Открийте AI инструменти, които',
    heroTitleHighlight: 'наистина помагат',
    heroSubtitle: 'От писане на есета до създаване на изкуство - намерете перфектните AI инструменти за вашите цели.',
    inputPlaceholder: 'Какво искате да постигнете с AI?',
    inputExamples: 'напр., Писане на по-добри имейли, създаване на лого, анализ на данни...',
    findTools: 'Намери инструменти',
    
    // Recent prompts
    recentPrompts: 'Последни заявки',
    clearAll: 'Изчисти всички',
    
    // Status messages
    loading: '🔄 Търсим най-добрите инструменти за теб...',
    errorGeneric: '⚠️ Възникна грешка при зареждането на инструментите.',
    
    // Search and filters
    searchPlaceholder: 'Търсене на инструменти, категории или цели...',
    favoritesOnly: 'Само любими',
    
    // Journey section
    journeyTitle: 'Вашето AI пътешествие',
    journeySubtitle: 'Интерактивна визуализация на вашия персонализиран AI работен поток',
    
    // Results section
    resultsTitle: 'AI инструменти и предложения',
    resultsSubtitle: 'Подробно стъпка по стъпка ръководство с AI помощ',
    resultsFor: 'Резултати за',
    toolsFound: 'инструмента',
    savedCount: 'запазени',
    
    // Prompt suggestion
    assistantSuggestion: 'Предложение от AI асистент',
    copyPasteReady: 'Готово за копиране',
    copy: 'Копирай',
    copied: 'Копирано!',
    promptHint: '💡 Копирайте този промпт и го поставете в някой AI асистент (ChatGPT, Claude, и др.) за персонализирано ръководство за тази стъпка.',
    recommendedTools: 'препоръчани инструмента',
    
    // Mind map specific
    stepSpecificTools: 'Инструменти за тази стъпка',
    sharedToolsForStep: 'Споделени инструменти за тази стъпка',
    usedInXSteps: 'Използван в {count} стъпки',
    uniqueTools: 'уникални инструмента',
    sharedAcrossSteps: 'споделени между стъпките',
    stepsTotal: 'стъпки общо',
    
    // Tool cards
    aiTool: 'AI инструмент',
    free: 'Безплатен',
    openTool: 'Отвори инструмент',
    noLink: 'Няма наличен линк',
    save: 'Запази',
    saved: 'Запазено',
    addToFavorites: 'Добави в любими',
    removeFromFavorites: 'Премахни от любими',
    
    // Empty states
    readyTitle: 'Готови да откриваме AI инструменти?',
    readySubtitle: 'Кажете ни какво искате да постигнете и ще намерим перфектните инструменти за вас.',
    noToolsTitle: 'Няма намерени инструменти',
    noToolsSubtitle: 'Опитайте да промените търсенето или филтрите.',
    
    // Favorites page
    myFavorites: 'Моите любими',
    back: 'Назад',
    noFavoritesTitle: 'Още няма любими',
    noFavoritesSubtitle: 'Маркирайте инструменти със звездичката, за да ги запазите тук за бърз достъп.',
    discoverTools: 'Открий инструменти',
    
    // Categories page
    categoriesTitle: 'AI Категории Инструменти',
    categoriesSubtitle: 'Разгледайте нашата обширна колекция от AI инструменти, организирани по предназначение и функционалност.',
    searchCategories: 'Търсене в категории...',
    browseCategory: 'Разгледай категория',
    toolsInCategory: 'инструмента в тази категория',
    totalCategories: 'Категории',
    totalTools: 'Общо инструменти',
    
    // Featured categories (home page)
    featuredCategories: 'Популярни категории',
    featuredCategoriesSubtitle: 'Разгледайте най-използваните AI категории и открийте какво е възможно',
    viewAllCategories: 'Виж всички категории',
    quickStart: 'Бърз старт',
    popularTools: 'Популярни инструменти',
    sampleTool: 'Пробвай сега',
    
    // Featured tools section
    featuredToolsTitle: 'Най-популярни AI инструменти',
    featuredToolsSubtitle: 'Започнете да използвате тези мощни AI инструменти веднага - без нужда от планиране',
    tryTool: 'Пробвай инструмент',
    mostUsed: 'Най-използван',
    
    // Categories overview
    exploreCategories: 'Разгледай категории',
    exploreCategoriesSubtitle: 'Прегледайте нашата организирана колекция от AI инструменти по категории',
    browseAllCategories: 'Разгледай всички категории',
    
    // Auth
    createAccount: 'Създай профил',
    emailPassword: 'имейл / парола',
    signInWithGoogle: 'Вход с Google',
    createYourAccount: 'Създайте вашия профил',
    signInToAccount: 'Влезте в профила си',
    yourName: 'Вашето име (по избор)',
    email: 'Имейл',
    password: 'Парола',
    alreadyHaveAccount: 'Вече имате профил?',
    dontHaveAccount: 'Нямате профил?',
    cancel: 'Отказ',
    orContinueWith: 'или продължете с',
    google: 'Google',
    
    // Profile
    yourProfile: 'Вашият профил',
    name: 'Име',
    avatarUrl: 'URL на аватар',
    saveChanges: 'Запази промените',
    
    // Mobile nav
    home: 'Начало',
    chat: 'Чат',
    
    // Errors
    signInFailed: 'Неуспешен вход. Проверете backend/.env и CORS.',
    signUpFailed: 'Неуспешна регистрация.',
    profileUpdateFailed: 'Неуспешно актуализиране на профила.',
    copyFailed: 'Неуспешно копиране. Моля, селектирайте и копирайте ръчно.',
    
    // Execution summary
    executionSummary: 'Изпълнителен преглед',
    executionSummarySubtitle: 'Бърз преглед на вашия AI работен поток',
    forSteps: 'За стъпки',
    forStep: 'За стъпка',
    useTheseTool: 'използвайте този инструмент',
    useTheseTools: 'използвайте тези инструменти',
    toolRecommendation: 'Препоръка за инструменти',
  }
};

// Language detection function
function detectLanguage(text: string): Language {
  if (!text || text.trim().length < 3) return 'en';
  
  // Bulgarian characters detection
  const bulgarianChars = /[а-я]/gi;
  const bulgarianMatches = text.match(bulgarianChars);
  const bulgarianRatio = bulgarianMatches ? bulgarianMatches.length / text.length : 0;
  
  // If more than 20% of characters are Cyrillic, consider it Bulgarian
  return bulgarianRatio > 0.2 ? 'bg' : 'en';
}

/* ---------- Favorites v2 (persist full tool) ---------- */
type FavTool = { name: string; icon?: string | null; link?: string | null };
const FAVS_V2_KEY = 'myai:favs_v2';
const FAVS_V1_KEY = 'myai:favs';

/* ---------- Recent prompts ---------- */
const RECENT_KEY = 'myai:recent_prompts';
const RECENT_MAX = 6;

/* ---------- Language preference ---------- */
const LANGUAGE_KEY = 'myai:language';

/* ---------- Featured Tools Data ---------- */
const getFeaturedTools = (language: Language) => [
  {
    name: 'ChatGPT',
    link: 'https://chat.openai.com',
    description: language === 'bg' ? 'Най-популярният AI чатбот за разговори и помощ' : 'Most popular AI chatbot for conversations and assistance',
    category: language === 'bg' ? 'Текст и разговори' : 'Text & Chat',
    gradient: 'from-green-500 to-emerald-600',
    icon: '🤖'
  },
  {
    name: 'Midjourney',
    link: 'https://midjourney.com',
    description: language === 'bg' ? 'Водещ AI инструмент за генериране на изображения' : 'Leading AI tool for image generation',
    category: language === 'bg' ? 'Изображения' : 'Images',
    gradient: 'from-purple-500 to-pink-600',
    icon: '🎨'
  },
  {
    name: 'Claude',
    link: 'https://claude.ai',
    description: language === 'bg' ? 'Интелигентен AI асистент от Anthropic' : 'Intelligent AI assistant by Anthropic',
    category: language === 'bg' ? 'Текст и анализ' : 'Text & Analysis',
    gradient: 'from-blue-500 to-indigo-600',
    icon: '💬'
  },
  {
    name: 'DALL-E',
    link: 'https://openai.com/dall-e-2',
    description: language === 'bg' ? 'AI генератор на изображения от OpenAI' : 'AI image generator by OpenAI',
    category: language === 'bg' ? 'Изображения' : 'Images',
    gradient: 'from-orange-500 to-red-600',
    icon: '🖼️'
  },
  {
    name: 'GitHub Copilot',
    link: 'https://github.com/features/copilot',
    description: language === 'bg' ? 'AI помощник за програмиране' : 'AI programming assistant',
    category: language === 'bg' ? 'Кодиране' : 'Coding',
    gradient: 'from-slate-600 to-gray-700',
    icon: '💻'
  },
  {
    name: 'Canva AI',
    link: 'https://canva.com',
    description: language === 'bg' ? 'AI инструменти за дизайн и креативност' : 'AI tools for design and creativity',
    category: language === 'bg' ? 'Дизайн' : 'Design',
    gradient: 'from-cyan-500 to-blue-600',
    icon: '✨'
  }
];

/* ---------- Featured Categories Data ---------- */
const getFeaturedCategories = (language: Language) => [
  {
    id: 'text-writing',
    emoji: '✏️',
    label: language === 'bg' ? 'Генерация на текст' : 'Text Generation',
    description: language === 'bg' ? 'Създаване и редактиране на текстово съдържание' : 'Create and edit written content',
    gradient: 'from-emerald-500 to-teal-600',
    tools: [
      { name: 'ChatGPT', link: 'https://chat.openai.com', description: language === 'bg' ? 'Най-популярният AI чатбот' : 'Most popular AI chatbot' },
      { name: 'Claude', link: 'https://claude.ai', description: language === 'bg' ? 'Помощник от Anthropic' : 'Assistant by Anthropic' },
      { name: 'Grammarly', link: 'https://grammarly.com', description: language === 'bg' ? 'Проверка на граматика' : 'Grammar checking' }
    ]
  },
  {
    id: 'images-design',
    emoji: '🎨',
    label: language === 'bg' ? 'Изображения и дизайн' : 'Images & Design',
    description: language === 'bg' ? 'Генериране и редактиране на визуално съдържание' : 'Generate and edit visual content',
    gradient: 'from-purple-500 to-pink-600',
    tools: [
      { name: 'Midjourney', link: 'https://midjourney.com', description: language === 'bg' ? 'AI генерация на изображения' : 'AI image generation' },
      { name: 'DALL-E', link: 'https://openai.com/dall-e-2', description: language === 'bg' ? 'Изкуство от OpenAI' : 'Art by OpenAI' },
      { name: 'Canva AI', link: 'https://canva.com', description: language === 'bg' ? 'Дизайн помощник' : 'Design assistant' }
    ]
  },
  {
    id: 'assistants-productivity',
    emoji: '🤖',
    label: language === 'bg' ? 'Продуктивност' : 'Productivity',
    description: language === 'bg' ? 'Инструменти за повишаване на ефективността' : 'Tools to boost your efficiency',
    gradient: 'from-blue-500 to-indigo-600',
    tools: [
      { name: 'Notion AI', link: 'https://notion.so', description: language === 'bg' ? 'Умни бележки' : 'Smart notes' },
      { name: 'Jasper', link: 'https://jasper.ai', description: language === 'bg' ? 'Маркетинг копирайтинг' : 'Marketing copywriting' },
      { name: 'Copy.ai', link: 'https://copy.ai', description: language === 'bg' ? 'Генериране на съдържание' : 'Content generation' }
    ]
  },
  {
    id: 'video-3d',
    emoji: '🎬',
    label: language === 'bg' ? 'Видео и 3D' : 'Video & 3D',
    description: language === 'bg' ? 'Създаване на видео и 3D съдържание' : 'Create video and 3D content',
    gradient: 'from-red-500 to-orange-600',
    tools: [
      { name: 'RunwayML', link: 'https://runwayml.com', description: language === 'bg' ? 'AI видео редактиране' : 'AI video editing' },
      { name: 'Synthesia', link: 'https://synthesia.io', description: language === 'bg' ? 'AI видео презентации' : 'AI video presentations' },
      { name: 'Luma AI', link: 'https://lumalabs.ai', description: language === 'bg' ? '3D генериране' : '3D generation' }
    ]
  },
  {
    id: 'coding-development',
    emoji: '💻',
    label: language === 'bg' ? 'Кодиране' : 'Coding',
    description: language === 'bg' ? 'Помощници за програмиране' : 'Programming assistants',
    gradient: 'from-slate-600 to-gray-700',
    tools: [
      { name: 'GitHub Copilot', link: 'https://github.com/features/copilot', description: language === 'bg' ? 'AI програмиране' : 'AI programming' },
      { name: 'Cursor', link: 'https://cursor.sh', description: language === 'bg' ? 'AI редактор на код' : 'AI code editor' },
      { name: 'Replit', link: 'https://replit.com', description: language === 'bg' ? 'AI програмна среда' : 'AI coding environment' }
    ]
  },
  {
    id: 'audio-music',
    emoji: '🎵',
    label: language === 'bg' ? 'Аудио и музика' : 'Audio & Music',
    description: language === 'bg' ? 'Генериране на звук и музика' : 'Generate sound and music',
    gradient: 'from-amber-500 to-yellow-600',
    tools: [
      { name: 'ElevenLabs', link: 'https://elevenlabs.io', description: language === 'bg' ? 'AI глас синтез' : 'AI voice synthesis' },
      { name: 'Mubert', link: 'https://mubert.com', description: language === 'bg' ? 'AI музика' : 'AI music' },
      { name: 'Suno', link: 'https://suno.ai', description: language === 'bg' ? 'Генериране на песни' : 'Song generation' }
    ]
  }
];

/* ---------- Helpers ---------- */
function groupsFromPlanFallback(plan: PlanItem[]): Group[] {
  const byTitle = new Map<string, Map<string, Tool>>();
  for (const p of plan) {
    const title = p.task;
    const bucket = byTitle.get(title) ?? new Map<string, Tool>();
    for (const t of p.tools) bucket.set(t.name, t);
    byTitle.set(title, bucket);
  }
  return Array.from(byTitle.entries()).map(([title, bucket]) => ({
    title,
    tools: Array.from(bucket.values()),
  }));
}

// Enhanced suggested prompt builder with language support and step-specific context
function buildStepPrompt(goal: string, stepTitle: string, tools: Tool[], language: Language) {
  const isBg = language === 'bg';
  
  // Normalize goal and step for analysis
  const stepLower = stepTitle.toLowerCase();
  const goalLower = goal.toLowerCase();
  
  // Create placeholder for user's specific context
  const goalPlaceholder = goal || (isBg ? '[вашата цел/продукт/услуга]' : '[your goal/product/service]');
  
  // Generate specific, actionable prompts based on step content
  let actionablePrompt = '';
  
  // Research steps
  if (stepLower.includes('изследв') || stepLower.includes('проуч') || stepLower.includes('research') || 
      stepLower.includes('анализ') || stepLower.includes('analyze') || stepLower.includes('аудитория')) {
    
    if (stepLower.includes('аудитория') || stepLower.includes('audience') || stepLower.includes('конкурент') || stepLower.includes('competitor')) {
      actionablePrompt = isBg 
        ? `Направи подробно проучване на целевата аудитория за ${goalPlaceholder}, като включиш демографски данни, психографски характеристики, поведенчески модели и основни болки/желания. След това анализирай конкурентите (местни и международни), опиши техните силни и слаби страни, ценова политика, канали за комуникация и уникално предложение. Завърши с препоръки как моят бизнес може да се отличи.`
        : `Conduct detailed research on the target audience for ${goalPlaceholder}, including demographic data, psychographic characteristics, behavioral patterns, and main pain points/desires. Then analyze competitors (local and international), describe their strengths and weaknesses, pricing policy, communication channels, and unique value proposition. End with recommendations on how my business can differentiate itself.`;
    } else if (stepLower.includes('пазар') || stepLower.includes('market') || stepLower.includes('тенденци') || stepLower.includes('trend')) {
      actionablePrompt = isBg 
        ? `Анализирай пазарните тенденции и възможности за ${goalPlaceholder}. Проучи размера на пазара, темповете на растеж, ключовите играчи, регулаторните изисквания и технологичните промени. Идентифицирай нишови сегменти, неудовлетворени нужди и бъдещи възможности. Предостави конкретни данни, статистики и източници, и завърши с препоръки за пазарно позициониране.`
        : `Analyze market trends and opportunities for ${goalPlaceholder}. Research market size, growth rates, key players, regulatory requirements, and technological changes. Identify niche segments, unmet needs, and future opportunities. Provide specific data, statistics, and sources, and conclude with market positioning recommendations.`;
    } else {
      actionablePrompt = isBg 
        ? `Проведи задълбочено изследване за ${goalPlaceholder}. Събери актуална информация от надеждни sources, анализирай най-добрите практики в индустрията, идентифицирай ключовите успешни фактори и потенциалните рискове. Създай структуриран доклад с основни находки, статистики и препоръки за следващи стъпки.`
        : `Conduct in-depth research on ${goalPlaceholder}. Gather current information from reliable sources, analyze industry best practices, identify key success factors and potential risks. Create a structured report with key findings, statistics, and recommendations for next steps.`;
    }
  }
  
  // Creative/Design steps
  else if (stepLower.includes('създа') || stepLower.includes('генерир') || stepLower.includes('create') || 
           stepLower.includes('дизайн') || stepLower.includes('design') || stepLower.includes('концепци') || stepLower.includes('concept')) {
    
    if (stepLower.includes('лого') || stepLower.includes('logo') || stepLower.includes('бранд') || stepLower.includes('brand')) {
      actionablePrompt = isBg 
        ? `Създай концепция за лого и визуална идентичност за ${goalPlaceholder}. Опиши 3-5 различни дизайнерски посоки, включително цветова палитра, типография, стил и настроение. За всяка концепция обясни символиката, психологическото въздействие и как отразява стойностите на бранда. Добави препоръки за приложение на различни носители (уеб, печат, социални мрежи) и файлови формати за изпълнение.`
        : `Create a logo and visual identity concept for ${goalPlaceholder}. Describe 3-5 different design directions, including color palette, typography, style, and mood. For each concept, explain the symbolism, psychological impact, and how it reflects the brand values. Add recommendations for application across different media (web, print, social media) and file formats for execution.`;
    } else if (stepLower.includes('контент') || stepLower.includes('content') || stepLower.includes('материал') || stepLower.includes('кампан') || stepLower.includes('campaign')) {
      actionablePrompt = isBg 
        ? `Създай набор от маркетингови материали за ${goalPlaceholder}, включително: слоган, ключови послания, текстове за социални мрежи, имейл кампании и кратко видео-сценарий. Материалите трябва да са съобразени с целевата аудитория, да подчертават уникалното предложение и да предизвикват емоция и ангажираност. Дай ми и предложение за рекламни кампании с конкретни канали (Facebook, Instagram, Google Ads, TikTok и др.), бюджети и очаквани резултати.`
        : `Create a set of marketing materials for ${goalPlaceholder}, including: slogan, key messages, social media copy, email campaigns, and a short video script. Materials should be tailored to the target audience, highlight the unique value proposition, and evoke emotion and engagement. Also provide advertising campaign suggestions with specific channels (Facebook, Instagram, Google Ads, TikTok, etc.), budgets, and expected results.`;
    } else {
      actionablePrompt = isBg 
        ? `Разработи креативна концепция за ${goalPlaceholder}. Създай 3 различни варианта с подробно описание на визуалните елементи, цветова схема, стил и настроение. За всеки вариант обясни целевата аудитория, ключовите съобщения и очакваното въздействие. Включи конкретни препоръки за изпълнение, необходими ресурси и време за реализация.`
        : `Develop a creative concept for ${goalPlaceholder}. Create 3 different variants with detailed description of visual elements, color scheme, style, and mood. For each variant, explain the target audience, key messages, and expected impact. Include specific implementation recommendations, required resources, and timeline for execution.`;
    }
  }
  
  // Strategy/Planning steps
  else if (stepLower.includes('план') || stepLower.includes('стратег') || stepLower.includes('plan') || 
           stepLower.includes('strategy') || stepLower.includes('органи') || stepLower.includes('organize')) {
    
    actionablePrompt = isBg 
      ? `Създай детайлен стратегически план за ${goalPlaceholder}. Включи: конкретни цели с времеви рамки, необходими ресурси и бюджет, ключови дейности и милестъни, отговорни лица/роли, потенциални рискове и мерки за тяхното минимизиране. Добави KPI метрики за измерване на прогреса и план за редовно ревю и актуализация на стратегията.`
      : `Create a detailed strategic plan for ${goalPlaceholder}. Include: specific goals with timelines, required resources and budget, key activities and milestones, responsible persons/roles, potential risks and mitigation measures. Add KPI metrics for measuring progress and a plan for regular review and strategy updates.`;
  }
  
  // Implementation/Execution steps
  else if (stepLower.includes('изпълн') || stepLower.includes('реализ') || stepLower.includes('implement') || 
           stepLower.includes('execute') || stepLower.includes('build') || stepLower.includes('develop')) {
    
    actionablePrompt = isBg 
      ? `Създай подробен план за изпълнение на ${goalPlaceholder}. Разбий процеса на конкретни задачи със срокове, дефинирай необходимите ресурси и инструменти, създай времева линия с критични моменти. Включи контролни точки за качество, възможни препятствия и алтернативни решения. Добави препоръки за екип, бюджет и методи за проследяване на напредъка.`
      : `Create a detailed execution plan for ${goalPlaceholder}. Break down the process into specific tasks with deadlines, define required resources and tools, create a timeline with critical moments. Include quality checkpoints, possible obstacles, and alternative solutions. Add recommendations for team, budget, and progress tracking methods.`;
  }
  
  // Testing/Validation steps
  else if (stepLower.includes('тест') || stepLower.includes('провер') || stepLower.includes('test') || 
           stepLower.includes('validate') || stepLower.includes('оценк') || stepLower.includes('evaluate')) {
    
    actionablePrompt = isBg 
      ? `Създай план за тестване и валидация на ${goalPlaceholder}. Дефинирай конкретни критерии за успех, методи за тестване (A/B тестове, потребителски интервюта, пилотни програми), необходими инструменти и метрики. Опиши как да събираш и анализираш обратната връзка, как да итерираш базирано на резултатите и какви корекции да правиш преди финалното пускане.`
      : `Create a testing and validation plan for ${goalPlaceholder}. Define specific success criteria, testing methods (A/B tests, user interviews, pilot programs), required tools and metrics. Describe how to collect and analyze feedback, how to iterate based on results, and what corrections to make before final launch.`;
  }
  
  // Launch/Finalization steps
  else if (stepLower.includes('пуска') || stepLower.includes('лансир') || stepLower.includes('launch') || 
           stepLower.includes('финализир') || stepLower.includes('завърш') || stepLower.includes('complete') ||
           stepLower.includes('публик') || stepLower.includes('publish')) {
    
    actionablePrompt = isBg 
      ? `Направи план за лансиране на ${goalPlaceholder}, включително времева линия, стъпки по подготовка, съдържателен календар за социалните мрежи, PR стратегия и възможни партньорства/инфлуенсъри. Опиши как да синхронизирам онлайн и офлайн дейностите, как да изградя очакване преди лансирането и как да постигна максимална видимост в първите 30 дни.`
      : `Create a launch plan for ${goalPlaceholder}, including timeline, preparation steps, social media content calendar, PR strategy, and potential partnerships/influencers. Describe how to synchronize online and offline activities, how to build anticipation before launch, and how to achieve maximum visibility in the first 30 days.`;
  }
  
  // Monitoring/Optimization steps
  else if (stepLower.includes('мониторинг') || stepLower.includes('следен') || stepLower.includes('monitor') || 
           stepLower.includes('анализ') || stepLower.includes('подобр') || stepLower.includes('optimize') ||
           stepLower.includes('резултат') || stepLower.includes('result')) {
    
    actionablePrompt = isBg 
      ? `Предложи система за мониторинг на резултатите от ${goalPlaceholder}. Опиши кои KPI да следя (трафик, конверсии, CAC, ROI, ангажираност, отзиви), какви инструменти да използвам (Google Analytics, Meta Ads Manager, CRM и др.), как да анализирам данните и какви стъпки за оптимизация мога да предприема. Добави и конкретни идеи за A/B тестове, за да подобря ефективността.`
      : `Suggest a system for monitoring results from ${goalPlaceholder}. Describe which KPIs to track (traffic, conversions, CAC, ROI, engagement, reviews), what tools to use (Google Analytics, Meta Ads Manager, CRM, etc.), how to analyze data, and what optimization steps I can take. Also add specific A/B test ideas to improve effectiveness.`;
  }
  
  // Generic fallback
  else {
    actionablePrompt = isBg 
      ? `Създай детайлен plan за "${stepTitle}" в контекста на ${goalPlaceholder}. Включи конкретни стъпки за изпълнение, необходими ресурси и инструменти, времеви рамки, потенциални предизвикателства и как да ги преодолеем. Добави измерими цели, критерии за успех и план за проследяване на прогреса.`
      : `Create a detailed plan for "${stepTitle}" in the context of ${goalPlaceholder}. Include specific execution steps, required resources and tools, timelines, potential challenges and how to overcome them. Add measurable goals, success criteria, and a progress tracking plan.`;
  }
  
  // Add tool-specific guidance if tools are available
  if (tools.length > 0) {
    const toolNames = tools.map(t => t.name).join(', ');
    const toolGuidance = isBg 
      ? `\n\nПри работата използвай следните инструменти: ${toolNames}. За всеки инструмент обясни как точно да го използвам за тази задача, какви функции са най-полезни и как да постигна най-добри резултати.`
      : `\n\nUse these tools in your work: ${toolNames}. For each tool, explain exactly how to use it for this task, which features are most useful, and how to achieve the best results.`;
    actionablePrompt += toolGuidance;
  }
  
  return actionablePrompt;
}

// read a cookie by name (for XSRF)
function getCookie(name: string) {
  const parts = document.cookie ? document.cookie.split('; ') : [];
  for (const part of parts) {
    const eq = part.indexOf('=');
    const key = decodeURIComponent(eq > -1 ? part.slice(0, eq) : part);
    if (key === name) {
      const val = eq > -1 ? part.slice(eq + 1) : '';
      return decodeURIComponent(val);
    }
  }
  return null;
}

/* ---------- Simple hash router ---------- */
type View = 'home' | 'favorites' | 'categories'| 'category';
function getViewFromHash(): View {
  const h = window.location.hash;
  if (h === '#/favorites') return 'favorites';
  if (h === '#/categories') return 'categories';
  if (h.startsWith('#/categories/')) return 'category';
  return 'home';
}

function CategoryViewWrapper({ language }: { language: Language }) {
  const hash = window.location.hash;
  let cap = '';
  if (hash.startsWith('#/categories/')) {
    const pathPart = hash.substring('#/categories/'.length);
    cap = decodeURIComponent(pathPart);
  }
  return <CategoryView cap={cap} language={language} />;
}

function goFavorites() {
  if (window.location.hash !== '#/favorites') window.location.hash = '#/favorites';
}
function goCategories() {
  if (window.location.hash !== '#/categories') window.location.hash = '#/categories';
}

export default function App() {
  const [view, setView] = useState<View>(getViewFromHash());
  const [activeTab, setActiveTab] = useState('Home');
  const [language, setLanguage] = useState<Language>('en');

  const [searchQuery, setSearchQuery] = useState('');
  const [chatInput, setChatInput] = useState('');
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<CurrentUser>(null);

  // >>> store last goal for visual plan + prompts
  const [lastGoal, setLastGoal] = useState<string>('');

  // dropdowns
  const [signinOpen, setSigninOpen] = useState(false);
  const signinRef = useRef<HTMLDivElement>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Email modal
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [authMode, setAuthMode] = useState<'signup' | 'signin'>('signup');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [authSubmitting, setAuthSubmitting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Profile modal
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profName, setProfName] = useState('');
  const [profPic, setProfPic] = useState('');
  const [profSaving, setProfSaving] = useState(false);

  // Favorites v2 (map by name)
  const [favs, setFavs] = useState<Map<string, FavTool>>(new Map());
  const [showFavsOnly, setShowFavsOnly] = useState(false);

  // Recent prompts
  const [recents, setRecents] = useState<string[]>([]);

  // Get translation function (memoized to prevent re-renders)
  const t = useCallback((key: keyof typeof translations.en) => translations[language][key], [language]);

  // Memoize the onOpenTool callback to prevent re-renders
  const handleOpenTool = useCallback((tool: Tool) => {
    if (tool.link) {
      window.open(tool.link, '_blank', 'noreferrer,noopener');
    }
  }, []);

  // Memoize the buildPrompt callback to prevent re-renders
  const buildPromptCallback = useCallback(({ goal, stepTitle, tools }: { goal: string; stepTitle: string; tools: Tool[] }) => 
    buildStepPrompt(goal, stepTitle, tools, language)
  , [language]);

  // ---- hash router listener ----
  useEffect(() => {
    const onHash = () => setView(getViewFromHash());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  // Load saved language preference
  useEffect(() => {
    try {
      const savedLang = localStorage.getItem(LANGUAGE_KEY) as Language;
      if (savedLang && (savedLang === 'en' || savedLang === 'bg')) {
        setLanguage(savedLang);
      }
    } catch {}
  }, []);

  // Language saver without timeout to prevent race conditions
  const saveLanguage = useCallback((lang: Language) => {
    if (language !== lang) {
      setLanguage(lang);
      try {
        localStorage.setItem(LANGUAGE_KEY, lang);
      } catch {}
    }
  }, [language]);

  // click outside for dropdowns
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (signinRef.current && !signinRef.current.contains(e.target as Node)) setSigninOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
    };
    document.addEventListener('click', onDocClick, true);
    return () => document.removeEventListener('click', onDocClick, true);
  }, []);

  // load favorites
  useEffect(() => {
    try {
      const v2raw = localStorage.getItem(FAVS_V2_KEY);
      if (v2raw) {
        const arr: FavTool[] = JSON.parse(v2raw) || [];
        setFavs(new Map(arr.map((t) => [t.name, t])));
      } else {
        const v1raw = localStorage.getItem(FAVS_V1_KEY);
        if (v1raw) {
          const names: string[] = JSON.parse(v1raw) || [];
          const arr: FavTool[] = names.map((name) => ({ name }));
          localStorage.setItem(FAVS_V2_KEY, JSON.stringify(arr));
          localStorage.removeItem(FAVS_V1_KEY);
          setFavs(new Map(arr.map((t) => [t.name, t])));
        }
      }
    } catch {}
  }, []);

  function saveFavs(next: Map<string, FavTool>) {
    setFavs(new Map(next));
    try {
      localStorage.setItem(FAVS_V2_KEY, JSON.stringify(Array.from(next.values())));
    } catch {}
  }

  function toggleFav(tool: Tool | FavTool) {
    const next = new Map(favs);
    if (next.has(tool.name)) next.delete(tool.name);
    else next.set(tool.name, { name: tool.name, icon: (tool as any).icon, link: (tool as any).link });
    saveFavs(next);
  }

  // load recents
  useEffect(() => {
    try {
      const raw = localStorage.getItem(RECENT_KEY);
      if (raw) setRecents(JSON.parse(raw));
    } catch {}
  }, []);

  function pushRecent(prompt: string) {
    const p = prompt.trim();
    if (!p) return;
    const next = [p, ...recents.filter((r) => r !== p)].slice(0, RECENT_MAX);
    setRecents(next);
    try {
      localStorage.setItem(RECENT_KEY, JSON.stringify(next));
    } catch {}
  }

  function removeRecent(prompt: string) {
    const next = recents.filter((r) => r !== prompt);
    setRecents(next);
    try {
      localStorage.setItem(RECENT_KEY, JSON.stringify(next));
    } catch {}
  }

  function clearRecents() {
    setRecents([]);
    try {
      localStorage.removeItem(RECENT_KEY);
    } catch {}
  }

  // Fixed fetchPlan function with cache busting and language parameter
  async function fetchPlan(prompt: string): Promise<PlanResponse> {
    const timestamp = Date.now();
    const res = await fetch(`${API_BASE}/plan?t=${timestamp}`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      },
      body: JSON.stringify({ 
        user_goal: prompt,
        language: language // Send language parameter to backend
      }),
    });
    if (!res.ok) throw new Error('Failed to fetch tools from backend');
    return res.json();
  }

  // Fixed handleFindTools function
  const handleFindTools = useCallback(async (fromPrompt?: string) => {
    const prompt = (fromPrompt ?? chatInput).trim();
    if (!prompt) return;
    
    // Clear previous results immediately
    setGroups([]);
    setLastGoal('');
    setLoading(true);
    setError(null);
    
    try {
      // Detect language and save immediately (no timeout)
      const detectedLang = detectLanguage(prompt);
      saveLanguage(detectedLang);
      
      const data = await fetchPlan(prompt);
      const grouped = data.groups && data.groups.length ? data.groups : groupsFromPlanFallback(data.plan);
      
      setGroups(grouped);
      setLastGoal(data.goal || prompt);
      pushRecent(prompt);
      
      // Clear input after successful search
      if (!fromPrompt) {
        setChatInput('');
      }
    } catch (e) {
      console.error('Error fetching plan:', e);
      setError(language === 'bg' ? '⚠️ Възникна грешка при зареждането на инструментите.' : '⚠️ Something went wrong while fetching tools.');
    } finally {
      setLoading(false);
    }
  }, [chatInput, saveLanguage, language]);

  // ------- Auth (cookie session) -------
  async function handleGoogleSignIn() {
    try {
      const { user } = await openOAuthPopup('google');
      setCurrentUser(user);
      setError(null);
    } catch (e) {
      console.error(e);
      setError(t('signInFailed'));
    }
  }

  async function handleSignOut() {
    try {
      await logout();
    } catch (e) {
      console.warn('Logout error:', e);
    }
    setCurrentUser(null);
  }

  async function submitEmailAuth() {
    setAuthSubmitting(true);
    setAuthError(null);
    setError(null);
    try {
      const url = authMode === 'signup' ? `${API_BASE}/auth/register` : `${API_BASE}/auth/login`;
      const res = await fetch(url, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: authEmail,
          password: authPassword,
          name: authMode === 'signup' ? authName : undefined,
        }),
      });

      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || `HTTP ${res.status}`);
      }

      const data = await res.json();
      setCurrentUser(data.user);
      setShowEmailModal(false);
      setAuthEmail('');
      setAuthPassword('');
      setAuthName('');
    } catch (e: any) {
      console.error(e);
      setAuthError(authMode === 'signup' ? t('signUpFailed') : t('signInFailed'));
    } finally {
      setAuthSubmitting(false);
    }
  }

  // Profile modal open
  function openProfile() {
    if (!currentUser) return;
    setProfName(currentUser.name ?? '');
    setProfPic(currentUser.picture ?? '');
    setShowProfileModal(true);
    setProfileOpen(false);
  }

  // Save profile (PATCH /auth/me)
  async function saveProfile() {
    if (!currentUser) return;
    setProfSaving(true);
    setError(null);
    try {
      const xsrf = getCookie('XSRF-TOKEN');
      const res = await fetch(`${API_BASE}/auth/me`, {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(xsrf ? { 'X-XSRF-TOKEN': xsrf } : {}),
        },
        body: JSON.stringify({ name: profName, picture: profPic }),
      });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || 'Update failed');
      }
      const user = await res.json();
      setCurrentUser(user);
      setShowProfileModal(false);
    } catch (e) {
      console.error(e);
      setError(t('profileUpdateFailed'));
    } finally {
      setProfSaving(false);
    }
  }

  // auto-load session
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const u = await fetchMe();
        if (mounted) setCurrentUser(u);
      } catch {
        try {
          await refreshSession();
          const u2 = await fetchMe();
          if (mounted) setCurrentUser(u2);
        } catch {
          if (mounted) setCurrentUser(null);
        }
      }
    })();
    return () => { mounted = false; };
  }, []);

  // Filtering logic
  const term = searchQuery.trim().toLowerCase();
  const filteredGroups: Group[] = groups
    .map((g) => ({
      title: g.title,
      tools: g.tools.filter((t) => {
        const match = !term || g.title.toLowerCase().includes(term) || (t.name ?? '').toLowerCase().includes(term);
        const favOk = !showFavsOnly || favs.has(t.name);
        return match && favOk;
      }),
    }))
    .filter((g) => g.tools.length > 0);

  const favCount = favs.size;

  // Stable input change handler
  const handleChatInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setChatInput(e.target.value);
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleFindTools();
    }
  }, [handleFindTools]);

  // >>> NEW: истински Home reset + навигация
  const handleGoHome = useCallback(() => {
    if (window.location.hash !== '#/') {
      window.location.hash = '#/';
    }
    setView('home');
    setGroups([]);
    setSearchQuery('');
    setChatInput('');
    setLastGoal('');
    setShowFavsOnly(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200/50">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-3 cursor-pointer" onClick={handleGoHome}>
              <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/25">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl text-slate-800 font-semibold">My AI</span>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-8">
              <button 
                onClick={handleGoHome} 
                className={`font-medium transition-colors ${view === 'home' ? 'text-blue-600' : 'text-slate-600 hover:text-blue-600'}`}
              >
                {t('discover')}
              </button>
              <button 
                onClick={goCategories} 
                className={`font-medium transition-colors ${view === 'categories' ? 'text-blue-600' : 'text-slate-600 hover:text-blue-600'}`}
              >
                {t('categories')}
              </button>
              <a href="#" className="text-slate-600 hover:text-blue-600 font-medium transition-colors">{t('learn')}</a>

              {/* Favorites */}
              <button
                onClick={goFavorites}
                className={`inline-flex items-center gap-2 font-medium transition-colors ${
                  view === 'favorites' ? 'text-blue-600' : 'text-slate-700 hover:text-blue-600'
                }`}
                title={t('favorites')}
              >
                <Star className={`w-4 h-4 ${favCount ? 'fill-yellow-400 text-yellow-500' : ''}`} />
                <span className="hidden lg:inline">{t('favorites')}</span>
                <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-full">{favCount}</span>
              </button>

              {/* Language Switch */}
              <div className="flex items-center space-x-1 bg-slate-100 rounded-lg p-1">
                <button
                  onClick={() => saveLanguage('en')}
                  className={`px-2 py-1 text-sm font-medium rounded transition-all ${
                    language === 'en' 
                      ? 'bg-white text-slate-900 shadow-sm' 
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  EN
                </button>
                <button
                  onClick={() => saveLanguage('bg')}
                  className={`px-2 py-1 text-sm font-medium rounded transition-all ${
                    language === 'bg' 
                      ? 'bg-white text-slate-900 shadow-sm' 
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  БГ
                </button>
              </div>

              {/* Auth section */}
              {currentUser ? (
                <div className="relative" ref={profileRef}>
                  <button 
                    onClick={() => setProfileOpen(!profileOpen)} 
                    className="flex items-center gap-2 hover:bg-slate-50 p-2 rounded-xl transition-colors" 
                    title={currentUser.email}
                  >
                    {currentUser.picture ? (
                      <img 
                        src={currentUser.picture} 
                        alt="avatar" 
                        className="w-8 h-8 rounded-full border border-slate-200" 
                        referrerPolicy="no-referrer" 
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-blue-200" />
                    )}
                    <span className="text-slate-700 font-medium max-w-[120px] truncate hidden lg:block">
                      {currentUser.name || currentUser.email}
                    </span>
                  </button>
                  {profileOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200/60 p-1 z-50">
                      <button onClick={openProfile} className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-50 transition-colors">
                        {t('profile')}
                      </button>
                      <div className="my-1 border-t border-slate-100" />
                      <button onClick={handleSignOut} className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-50 transition-colors text-red-600">
                        {t('signOut')}
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="relative" ref={signinRef}>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setSigninOpen(!signinOpen)} 
                    className="border-blue-300 text-blue-600 hover:bg-blue-50 font-medium"
                  >
                    {t('signIn')}
                  </Button>
                  {signinOpen && (
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-slate-200/60 p-1 z-50">
                      <button
                        onClick={() => { setSigninOpen(false); setAuthMode('signup'); setShowEmailModal(true); }}
                        className="w-full flex items-center px-3 py-2 rounded-xl hover:bg-slate-50 transition-colors"
                      >
                        <div className="w-6 h-6 rounded-md bg-slate-200 mr-3" />
                        <div className="flex flex-col items-start">
                          <span className="text-slate-800 font-medium">{t('createAccount')}</span>
                          <span className="text-slate-400 text-xs">{t('emailPassword')}</span>
                        </div>
                      </button>
                      <div className="my-1 border-t border-slate-100" />
                      <button
                        onClick={() => { setSigninOpen(false); handleGoogleSignIn(); }}
                        className="w-full flex items-center px-3 py-2 rounded-xl hover:bg-slate-50 transition-colors"
                      >
                        <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-4 h-4 mr-3" />
                        <span className="text-slate-800 font-medium">{t('signInWithGoogle')}</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </nav>

            {/* Mobile menu button */}
            <Button
              variant="outline"
              size="sm"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <Menu className="w-4 h-4" />
            </Button>
          </div>

          {/* Mobile menu */}
          {mobileMenuOpen && (
            <div className="md:hidden mt-4 pb-4 border-t border-slate-200/50 pt-4">
              <div className="space-y-2">
                <button onClick={() => { handleGoHome(); setMobileMenuOpen(false); }} className="block w-full text-left px-3 py-2 rounded-xl hover:bg-slate-50 transition-colors font-medium">
                  {t('discover')}
                </button>
                <button onClick={() => { goCategories(); setMobileMenuOpen(false); }} className="block w-full text-left px-3 py-2 rounded-xl hover:bg-slate-50 transition-colors font-medium">
                  {t('categories')}
                </button>
                <button onClick={() => { goFavorites(); setMobileMenuOpen(false); }} className="block w-full text-left px-3 py-2 rounded-xl hover:bg-slate-50 transition-colors font-medium">
                  {t('favorites')} ({favCount})
                </button>
                {!currentUser && (
                  <button onClick={() => { setShowEmailModal(true); setMobileMenuOpen(false); }} className="block w-full text-left px-3 py-2 rounded-xl hover:bg-slate-50 transition-colors font-medium text-blue-600">
                    {t('signIn')}
                  </button>
                )}
                {/* Language Switch Mobile */}
                <div className="flex items-center justify-center space-x-1 bg-slate-100 rounded-lg p-1 mt-4">
                  <button
                    onClick={() => saveLanguage('en')}
                    className={`px-3 py-2 text-sm font-medium rounded transition-all ${
                      language === 'en' 
                        ? 'bg-white text-slate-900 shadow-sm' 
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    English
                  </button>
                  <button
                    onClick={() => saveLanguage('bg')}
                    className={`px-3 py-2 text-sm font-medium rounded transition-all ${
                      language === 'bg' 
                        ? 'bg-white text-slate-900 shadow-sm' 
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Български
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Modals */}
      {showEmailModal && <AuthModal />}
      {showProfileModal && currentUser && <ProfileModal />}

      {/* Main Content */}
      {(() => {
         const currentHash = window.location.hash;
         // Force правилни view based на hash независимо от view state
        if (currentHash === '#/favorites') {
          return <FavoritesView />;
         }
        if (currentHash === '#/categories') {
          return <CategoriesView />;
         }
        if (currentHash.startsWith('#/categories/') && currentHash !== '#/categories') {
          return <CategoryViewWrapper language={language} />;
        }
  
        // Fallback към view state
       if (view === 'favorites') return <FavoritesView />;
       if (view === 'categories') return <CategoriesView />;
       if (view === 'category') return <CategoryViewWrapper language={language} />;
    
       return <HomeView />;
     })()}

      {/* Bottom Navigation (Mobile) */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-slate-200/50 md:hidden z-50">
        <div className="flex items-center justify-around py-2">
          {[
            { name: t('home'), icon: Grid3x3, active: activeTab === 'Home', action: () => { handleGoHome(); setActiveTab('Home'); } },
            { name: t('categories'), icon: MessageCircle, active: activeTab === 'Categories', action: () => { goCategories(); setActiveTab('Categories'); } },
            { name: t('favorites'), icon: Heart, active: activeTab === 'Favorites', action: () => { goFavorites(); setActiveTab('Favorites'); } },
            { name: t('profile'), icon: User, active: activeTab === 'Profile', action: () => setActiveTab('Profile') }
          ].map((item) => {
            const IconComponent = item.icon;
            return (
              <button
                key={item.name}
                onClick={item.action}
                className={`flex flex-col items-center py-2 px-3 rounded-xl transition-colors ${
                  item.active ? 'text-blue-600 bg-blue-50' : 'text-slate-400 hover:text-slate-600'
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

  // Auth Modal Component
  function AuthModal() {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
        <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 mx-4">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-slate-800">
              {authMode === 'signup' ? t('createYourAccount') : t('signInToAccount')}
            </h3>
            <button onClick={() => setShowEmailModal(false)} className="text-slate-500 hover:text-slate-700 p-1">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-4">
            {authMode === 'signup' && (
              <Input 
                placeholder={t('yourName')} 
                value={authName} 
                onChange={(e) => setAuthName(e.target.value)}
                className="h-12 rounded-xl"
              />
            )}
            <Input 
              placeholder={t('email')} 
              type="email" 
              value={authEmail} 
              onChange={(e) => setAuthEmail(e.target.value)}
              className="h-12 rounded-xl"
            />
            <Input 
              placeholder={t('password')} 
              type="password" 
              value={authPassword} 
              onChange={(e) => setAuthPassword(e.target.value)}
              className="h-12 rounded-xl"
            />
            {authError && <div className="text-red-600 text-sm p-3 bg-red-50 rounded-xl">{authError}</div>}
          </div>

          <div className="flex items-center justify-between mt-6">
            <button 
              onClick={() => setAuthMode(authMode === 'signup' ? 'signin' : 'signup')} 
              className="text-sm text-blue-600 hover:underline"
            >
              {authMode === 'signup' ? t('alreadyHaveAccount') : t('dontHaveAccount')}
            </button>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setShowEmailModal(false)}>{t('cancel')}</Button>
              <Button onClick={submitEmailAuth} disabled={authSubmitting} className="bg-gradient-to-r from-blue-600 to-indigo-600">
                {authMode === 'signup' ? t('createAccount') : t('signIn')}
              </Button>
            </div>
          </div>

          <div className="mt-6">
            <div className="text-center text-xs text-slate-400 mb-3">{t('orContinueWith')}</div>
            <Button 
              onClick={() => { setShowEmailModal(false); handleGoogleSignIn(); }} 
              className="w-full bg-white border border-slate-200 text-slate-800 hover:bg-slate-50 h-12"
            >
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5 mr-2" />
              {t('google')}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Profile Modal Component
  function ProfileModal() {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
        <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 mx-4">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-slate-800">{t('yourProfile')}</h3>
            <button onClick={() => setShowProfileModal(false)} className="text-slate-500 hover:text-slate-700 p-1">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-full overflow-hidden bg-slate-100 border-2 border-slate-200">
              {profPic ? (
                <img src={profPic} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <div className="w-full h-full bg-blue-200" />
              )}
            </div>
            <div className="flex-1">
              <div className="text-xs text-slate-500 mb-1">{t('email')}</div>
              <div className="text-slate-800 font-medium">{currentUser!.email}</div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">{t('name')}</label>
              <Input 
                placeholder={t('name')} 
                value={profName} 
                onChange={(e) => setProfName(e.target.value)}
                className="h-12 rounded-xl"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">{t('avatarUrl')}</label>
              <Input 
                placeholder="https://..." 
                value={profPic} 
                onChange={(e) => setProfPic(e.target.value)}
                className="h-12 rounded-xl"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-8">
            <Button variant="outline" onClick={() => setShowProfileModal(false)}>{t('cancel')}</Button>
            <Button onClick={saveProfile} disabled={profSaving} className="bg-gradient-to-r from-blue-600 to-indigo-600">
              {t('saveChanges')}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Home View Component with Sidebar Layout
  function HomeView() {
    const featuredCategories = getFeaturedCategories(language);
    const featuredTools = getFeaturedTools(language);
    // Default sidebar to open on desktop, closed on mobile
    const [sidebarOpen, setSidebarOpen] = useState(typeof window !== 'undefined' && window.innerWidth >= 1024);

    // Listen for window resize to adjust sidebar state
    useEffect(() => {
      const handleResize = () => {
        if (window.innerWidth >= 1024 && !sidebarOpen) {
          setSidebarOpen(true);
        } else if (window.innerWidth < 1024 && sidebarOpen) {
          setSidebarOpen(false);
        }
      };

      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }, [sidebarOpen]);

    return (
      <div className="flex min-h-screen">
        {/* Sidebar - Categories */}
        <aside className={`fixed inset-y-0 left-0 z-50 w-80 bg-white/95 backdrop-blur-xl border-r border-slate-200/50 transform transition-transform duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}>
          <div className="flex flex-col h-full">
            {/* Sidebar Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-200/50 relative z-10">
              <div>
                <h2 className="text-lg font-bold text-slate-800">{t('featuredCategories')}</h2>
                <p className="text-sm text-slate-600 mt-1">{language === 'bg' ? 'Изберете категория' : 'Choose a category'}</p>
              </div>
              {/* Toggle button inside sidebar */}
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('Sidebar close button clicked'); // Debug
                  setSidebarOpen(false);
                }}
                className="p-2 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer relative z-20 flex-shrink-0"
                title={language === 'bg' ? 'Скрий панела' : 'Hide sidebar'}
                type="button"
                style={{ pointerEvents: 'auto' }}
              >
                <ArrowLeft className="w-5 h-5 text-slate-600" style={{ pointerEvents: 'none' }} />
              </button>
            </div>

            {/* Categories List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {featuredCategories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => {
                    // Navigate directly to category page
                    const capParam = CATEGORY_TO_CAP_MAPPING[category.id] || category.id;
                    const newHash = `#/categories/${encodeURIComponent(capParam)}`;
                    window.location.hash = newHash;
                    setSidebarOpen(false);
                  }}
                  className="w-full group bg-white/80 hover:bg-white border border-slate-200/50 hover:border-slate-300/50 rounded-2xl p-4 transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5"
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${category.gradient} flex items-center justify-center shadow-md group-hover:scale-105 transition-transform duration-200`}>
                      <span className="text-xl">{category.emoji}</span>
                    </div>
                    <div className="flex-1 text-left">
                      <h3 className="font-semibold text-slate-800 group-hover:text-slate-900 transition-colors">
                        {category.label}
                      </h3>
                      <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                        {category.description}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs text-slate-500">
                          {category.tools.length} {language === 'bg' ? 'инструмента' : 'tools'}
                        </span>
                        <div className="flex -space-x-1">
                          {category.tools.slice(0, 3).map((tool, idx) => (
                            <div
                              key={tool.name}
                              className="w-5 h-5 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center"
                              title={tool.name}
                            >
                              <span className="text-xs text-slate-600">{tool.name.charAt(0)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </button>
              ))}

              {/* View All Categories Button - moved here */}
              <div className="pt-2">
                <Button 
                  onClick={() => {
                    goCategories();
                    setSidebarOpen(false);
                  }}
                  variant="outline"
                  className="w-full border-blue-300 text-blue-600 hover:bg-blue-50 h-12"
                >
                  {t('viewAllCategories')}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          </div>
        </aside>

        {/* Sidebar Overlay (Mobile) */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'lg:ml-80' : 'lg:ml-0'}`}>
          <div className="max-w-4xl mx-auto px-4 py-8 pb-24 md:pb-12">
            {/* Show sidebar toggle only when sidebar is closed */}
            {!sidebarOpen && (
              <button
                onClick={() => setSidebarOpen(true)}
                className="fixed top-20 left-4 z-30 p-3 bg-white/90 backdrop-blur-sm border border-slate-200/50 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200"
                title={language === 'bg' ? 'Покажи панела' : 'Show sidebar'}
              >
                <ArrowRight className="w-5 h-5 text-slate-600" />
              </button>
            )}

            {/* Hero Section */}
            <section className="text-center mb-16">
              <h1 className="text-4xl md:text-5xl text-slate-800 mb-6 font-bold tracking-tight">
                {t('heroTitle')} <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">{t('heroTitleHighlight')}</span>
              </h1>
              <p className="text-xl text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed">
                {t('heroSubtitle')}
              </p>

              {/* Main Chat Input */}
              <div className="max-w-2xl mx-auto mb-8">
                <div className="relative bg-white/80 backdrop-blur-sm rounded-3xl p-6 border border-slate-200/50 shadow-2xl shadow-blue-500/10">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/25">
                      <MessageCircle className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-slate-700 text-lg font-medium">{t('inputPlaceholder')}</span>
                  </div>
                  <div className="flex gap-3">
                    <Input
                      placeholder={language === 'bg' ? 'напр., Писане на по-добри имейли, създаване на лого, анализ на данни...' : 'e.g., Write better emails, create a logo, analyze data...'}
                      autoFocus
                      value={chatInput}
                      onChange={handleChatInputChange}
                      onKeyDown={handleKeyDown}
                      className="flex-1 bg-slate-50/80 border-slate-200 text-base h-14 rounded-2xl px-5 font-medium placeholder:text-slate-400"
                    />
                    <Button 
                      onClick={() => handleFindTools()} 
                      className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 px-6 h-14 rounded-2xl shadow-lg shadow-blue-500/25 font-medium"
                      disabled={loading}
                    >
                      <Zap className="w-5 h-5 mr-2" /> {t('findTools')}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Recent Prompts */}
              {recents.length > 0 && (
                <div className="max-w-2xl mx-auto mb-10">
                  <div className="flex items-center justify-between mb-3 px-1">
                    <div className="flex items-center gap-2 text-slate-600">
                      <History className="w-4 h-4" />
                      <span className="text-sm font-medium">{t('recentPrompts')}</span>
                    </div>
                    <button className="text-xs text-slate-400 hover:text-slate-600 transition-colors" onClick={clearRecents}>
                      {t('clearAll')}
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {recents.map((prompt) => (
                      <div key={prompt} className="group inline-flex items-center max-w-full bg-white/90 border border-slate-200/60 rounded-xl px-3 py-2 shadow-sm hover:shadow-md transition-shadow">
                        <button 
                          className="text-sm text-slate-700 truncate max-w-[200px] hover:text-blue-600 transition-colors" 
                          title={prompt} 
                          onClick={() => { setChatInput(prompt); handleFindTools(prompt); }}
                        >
                          {prompt}
                        </button>
                        <button 
                          className="ml-2 text-slate-400 hover:text-red-500 transition-colors p-1" 
                          onClick={() => removeRecent(prompt)} 
                          aria-label="remove" 
                          title="Remove"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Status Messages */}
              {error && (
                <div className="text-red-600 font-medium mb-6 p-4 bg-red-50 rounded-2xl border border-red-200 max-w-2xl mx-auto">
                  {error}
                </div>
              )}
              {loading && (
                <div className="text-blue-600 font-medium mb-6 p-4 bg-blue-50 rounded-2xl border border-blue-200 max-w-2xl mx-auto">
                  {t('loading')}
                </div>
              )}
            </section>

            {/* Search and Filters */}
            {filteredGroups.length > 0 && (
              <section className="mb-12">
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                  <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <Input
                      placeholder={t('searchPlaceholder')}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-12 bg-white/80 border-slate-200/50 h-12 rounded-2xl backdrop-blur-sm font-medium"
                    />
                  </div>
                  <label className="inline-flex items-center gap-2 text-slate-700 bg-white/80 border border-slate-200/50 rounded-2xl px-4 h-12 whitespace-nowrap">
                    <input 
                      type="checkbox" 
                      checked={showFavsOnly} 
                      onChange={(e) => setShowFavsOnly(e.target.checked)} 
                      className="accent-blue-600 w-4 h-4" 
                    />
                    <span className="text-sm font-medium">{t('favoritesOnly')}</span>
                    <span className="text-xs text-slate-400">({favCount})</span>
                  </label>
                </div>
              </section>
            )}

             {/* Visual Plan */}
             {filteredGroups.length > 0 && (
              <section className="mb-16">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/25">
                    <Wand2 className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl text-slate-800 font-bold">{t('journeyTitle')}</h2>
                    <p className="text-slate-600 text-sm">{t('journeySubtitle')}</p>
                  </div>
                </div>
                <PlanMindMap
                  goal={lastGoal || chatInput}
                  steps={filteredGroups}
                  onOpenTool={handleOpenTool}
                  language={language}
                  buildPrompt={buildPromptCallback}
                />
              </section>
            )}

            {/* Featured Tools & Categories - Only show when no results */}
            {filteredGroups.length === 0 && !loading && groups.length === 0 && (
              <>
                {/* Featured Tools Section */}
                <section className="mb-16">
                  <div className="text-center mb-12">
                    <div className="flex items-center justify-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-green-500/25">
                        <Zap className="w-5 h-5 text-white" />
                      </div>
                      <h2 className="text-3xl font-bold text-slate-800">{t('featuredToolsTitle')}</h2>
                    </div>
                    <p className="text-slate-600 text-lg max-w-2xl mx-auto">
                      {t('featuredToolsSubtitle')}
                    </p>
                  </div>

                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {getFeaturedTools(language).map((tool) => (
                      <Card 
                        key={tool.name}
                        className="group border-slate-200/50 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 bg-white/90 backdrop-blur-sm overflow-hidden"
                      >
                        <CardContent className="p-6 relative">
                          {/* Background gradient */}
                          <div className={`absolute inset-0 bg-gradient-to-br ${tool.gradient} opacity-5 group-hover:opacity-10 transition-opacity duration-300`} />
                          
                          {/* Content */}
                          <div className="relative">
                            {/* Tool header */}
                            <div className="flex items-center justify-between mb-4">
                              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${tool.gradient} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                                <span className="text-2xl">{tool.icon}</span>
                              </div>
                              <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
                                {t('mostUsed')}
                              </Badge>
                            </div>

                            <h3 className="text-xl font-bold text-slate-800 mb-2 group-hover:text-slate-900 transition-colors">
                              {tool.name}
                            </h3>

                            <p className="text-sm text-slate-600 mb-3 leading-relaxed">
                              {tool.description}
                            </p>

                            <div className="flex items-center justify-between mb-6">
                              <Badge variant="secondary" className="text-xs bg-slate-100 text-slate-600">
                                {tool.category}
                              </Badge>
                            </div>

                            {/* Action button */}
                            <a
                              href={tool.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`block w-full text-center text-white rounded-2xl py-3 font-medium shadow-lg transition-all duration-200 bg-gradient-to-r ${tool.gradient} hover:shadow-xl hover:-translate-y-0.5`}
                            >
                              {t('tryTool')}
                            </a>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </section>

                {/* Categories Overview Section */}
                <section className="mb-16">
                  <div className="text-center mb-12">
                    <div className="flex items-center justify-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/25">
                        <Grid3x3 className="w-5 h-5 text-white" />
                      </div>
                      <h2 className="text-3xl font-bold text-slate-800">{t('exploreCategories')}</h2>
                    </div>
                    <p className="text-slate-600 text-lg max-w-2xl mx-auto mb-8">
                      {t('exploreCategoriesSubtitle')}
                    </p>
                  </div>

                  <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {getFeaturedCategories(language).slice(0, 4).map((category) => (
                      <Card 
                        key={category.id}
                        className="group border-slate-200/50 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-white/90 backdrop-blur-sm cursor-pointer"
                        onClick={() => {
                          const samplePrompt = language === 'bg' ? 
                            `Помогни ми с ${category.label.toLowerCase()}` :
                            `Help me with ${category.label.toLowerCase()}`;
                          setChatInput(samplePrompt);
                        }}
                      >
                        <CardContent className="p-6 text-center relative">
                          {/* Background gradient */}
                          <div className={`absolute inset-0 bg-gradient-to-br ${category.gradient} opacity-5 group-hover:opacity-10 transition-opacity duration-300 rounded-lg`} />
                          
                          <div className="relative">
                            <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${category.gradient} flex items-center justify-center shadow-md mx-auto mb-4 group-hover:scale-110 transition-transform duration-200`}>
                              <span className="text-xl">{category.emoji}</span>
                            </div>
                            <h3 className="font-semibold text-slate-800 mb-2 group-hover:text-slate-900 transition-colors">
                              {category.label}
                            </h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                              {category.tools.length} {language === 'bg' ? 'инструмента' : 'tools'}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  <div className="text-center">
                    <Button 
                      onClick={goCategories}
                      variant="outline"
                      className="border-indigo-300 text-indigo-600 hover:bg-indigo-50 px-8 py-3"
                    >
                      {t('browseAllCategories')}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </section>

                {/* CTA Section */}
                <section className="text-center py-12">
                  <div className="w-20 h-20 bg-slate-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
                    <Sparkles className="w-10 h-10 text-slate-400" />
                  </div>
                  <h3 className="text-slate-800 mb-3 font-bold text-xl">{t('readyTitle')}</h3>
                  <p className="text-slate-600">{t('readySubtitle')}</p>
                </section>
              </>
            )}

            {filteredGroups.length === 0 && !loading && groups.length > 0 && (
              <div className="text-center py-16">
                <div className="w-20 h-20 bg-slate-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
                  <Search className="w-10 h-10 text-slate-400" />
                </div>
                <h3 className="text-slate-800 mb-3 font-bold text-xl">{t('noToolsTitle')}</h3>
                <p className="text-slate-600">{t('noToolsSubtitle')}</p>
              </div>
            )}
          </div>
        </main>
      </div>
    );
  }

  // Favorites View Component
  function FavoritesView() {
    return (
      <main className="max-w-6xl mx-auto px-4 py-8 pb-24 md:pb-12">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <button onClick={handleGoHome} className="inline-flex items-center gap-2 text-slate-600 hover:text-blue-600 transition-colors p-2 -ml-2 rounded-xl">
              <ArrowLeft className="w-4 h-4" />
              <span className="font-medium">{t('back')}</span>
            </button>
            <div className="w-px h-6 bg-slate-300" />
            <h1 className="text-2xl text-slate-800 font-bold">{t('myFavorites')}</h1>
          </div>
          <span className="text-slate-500 font-medium bg-slate-100 px-3 py-1 rounded-full text-sm">
            {favCount} {t('savedCount')}
          </span>
        </div>

        {favCount === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-slate-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <Star className="w-10 h-10 text-slate-400" />
            </div>
            <h3 className="text-slate-800 mb-3 font-bold text-xl">{t('noFavoritesTitle')}</h3>
            <p className="text-slate-600 mb-8">{t('noFavoritesSubtitle')}</p>
            <Button onClick={handleGoHome} className="bg-gradient-to-r from-blue-600 to-indigo-600">
              {t('discoverTools')}
            </Button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from(favs.values()).map((tool) => (
              <ToolCard 
                key={`fav-${tool.name}`} 
                tool={tool} 
                isFav={true} 
                onToggleFav={() => toggleFav(tool)} 
              />
            ))}
          </div>
        )}
      </main>
    );
  }

  // Tool Card Component (used in FavoritesView)
  function ToolCard({ tool, isFav, onToggleFav }: { tool: Tool | FavTool; isFav: boolean; onToggleFav: () => void }) {
    return (
      <Card className="border-slate-200/50 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-white/90 backdrop-blur-sm group">
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="w-14 h-14 rounded-2xl overflow-hidden bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform duration-300">
              {'icon' in tool && (tool as any).icon ? (
                <img
                  src={(tool as any).icon}
                  alt={tool.name}
                  className="w-8 h-8 object-contain"
                  loading="lazy"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    const img = e.currentTarget as HTMLImageElement;
                    img.onerror = null;
                    img.style.display = 'none';
                  }}
                />
              ) : (
                <Sparkles className="w-7 h-7 text-white" />
              )}
            </div>

            <button
              onClick={onToggleFav}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-xl border transition-all ${
                isFav 
                  ? 'bg-yellow-100 border-yellow-200 text-yellow-700 hover:bg-yellow-200' 
                  : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50 hover:border-slate-300'
              }`}
              title={isFav ? t('removeFromFavorites') : t('addToFavorites')}
            >
              <Star className={`w-4 h-4 ${isFav ? 'fill-current' : ''}`} />
              <span className="text-sm font-medium hidden sm:inline">
                {isFav ? t('saved') : t('save')}
              </span>
            </button>
          </div>

          <h3 className="text-slate-800 mb-3 font-bold text-lg leading-tight">{tool.name}</h3>
          
          <div className="flex gap-2 mb-5">
            <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700 font-medium px-2 py-1">
              {t('aiTool')}
            </Badge>
            <Badge variant="secondary" className="text-xs font-medium px-2 py-1 bg-emerald-100 text-emerald-700">
              {t('free')}
            </Badge>
          </div>

          {'link' in tool && (tool as any).link ? (
            <a
              href={(tool as any).link}
              target="_blank"
              rel="noreferrer noopener"
              className="block w-full text-center bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white rounded-2xl h-11 leading-[44px] font-medium shadow-lg shadow-red-500/25 transition-all duration-200"
            >
              {t('openTool')}
            </a>
          ) : (
            <Button disabled className="w-full rounded-2xl h-11 bg-slate-100 text-slate-400">
              {t('noLink')}
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  // Categories View Component
  function CategoriesView() {
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);

    // Categories data based on comprehensive AI tools research
    const categories = [
      {
        id: 'assistants-productivity',
        label: language === 'bg' ? 'Асистенти и продуктивност' : 'Assistants & Productivity',
        emoji: '🤖',
        description: language === 'bg' ? 'Умни помощници и инструменти за повишаване на продуктивността' : 'Smart assistants and productivity enhancement tools',
        count: 48,
        gradient: 'from-blue-500 to-indigo-600'
      },
      {
        id: 'text-writing',
        label: language === 'bg' ? 'Генерация на текст и писане' : 'Text Generation & Writing',
        emoji: '✏️',
        description: language === 'bg' ? 'Създаване, редактиране и подобряване на текстово съдържание' : 'Creating, editing and improving written content',
        count: 42,
        gradient: 'from-emerald-500 to-teal-600'
      },
      {
        id: 'images-design',
        label: language === 'bg' ? 'Изображения и дизайн' : 'Images & Design',
        emoji: '🎨',
        description: language === 'bg' ? 'Генериране, редактиране и дизайн на визуално съдържание' : 'Generate, edit and design visual content',
        count: 39,
        gradient: 'from-purple-500 to-pink-600'
      },
      {
        id: 'video-3d',
        label: language === 'bg' ? 'Видео и 3D' : 'Video & 3D',
        emoji: '🎬',
        description: language === 'bg' ? 'Създаване и редактиране на видео и 3D съдържание' : 'Create and edit video and 3D content',
        count: 35,
        gradient: 'from-red-500 to-orange-600'
      },
      {
        id: 'audio-music',
        label: language === 'bg' ? 'Аудио и музика' : 'Audio & Music',
        emoji: '🎵',
        description: language === 'bg' ? 'Генериране на звук, музика и гласови записи' : 'Generate sound, music and voice recordings',
        count: 28,
        gradient: 'from-amber-500 to-yellow-600'
      },
      {
        id: 'business-marketing',
        label: language === 'bg' ? 'Бизнес, маркетинг и социални медии' : 'Business, Marketing & Social Media',
        emoji: '📈',
        description: language === 'bg' ? 'Инструменти за бизнес, маркетинг и социални мрежи' : 'Tools for business, marketing and social networks',
        count: 44,
        gradient: 'from-cyan-500 to-blue-600'
      },
      {
        id: 'coding-development',
        label: language === 'bg' ? 'Кодиране и разработка' : 'Coding & Development',
        emoji: '💻',
        description: language === 'bg' ? 'Помощници за програмиране и разработка на софтуер' : 'Programming assistants and software development',
        count: 33,
        gradient: 'from-slate-600 to-gray-700'
      },
      {
        id: 'automation-agents',
        label: language === 'bg' ? 'Автоматизация и агенти' : 'Automation & AI Agents',
        emoji: '⚡',
        description: language === 'bg' ? 'Автоматизация на процеси и интелигентни AI агенти' : 'Process automation and intelligent AI agents',
        count: 26,
        gradient: 'from-violet-500 to-purple-600'
      },
      {
        id: 'data-analysis',
        label: language === 'bg' ? 'Данни и анализ' : 'Data & Analysis',
        emoji: '📊',
        description: language === 'bg' ? 'Анализ на данни и бизнес аналитика' : 'Data analysis and business intelligence',
        count: 31,
        gradient: 'from-teal-600 to-emerald-700'
      },
      {
        id: 'education-learning',
        label: language === 'bg' ? 'Образование и обучение' : 'Education & Learning',
        emoji: '🎓',
        description: language === 'bg' ? 'Инструменти за учене и образователни помощници' : 'Learning tools and educational assistants',
        count: 23,
        gradient: 'from-indigo-500 to-blue-600'
      },
      {
        id: 'health-wellness',
        label: language === 'bg' ? 'Здраве и благополучие' : 'Health & Wellness',
        emoji: '🏥',
        description: language === 'bg' ? 'AI решения за здраве и личностно развитие' : 'AI solutions for health and personal development',
        count: 19,
        gradient: 'from-green-500 to-emerald-600'
      },
      {
        id: 'specialized-niche',
        label: language === 'bg' ? 'Специализирани/нишови' : 'Specialized & Niche',
        emoji: '🎯',
        description: language === 'bg' ? 'Специални инструменти за конкретни области и професии' : 'Special tools for specific fields and professions',
        count: 27,
        gradient: 'from-rose-500 to-pink-600'
      }
    ];

    // Filter categories based on search
    const filteredCategories = categories.filter(category =>
      category.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      category.description.toLowerCase().includes(searchQuery.toLowerCase())
    );

    useEffect(() => {
      // Simulate loading
      setTimeout(() => setLoading(false), 500);
    }, []);

    return (
      <main className="max-w-6xl mx-auto px-4 py-8 pb-24 md:pb-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <button onClick={handleGoHome} className="inline-flex items-center gap-2 text-slate-600 hover:text-blue-600 transition-colors p-2 -ml-2 rounded-xl">
              <ArrowLeft className="w-4 h-4" />
              <span className="font-medium">{t('back')}</span>
            </button>
            <div className="w-px h-6 bg-slate-300" />
            <div>
              <h1 className="text-3xl text-slate-800 font-bold">{t('categoriesTitle')}</h1>
              <p className="text-slate-600 text-sm mt-1">{t('categoriesSubtitle')}</p>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="mb-8">
          <div className="relative max-w-md">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <Input
              placeholder={t('searchCategories')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 bg-white/80 border-slate-200/50 h-12 rounded-2xl backdrop-blur-sm font-medium"
            />
          </div>
        </div>

        {/* Categories Grid */}
        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="h-40 bg-slate-100 rounded-3xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCategories.map((category) => (
              <Card 
                key={category.id} 
                className="group border-slate-200/50 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 bg-white/90 backdrop-blur-sm cursor-pointer overflow-hidden"
                onClick={() => {
                  const capParam = CATEGORY_TO_CAP_MAPPING[category.id] || category.id;
                  const newHash = `#/categories/${encodeURIComponent(capParam)}`;
                  window.location.hash = newHash;
                }}
              >
                <CardContent className="p-6 relative">
                  {/* Background gradient */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${category.gradient} opacity-5 group-hover:opacity-10 transition-opacity duration-300`} />
                  
                  {/* Content */}
                  <div className="relative">
                    <div className="flex items-start justify-between mb-4">
                      <div className={`w-16 h-16 rounded-3xl bg-gradient-to-br ${category.gradient} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                        <span className="text-2xl">{category.emoji}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-slate-500">{category.count}</div>
                        <div className="text-xs text-slate-400">{t('toolsInCategory')}</div>
                      </div>
                    </div>

                    <h3 className="text-xl font-bold text-slate-800 mb-2 group-hover:text-slate-900 transition-colors">
                      {category.label}
                    </h3>
                    
                    <p className="text-sm text-slate-600 mb-4 leading-relaxed">
                      {category.description}
                    </p>

                    <div className="flex items-center justify-between">
                      <Badge 
                        variant="secondary" 
                        className={`text-xs font-medium px-3 py-1 bg-gradient-to-r ${category.gradient} text-white border-0`}
                      >
                        {t('browseCategory')}
                      </Badge>
                      <ArrowLeft className="w-4 h-4 text-slate-400 rotate-180 group-hover:translate-x-1 transition-transform duration-300" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && filteredCategories.length === 0 && (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-slate-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <Search className="w-10 h-10 text-slate-400" />
            </div>
            <h3 className="text-slate-800 mb-3 font-bold text-xl">{t('noToolsTitle')}</h3>
            <p className="text-slate-600">{t('noToolsSubtitle')}</p>
          </div>
        )}

        {/* Stats */}
        <div className="mt-12 text-center">
          <div className="inline-flex items-center gap-6 bg-white/80 border border-slate-200/50 rounded-2xl px-6 py-4 backdrop-blur-sm">
            <div className="text-center">
              <div className="text-2xl font-bold text-slate-800">{filteredCategories.length}</div>
              <div className="text-xs text-slate-500">{t('totalCategories')}</div>
            </div>
            <div className="w-px h-8 bg-slate-300" />
            <div className="text-center">
              <div className="text-2xl font-bold text-slate-800">
                {filteredCategories.reduce((total, cat) => total + cat.count, 0)}
              </div>
              <div className="text-xs text-slate-500">{t('totalTools')}</div>
            </div>
          </div>
        </div>
      </main>
    );
  }
}