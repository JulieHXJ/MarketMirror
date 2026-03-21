"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, ArrowRight } from "lucide-react";

interface UrlInputFormProps {
  onSubmit: (url: string) => Promise<void>;
}

export function UrlInputForm({ onSubmit }: UrlInputFormProps) {
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;
    
    let targetUrl = url.trim();
    if (!targetUrl.startsWith("http://") && !targetUrl.startsWith("https://")) {
      targetUrl = "https://" + targetUrl;
    }

    setIsLoading(true);
    try {
      await onSubmit(targetUrl);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto flex flex-col sm:flex-row gap-3">
      <div className="relative flex-1">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <span className="text-gray-400 font-medium">https://</span>
        </div>
        <Input
          type="text"
          placeholder="example.com"
          value={url.replace(/^https?:\/\//, '')}
          onChange={(e) => setUrl(e.target.value)}
          disabled={isLoading}
          className="pl-20 h-14 text-lg rounded-xl shadow-sm border-gray-200 focus-visible:ring-blue-500"
          required
        />
      </div>
      <Button 
        type="submit" 
        disabled={isLoading || !url} 
        className="h-14 px-8 text-lg rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-md transition-all"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Analyzing...
          </>
        ) : (
          <>
            Audit Website
            <ArrowRight className="ml-2 h-5 w-5" />
          </>
        )}
      </Button>
    </form>
  );
}
