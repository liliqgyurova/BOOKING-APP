// src/pages/Home.tsx
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Rocket,
  BookOpen,
  Brush,
  MessageCircleMore,
  Image,
  Video,
  CodeXml,
  BrainCircuit,
  Paintbrush2,
} from "lucide-react";
import { Input } from "../components/ui/input";
import { StarterPackCard } from "../components/ui/StarterPackCard";
import { PopularToolCard } from "../components/ui/PopularToolCard";
import { Button } from "../components/ui/button";

export default function Home() {
  const navigate = useNavigate();
  const [q, setQ] = useState("");

  const quickTags = [
    { label: "Write content", cap: "cap:text-explain" },
    { label: "Create images", cap: "cap:image-generate" },
    { label: "Edit videos", cap: "cap:video-generate" },
    { label: "Learn coding", cap: "cap:text-explain" },
    { label: "Analyze data", cap: "cap:research-web" },
  ];

  const goToCategories = () => {
    // Ако искаш да подадеш q към Categories, използвай location.state
    navigate("/categories", { state: { presetSearch: q.trim() } });
  };

  return (
    <div className="bg-background min-h-screen text-foreground">
      {/* Hero */}
      <section className="text-center py-16 px-4 max-w-4xl mx-auto">
        <h1 className="text-4xl sm:text-5xl font-bold mb-4">
          Discover AI tools that{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-500">
            actually help
          </span>
        </h1>
        <p className="text-muted-foreground text-lg mb-8">
          From writing essays to creating art, find the perfect AI tools for your goals. No technical jargon, just results.
        </p>

        <div className="bg-white dark:bg-card shadow-md p-4 rounded-xl flex flex-col sm:flex-row items-center gap-4">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <MessageCircleMore className="text-blue-500" />
            <span className="text-sm font-medium">What do you want to achieve with AI?</span>
          </div>
          <Input
            type="text"
            placeholder="e.g. Write better emails, create a logo, analyze data..."
            className="flex-1"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") goToCategories();
            }}
          />
          <Button
            className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6"
            onClick={goToCategories}
          >
            Find Tools
          </Button>
        </div>

        <div className="flex flex-wrap justify-center gap-2 mt-6">
          {quickTags.map((t) => (
            <Link key={t.label} to={`/categories/${encodeURIComponent(t.cap)}`}>
              <Button variant="ghost" className="rounded-full text-sm">
                {t.label}
              </Button>
            </Link>
          ))}
        </div>
      </section>

      {/* Starter Packs */}
      <section className="px-4 max-w-6xl mx-auto mt-12">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Rocket className="text-pink-500" /> AI Starter Packs
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StarterPackCard
            title="Content Creator Pack"
            description="Perfect for social media and blog content"
            icon={<Brush />}
            tools={["ChatGPT", "Canva AI", "Midjourney"]}
          />
          <StarterPackCard
            title="Student Essentials"
            description="Research, writing, and study tools"
            icon={<BookOpen />}
            tools={["Perplexity AI", "ChatGPT", "Notion AI"]}
          />
          <StarterPackCard
            title="Marketing Pro"
            description="Complete marketing automation suite"
            icon={<Rocket />}
            tools={["Copy.ai", "Canva AI", "Analytics AI"]}
          />
        </div>
      </section>

      {/* Popular Tools */}
      <section className="px-4 max-w-6xl mx-auto mt-16 mb-20">
        <h2 className="text-xl font-bold mb-4">Popular AI Tools</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <PopularToolCard
            title="ChatGPT"
            description="AI-powered writing assistant"
            icon={<MessageCircleMore />}
            rating={4.8}
            tags={["Writing", "Paid"]}
            buttonLabel="Open Tool"
          />
          <PopularToolCard
            title="Midjourney"
            description="AI image generation tool"
            icon={<Image />}
            rating={4.9}
            tags={["Design", "Paid"]}
            buttonLabel="Open Tool"
          />
          <PopularToolCard
            title="Runway ML"
            description="AI video editing and generation"
            icon={<Video />}
            rating={4.7}
            tags={["Video", "Paid"]}
            buttonLabel="Open Tool"
          />
          <PopularToolCard
            title="GitHub Copilot"
            description="AI coding assistant"
            icon={<CodeXml />}
            rating={4.6}
            tags={["Development", "Paid"]}
            buttonLabel="Open Tool"
          />
          <PopularToolCard
            title="Perplexity AI"
            description="AI research assistant"
            icon={<BrainCircuit />}
            rating={4.5}
            tags={["Research", "Free"]}
            buttonLabel="Open Tool"
          />
          <PopularToolCard
            title="Canva AI"
            description="AI-powered design tools"
            icon={<Paintbrush2 />}
            rating={4.4}
            tags={["Design", "Free"]}
            buttonLabel="Open Tool"
          />
        </div>
      </section>
    </div>
  );
}
