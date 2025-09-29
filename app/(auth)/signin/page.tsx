"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";

// Dynamically import to avoid SSR issues (lottie-player)
const LottiePlayer = dynamic(() => import('react-lottie-player'), { ssr: false });

// Replace with any Lottie JSON from https://lottiefiles.com/

export default function SignIn() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      const res = await fetch("/api/auth/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Failed to sign in");
        return;
      }

      router.replace("/workspace"); // Redirect after login
    } catch (e) {
      setError("An unexpected error occurred");
    }
  };

  return (
    <div className="flex min-h-screen bg-white dark:bg-gray-900">
      {/* Left Form Side */}
      <div className="w-full md:w-[30%] flex flex-col justify-center px-8 md:px-12 py-14">
        <form onSubmit={handleSubmit} className="space-y-6 max-w-md mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white text-center mb-10">Sign In</h2>
          {error && (
            <p className="text-red-600 text-sm text-center bg-red-100 border border-red-300 px-4 py-3 rounded-md mb-4">
              {error}
            </p>
          )}

          <div className="space-y-4">
            <label htmlFor="email" className="block text-gray-700 dark:text-gray-300 font-semibold">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 p-3 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-white"
              placeholder="you@example.com"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="block text-gray-700 dark:text-gray-300 font-semibold">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 p-3 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-white"
              placeholder="********"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white font-semibold rounded-lg shadow-md hover:brightness-110 transition"
          >
            Sign In
          </button>

          <p className="text-center text-sm text-gray-600 dark:text-gray-400 mt-6">
            Don't have an account?{" "}
            <Link href="/auth/signup" className="text-indigo-600 hover:underline">
              Sign Up
            </Link>
          </p>
        </form>
      </div>

      {/* Right Animation Side */}
      <div className="hidden md:flex flex-1 justify-center items-center bg-gradient-to-tr from-indigo-500 via-purple-600 to-pink-600">
        hello
      </div>
    </div>
  );
}
