import { Card } from "@/ui/card"
import { Button } from "@/ui/button"

type Tool = {
  name: string
  description: string
  logo?: string // може да добавим image path по-късно
}

const tools: Tool[] = [
  {
    name: "ChatGPT",
    description: "AI-powered writing assistant",
  },
  {
    name: "Midjourney",
    description: "AI image generator",
  },
  {
    name: "Runway ML",
    description: "AI video editing and generation",
  },
  {
    name: "GitHub Copilot",
    description: "AI coding assistant",
  },
  {
    name: "Perplexity AI",
    description: "AI research assistant",
  },
  {
    name: "Canva AI",
    description: "AI-powered design tools",
  },
]

export default function PopularTools() {
  return (
    <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {tools.map((tool) => (
        <Card key={tool.name} className="p-4 space-y-2">
          <h3 className="text-xl font-semibold">{tool.name}</h3>
          <p className="text-muted-foreground">{tool.description}</p>
          <Button variant="outline">Open Tool</Button>
        </Card>
      ))}
    </section>
  )
}
