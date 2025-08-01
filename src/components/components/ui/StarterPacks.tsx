import { Card } from "@/ui/card"
import { Button } from "@/ui/button"

type Pack = {
  title: string
  description: string
  tools: number
}

const packs: Pack[] = [
  {
    title: "Marketing Starter Pack",
    description: "Tools to enhance your marketing strategy",
    tools: 6,
  },
  {
    title: "Content Creation Pack",
    description: "Boost your creativity and generate ideas",
    tools: 5,
  },
  {
    title: "Startup Toolkit",
    description: "Essential AI tools for launching projects",
    tools: 7,
  },
]

export default function StarterPacks() {
  return (
    <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {packs.map((pack) => (
        <Card key={pack.title} className="p-4 space-y-3">
          <h3 className="text-xl font-bold">{pack.title}</h3>
          <p className="text-muted-foreground">{pack.description}</p>
          <p className="text-sm text-gray-500">{pack.tools} tools included</p>
          <Button>Get Started</Button>
        </Card>
      ))}
    </section>
  )
}
