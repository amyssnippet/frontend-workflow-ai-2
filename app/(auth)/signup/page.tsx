"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

export default function SignUp() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'
      const url = API ? `${API}/signup` : '/signup'
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, email, password }),
      });

      const data = await res.json()
      if (!res.ok) {
        setError(data.detail || data.message || "Failed to sign up")
        return
      }

      // On successful signup, prompt user to verify email (if sent)
      if (data.verification_sent) {
        router.replace(`/verify-prompt?email=${encodeURIComponent(email)}`)
      } else {
        // verification email not sent (SMTP not configured)
        alert('Signup successful but verification email was not sent. Please sign in or configure email sending on the server.')
        router.replace('/signin')
      }
    } catch (e) {
      setError("An unexpected error occurred");
    }
  };

  return (

      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md bg-white dark:bg-gray-800/90 backdrop-blur-sm p-8 rounded-2xl shadow-lg">
          <form onSubmit={handleSubmit} className="space-y-6">
            <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white">Sign Up</h2>
            {error && <p className="text-red-600 text-sm text-center">{error}</p>}

            <div className="space-y-4">
              <label htmlFor="fullName" className="block text-gray-700 dark:text-gray-300 font-semibold">
                Full Name
              </label>
              <input
                id="fullName"
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 p-3 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Your full name"
              />
            </div>

            <div className="space-y-4">
              <label htmlFor="email" className="block text-gray-700 dark:text-gray-300 font-semibold">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 p-3 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 p-3 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="********"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="block text-gray-700 dark:text-gray-300 font-semibold">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 p-3 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="********"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-green-700 hover:bg-green-800 text-white font-semibold rounded-lg shadow-md transition duration-150"
            >
              Sign Up
            </button>

            <p className="text-center text-sm text-gray-600 dark:text-gray-400">
              Already have an account?{" "}
              <a href="/signin" className="text-indigo-600 hover:underline">
                Sign In
              </a>
            </p>
          </form>
        </div>
      </div>

  );
}
