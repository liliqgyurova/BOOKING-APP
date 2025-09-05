import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Separator } from "../components/ui/separator";
import { useNavigate } from "react-router-dom";

export default function Learn() {
  const nav = useNavigate();

  const useCases = [
    { title: "Make a presentation with AI", prompt: "искам да направя презентация за продукта ни", cap: "cap:slide-generate" },
    { title: "Research a topic quickly", prompt: "направи обзор на пазара за електрически велосипеди в ЕС", cap: "cap:research-web" },
    { title: "Create social media campaign", prompt: "маркетингова кампания за Instagram за кафе-бар", cap: "cap:text-explain" },
  ];

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">Learn</h1>
      <p className="text-muted-foreground mb-6">How to get the most out of My AI: quick guides, use cases, and best practices.</p>

      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="rounded-2xl lg:col-span-2">
          <CardContent className="space-y-3 py-5">
            <h3 className="font-semibold text-lg">How the platform works</h3>
            <p className="text-sm">1) Describe your goal. 2) We break it into macro-steps. 3) For each step we suggest the strongest AI tools.</p>
            <div className="flex gap-2">
              <Button onClick={() => nav("/discover")}>Try the Planner</Button>
              <a href="https://example.com/intro-video" target="_blank" rel="noreferrer"><Button variant="outline">Watch intro video</Button></a>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardContent className="text-sm space-y-2 py-5">
            <h3 className="font-semibold text-lg">AI Literacy & Safety</h3>
            <p>• Verify facts with multiple sources.</p>
            <p>• Be mindful of bias; ask for critical evaluation.</p>
            <p>• Don’t paste secrets; use anonymized data.</p>
            <p>• Check licensing for generated media.</p>
          </CardContent>
        </Card>
      </div>

      <Separator className="my-6" />

      <h2 className="text-2xl font-semibold mb-3">Use Cases & Guides</h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {useCases.map((u) => (
          <Card key={u.title} className="rounded-2xl">
            <CardContent className="space-y-3 py-5">
              <h3 className="font-semibold">{u.title}</h3>
              <p className="text-sm text-muted-foreground">Prompt: “{u.prompt}”</p>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => nav("/discover", { state: { presetPrompt: u.prompt } })}>Open in Planner</Button>
                <Button size="sm" variant="outline" onClick={() => nav(`/categories/${encodeURIComponent(u.cap)}`)}>Browse tools</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </main>
  );
}
