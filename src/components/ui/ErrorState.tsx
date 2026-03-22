"use client";

import { AlertTriangle, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ErrorStateProps {
  error: string;
  onRetry: () => void;
}

export function ErrorState({ error, onRetry }: ErrorStateProps) {
  return (
    <div className="w-full max-w-2xl mx-auto mt-16 p-8 bg-red-50 border border-red-100 rounded-2xl flex flex-col items-center justify-center text-center space-y-4">
      <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
        <AlertTriangle className="w-6 h-6 text-red-600" />
      </div>
      <div>
        <h3 className="text-xl font-semibold text-red-900 mb-2">
          Analysis Failed
        </h3>
        <p className="text-red-700 max-w-md mx-auto">
          {error || "We couldn't analyze that URL. Please make sure the website is accessible and try again."}
        </p>
      </div>
      <Button 
        onClick={onRetry}
        variant="outline"
        className="mt-4 border-red-200 text-red-700 hover:bg-red-100 hover:text-red-800"
      >
        <RefreshCcw className="w-4 h-4 mr-2" />
        Try Again
      </Button>
    </div>
  );
}
