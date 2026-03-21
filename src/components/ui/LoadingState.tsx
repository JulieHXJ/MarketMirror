"use client";

import { Loader2 } from "lucide-react";

export function LoadingState() {
  return (
    <div className="w-full max-w-3xl mx-auto mt-16 p-8 bg-white border border-gray-100 rounded-2xl shadow-sm flex flex-col items-center justify-center text-center space-y-6">
      <div className="relative">
        <div className="absolute inset-0 bg-blue-100 rounded-full blur-xl animate-pulse"></div>
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin relative z-10" />
      </div>
      <div className="space-y-2">
        <h3 className="text-xl font-semibold text-gray-900">
          Analyzing Website...
        </h3>
        <p className="text-gray-500 max-w-md mx-auto">
          Our AI is evaluating the design, user experience, conversion funnel, business logic, and growth potential. This usually takes 10-15 seconds.
        </p>
      </div>
      
      {/* Fake progress steps for better UX during long waits */}
      <div className="w-full max-w-sm mt-4 space-y-3">
        <div className="flex items-center text-sm text-gray-600">
          <div className="w-4 h-4 rounded-full bg-green-100 text-green-600 flex items-center justify-center mr-3">✓</div>
          Fetching HTML & Assets
        </div>
        <div className="flex items-center text-sm font-medium text-blue-700 animate-pulse">
          <div className="w-4 h-4 rounded-full border-2 border-blue-600 mr-3"></div>
          Extracting UI/UX context...
        </div>
        <div className="flex items-center text-sm text-gray-400">
          <div className="w-4 h-4 rounded-full border-2 border-gray-300 mr-3"></div>
          Running AI evaluation models
        </div>
      </div>
    </div>
  );
}
