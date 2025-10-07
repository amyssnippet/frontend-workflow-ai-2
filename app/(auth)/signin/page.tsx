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
      const API = 'http://localhost:8000'
      const url = `${API}/signin`
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: email, password }),
      });

      const data = await res.json()
      if (!res.ok) {
        setError(data.detail || data.error || 'Failed to sign in')
        return
      }

      // store tokens
      if (data.access_token) localStorage.setItem('accessToken', data.access_token)
      if (data.refresh_token) localStorage.setItem('refreshToken', data.refresh_token)
      router.replace('/')
    } catch (e) {
      setError("An unexpected error occurred");
    }
  };

  return (


      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md bg-white dark:bg-gray-800/90 backdrop-blur-sm p-8 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700">
          <form onSubmit={handleSubmit} className="space-y-6">
            <h2 className="text-2xl md:text-3xl font-semibold text-gray-900 dark:text-white text-center mb-4">Sign In</h2>
          {error && (
            <div className="text-center mb-4">
              <p className="text-red-600 text-sm bg-red-100 border border-red-300 px-4 py-3 rounded-md inline-block">{error}</p>
              {error?.toLowerCase().includes('email not verified') && (
                <div className="mt-2">
                  <button onClick={async () => {
                    const API = process.env.NEXT_PUBLIC_API_URL ?? ''
                    const url = API ? `${API}/resend-verification` : '/resend-verification'
                    await fetch(url, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ identifier: email }) })
                    alert('Verification email resent')
                  }} className="text-sm text-indigo-600 underline">Resend verification email</button>
                </div>
              )}
            </div>
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
              className="w-full rounded-lg border border-gray-200 dark:border-gray-700 p-3 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-900 dark:text-white bg-white/90"
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
            className="w-full py-3 bg-green-700 hover:bg-green-800 text-white font-semibold rounded-lg shadow-md transition duration-150"
          >
            Sign In
          </button>

          <p className="text-center text-sm text-gray-600 dark:text-gray-400 mt-6">
            Don't have an account?{" "}
            <Link href="/signup" className="text-indigo-600 hover:underline">
              Sign Up
            </Link>
          </p>
          </form>
        </div>
      </div>

  );
}
