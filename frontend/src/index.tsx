// src/index.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter, Routes, Route } from 'react-router-dom';
import Layout from './pages/Layout';          // НОВО: общ layout с header/nav
import Home from './pages/Home';              // НОВО: изнесено от App
import Categories from './pages/Categories';
import CategoryView from './pages/CategoryView';
import Learn from './pages/Learn';
import './index.css';

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(
  <React.StrictMode>
    <HashRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/categories" element={<Categories />} />
          <Route path="/categories/:cap" element={<CategoryView />} />
          <Route path="/learn" element={<Learn />} />
          {/* можеш да добавиш и /favorites по желание */}
        </Route>
      </Routes>
    </HashRouter>
  </React.StrictMode>
);
