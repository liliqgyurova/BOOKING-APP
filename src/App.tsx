// src/App.tsx
import React from 'react';
// ако Home.tsx е директно в src/:
import Home from './Home';
// ако е в src/pages/:
// import Home from './pages/Home';

export default function App() {
  return <Home />;
}
