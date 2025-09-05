import { Link, NavLink } from "react-router-dom";
import { Button } from "./button";

const navItem = ({ isActive }: { isActive: boolean }) =>
  "px-3 py-2 rounded-xl text-sm font-medium transition " +
  (isActive
    ? "bg-accent text-accent-foreground"
    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground");

export default function MainNavbar() {
  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur bg-background/70 border-b">
      <div className="mx-auto max-w-7xl h-16 flex items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <img src="/logo.svg" alt="My AI" className="h-7 w-7" /> {/* 👈 от public/ */}
          <span className="font-semibold tracking-tight">My AI</span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          <NavLink to="/categories" className={navItem}>Categories</NavLink>
          <NavLink to="/learn" className={navItem}>Learn</NavLink>
        </nav>

        <div className="flex items-center gap-2">
          <Link to="/discover" className="hidden sm:inline-flex">
            <Button variant="outline">Open Planner</Button>
          </Link>
          <Button>Sign in</Button>
        </div>
      </div>
    </header>
  );
}
