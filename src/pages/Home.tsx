// src/Home.tsx

import StarterPacks from '@/sections/StarterPacks';
import PopularTools from '@/sections/PopularTools';

export default function Home() {
  return (
    <main className="p-6 space-y-16 max-w-6xl mx-auto">
      {/* Тук ще добавим още секции като Search, Tags и т.н. */}
      <StarterPacks />
      <PopularTools />
    </main>
  );
}
