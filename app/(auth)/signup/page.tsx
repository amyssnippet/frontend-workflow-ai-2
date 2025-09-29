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

    if(password !== confirmPassword){
      setError("Passwords do not match");
      return;
    }

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, email, password }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Failed to sign up");
        return;
      }

      router.replace("/auth/signin"); // Redirect to sign-in page
    } catch (e) {
      setError("An unexpected error occurred");
    }
  };

  return (
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
        className="w-full py-3 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white font-semibold rounded-lg shadow-md hover:brightness-110 transition"
      >
        Sign Up
      </button>

      <p className="text-center text-sm text-gray-600 dark:text-gray-400">
        Already have an account?{" "}
        <a href="/auth/signin" className="text-indigo-600 hover:underline">
          Sign In
        </a>
      </p>
    </form>
  );
}
