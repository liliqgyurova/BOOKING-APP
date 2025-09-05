import React from "react";

export interface PopularToolCardProps {
  title: string;
  description: string;
  icon: React.ReactElement;
  rating: number;
  tags: string[];
  buttonLabel: string;
}

export function PopularToolCard({
  title,
  description,
  icon,
  rating,
  tags,
  buttonLabel,
}: PopularToolCardProps) {
  return (
    <div className="rounded-xl bg-white dark:bg-card p-5 shadow-md transition hover:shadow-lg flex flex-col gap-4">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="p-2 rounded-md bg-gray-100 dark:bg-gray-800 text-2xl">
          {icon}
        </div>
        <div className="flex items-center gap-1 text-yellow-500 font-medium text-sm">
          ⭐ {rating.toFixed(1)}
        </div>
      </div>

      {/* Title & Description */}
      <div>
        <h3 className="text-lg font-semibold text-black dark:text-white">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <span
            key={tag}
            className="bg-gray-200 dark:bg-gray-700 text-xs px-2 py-1 rounded-full text-gray-800 dark:text-white"
          >
            {tag}
          </span>
        ))}
      </div>

      {/* Button */}
      <button className="w-full mt-auto bg-pink-500 hover:bg-pink-600 text-white py-2 rounded-lg font-medium text-sm transition">
        {buttonLabel}
      </button>
    </div>
  );
}
