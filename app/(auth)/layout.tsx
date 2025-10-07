"use client";

import React from "react";
import { ThemeProvider } from "@/components/theme-provider";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-center  p-4">
      <div className=" w-full max-w-md relative overflow-hidden">
        {/* Decorative top strip */}


        {/* Content area */}
        <div className="p-6 md:p-12 flex items-center justify-center">
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            {children}
          </ThemeProvider>
        </div>
      </div>
    </div>
  );
}
