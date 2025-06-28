'use client';
import React from 'react';

export default function HomePage() {
  const handleLogin = () => {
    window.location.href = '/login';
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-100 px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-6 text-gray-800">
        Heather Glen Village Residential Website 02
      </h1>
      <button
        onClick={handleLogin}
        className="bg-blue-600 hover:bg-blue-700 text-white text-base sm:text-lg font-semibold py-2 px-5 sm:px-6 rounded-xl shadow-md transition"
      >
        Login
      </button>
    </main>
  );
}
