"use client";

import Link from 'next/link'
import { ArrowLeft, Home, Search, RefreshCw } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full text-center">
        {/* 404 Number */}
        <div className="relative mb-8">
          <h1 className="text-[12rem] md:text-[16rem] font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 leading-none">
            404
          </h1>
          {/* Floating elements */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-4 h-4 bg-indigo-500 rounded-full animate-ping absolute -top-8 left-1/4"></div>
            <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse absolute top-16 right-1/4"></div>
            <div className="w-5 h-5 bg-pink-500 rounded-full animate-bounce absolute -bottom-4 left-1/3"></div>
          </div>
        </div>

        {/* Error Message */}
        <div className="mb-8 space-y-4">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
            Oops! Page Not Found
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-md mx-auto">
            The page you're looking for seems to have vanished into the digital void. 
            Let's get you back on track!
          </p>
        </div>

        {/* Illustration */}
        <div className="mb-10">
          <div className="relative mx-auto w-64 h-48 bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 rounded-2xl flex items-center justify-center overflow-hidden">
            {/* Astronaut/Robot Illustration */}
            <div className="relative">
              <div className="w-20 h-20 bg-white dark:bg-gray-700 rounded-full flex items-center justify-center shadow-lg">
                <Search className="w-8 h-8 text-indigo-500 animate-pulse" />
              </div>
              {/* Floating question marks */}
              <div className="absolute -top-2 -right-2 text-2xl animate-bounce">❓</div>
              <div className="absolute -bottom-1 -left-3 text-xl animate-pulse">❓</div>
            </div>
            
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="grid grid-cols-8 grid-rows-6 h-full w-full">
                {Array.from({ length: 48 }).map((_, i) => (
                  <div
                    key={i}
                    className="border border-indigo-300 dark:border-indigo-700"
                    style={{
                      animationDelay: `${i * 0.1}s`,
                      animation: 'pulse 2s infinite'
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link
            href="/"
            className="group bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white px-8 py-4 rounded-full font-semibold transition-all duration-300 transform hover:scale-105 hover:shadow-lg flex items-center gap-2"
          >
            <Home className="w-5 h-5 group-hover:animate-bounce" />
            Go Home
          </Link>
          
          <button
            onClick={() => window.history.back()}
            className="group bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-8 py-4 rounded-full font-semibold border-2 border-gray-200 dark:border-gray-600 hover:border-indigo-300 dark:hover:border-indigo-500 transition-all duration-300 transform hover:scale-105 flex items-center gap-2"
          >
            <ArrowLeft className="w-5 h-5 group-hover:animate-pulse" />
            Go Back
          </button>
          
          <button
            onClick={() => window.location.reload()}
            className="group bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-8 py-4 rounded-full font-semibold border-2 border-gray-200 dark:border-gray-600 hover:border-green-300 dark:hover:border-green-500 transition-all duration-300 transform hover:scale-105 flex items-center gap-2"
          >
            <RefreshCw className="w-5 h-5 group-hover:animate-spin" />
            Refresh
          </button>
        </div>

        {/* Popular Links */}
        <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Popular Pages
          </h3>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/new-flowchart"
              className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 hover:underline transition-colors"
            >
              Create Flowchart
            </Link>
            <Link
              href="/templates"
              className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 hover:underline transition-colors"
            >
              Templates
            </Link>
            <Link
              href="/history"
              className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 hover:underline transition-colors"
            >
              Recent Files
            </Link>
            <Link
              href="/help"
              className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 hover:underline transition-colors"
            >
              Help Center
            </Link>
          </div>
        </div>

        {/* Fun fact */}
        <div className="mt-8">
          <p className="text-sm text-gray-500 dark:text-gray-400 italic">
            💡 Fun fact: The first 404 error was discovered at CERN in 1992!
          </p>
        </div>
      </div>

      {/* Background decorative elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-indigo-400/20 to-cyan-400/20 rounded-full blur-3xl"></div>
      </div>
    </div>
  )
}
