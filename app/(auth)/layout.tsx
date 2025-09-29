"use client";

import React from "react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gradient-to-tr from-indigo-700 via-purple-700 to-pink-700 flex items-center justify-center min-h-screen p-4">
        <div className="bg-white dark:bg-gray-900 shadow-2xl rounded-xl w-full max-w-md relative overflow-hidden">
          {/* Decorative top strip */}
          <div className="h-12 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
          {/* Form container */}
          <div className="p-8">
            {children}
          </div>
        </div>
      </body>
    </html>
  );
}
