"use client"

import React from "react"
import { FileText, LayoutTemplateIcon, History, TrendingUp, Zap, Users } from "lucide-react"

export default function Dashboard() {
  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-800 h-full overflow-y-auto">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Welcome to FlowAI
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2 text-lg">
            Your intelligent flowchart workspace powered by AI
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="p-2 bg-indigo-100 dark:bg-indigo-900/20 rounded-lg">
                <FileText className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div className="ml-4">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                  12
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Flowcharts</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                <LayoutTemplateIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="ml-4">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                  5
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Templates Used</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <TrendingUp className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="ml-4">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                  3
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">This Week</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                <Zap className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="ml-4">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                  95%
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">AI Accuracy</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Quick Actions
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => window.location.href = '/new-flowchart'}
                className="p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-indigo-500 dark:hover:border-indigo-400 transition-colors group"
              >
                <FileText className="h-8 w-8 text-gray-400 group-hover:text-indigo-500 dark:group-hover:text-indigo-400 mx-auto mb-2 transition-colors" />
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  Create New
                </p>
              </button>

              <button 
                onClick={() => window.location.href = '/templates'}
                className="p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-indigo-500 dark:hover:border-indigo-400 transition-colors group"
              >
                <LayoutTemplateIcon className="h-8 w-8 text-gray-400 group-hover:text-indigo-500 dark:group-hover:text-indigo-400 mx-auto mb-2 transition-colors" />
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  Templates
                </p>
              </button>

              <button 
                onClick={() => window.location.href = '/history'}
                className="p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-indigo-500 dark:hover:border-indigo-400 transition-colors group"
              >
                <History className="h-8 w-8 text-gray-400 group-hover:text-indigo-500 dark:group-hover:text-indigo-400 mx-auto mb-2 transition-colors" />
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  Recent Files
                </p>
              </button>

              <button className="p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-indigo-500 dark:hover:border-indigo-400 transition-colors group">
                <TrendingUp className="h-8 w-8 text-gray-400 group-hover:text-indigo-500 dark:group-hover:text-indigo-400 mx-auto mb-2 transition-colors" />
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  Analytics
                </p>
              </button>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Recent Activity
            </h2>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900/20 rounded-full flex items-center justify-center">
                  <FileText className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    Created "User Registration Process"
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    2 hours ago
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                  <LayoutTemplateIcon className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    Used "E-commerce Workflow" template
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Yesterday
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                  <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    Shared "API Integration Flow"
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    2 days ago
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Highlights */}
        <div className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 p-8 rounded-lg border border-indigo-200 dark:border-indigo-800">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              AI-Powered Flowchart Creation
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-2xl mx-auto">
              Transform your ideas into professional flowcharts instantly. Simply describe your process or upload a document, and our AI will generate a beautiful, editable flowchart for you.
            </p>
            <button 
              onClick={() => window.location.href = '/new-flowchart'}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-medium transition-colors inline-flex items-center"
            >
              <Zap className="h-5 w-5 mr-2" />
              Get Started
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
