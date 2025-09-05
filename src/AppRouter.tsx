import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import Categories from "./pages/Categories";
import CategoryView from "./pages/CategoryView";
import Learn from "./pages/Learn";
import ToolDetails from "./pages/ToolDetails";

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />

        {/* Категории */}
        <Route path="/categories" element={<Categories />} />
        <Route path="/categories/:cap" element={<CategoryView />} />

        {/* Други страници по избор */}
        <Route path="/learn" element={<Learn />} />
        <Route path="/tools/:id" element={<ToolDetails />} />

        {/* fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
