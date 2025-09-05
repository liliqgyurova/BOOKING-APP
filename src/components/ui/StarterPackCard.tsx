import React from "react";

export interface StarterPackCardProps {
  title: string;
  description: string;
  icon: React.ReactElement;
  tools: string[];
}

export const StarterPackCard = ({ title, description, icon, tools }: StarterPackCardProps) => {
  return (
    <div className="bg-white rounded-2xl shadow-md p-6 flex flex-col gap-4 transition hover:shadow-xl">
      <div className="w-10 h-10 flex items-center justify-center bg-blue-100 rounded-full text-xl text-blue-600">
        {icon}
      </div>
      <div>
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="flex flex-wrap gap-2 text-xs">
        {tools.map((tool) => (
          <span
            key={tool}
            className="px-2 py-1 bg-gray-100 text-gray-700 rounded-md"
          >
            {tool}
          </span>
        ))}
      </div>
      <button className="mt-4 bg-gray-900 text-white rounded-lg py-2 text-sm hover:bg-gray-700 transition">
        Get Started
      </button>
    </div>
  );
};
