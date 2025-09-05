import React from 'react';

const ToolDetails = () => {
  const params = new URLSearchParams(window.location.search);
  const name = params.get('name');
  const description = params.get('description');

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6">
      <h1 className="text-4xl font-bold text-slate-800 mb-4">{name}</h1>
      <p className="text-slate-600 text-lg max-w-xl text-center">{description}</p>
      <a
        href="/"
        className="mt-8 text-blue-600 hover:underline font-medium"
      >
        ← Back to home
      </a>
    </div>
  );
};

export default ToolDetails;
