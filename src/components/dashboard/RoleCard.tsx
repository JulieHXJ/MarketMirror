"use client";

import { ArrowRight, UserCircle2 } from "lucide-react";

interface RoleCardProps {
  role: string;
  score: number;
  tags: string[];
  summary: string;
  onClick?: () => void;
}

export function RoleCard({ role, score, tags, summary, onClick }: RoleCardProps) {
  const isGood = score >= 7.5;
  const isWarning = score >= 5 && score < 7.5;
  
  const scoreColor = isGood ? "text-emerald-600" : isWarning ? "text-amber-600" : "text-rose-600";
  const indicatorColor = isGood ? "bg-emerald-500" : isWarning ? "bg-amber-500" : "bg-rose-500";

  return (
    <div 
      onClick={onClick}
      className={`bg-white border border-slate-200 rounded-xl p-5 shadow-sm shadow-slate-100/50 transition-all duration-200 flex flex-col justify-between h-full group ${
        onClick ? "hover:shadow-md hover:border-slate-300 hover:-translate-y-0.5 cursor-pointer" : ""
      }`}
    >
      <div>
        <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100">
              <UserCircle2 className="w-5 h-5" />
            </div>
            <div className="text-sm font-bold text-slate-800 tracking-tight">{role}</div>
          </div>
          <div className="flex items-center gap-2 opacity-90 bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
            <div className={`w-1.5 h-1.5 rounded-full ${indicatorColor}`} />
            <span className={`text-sm font-extrabold tracking-tighter leading-none ${scoreColor}`}>
              {score.toFixed(1)}
            </span>
          </div>
        </div>
        
        {tags && tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {tags.map((tag, idx) => (
              <span key={idx} className="bg-slate-50 border border-slate-100 text-slate-500 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md">
                {tag}
              </span>
            ))}
          </div>
        )}
        
        <p className="text-xs text-slate-500 leading-relaxed font-medium line-clamp-2">
          {summary}
        </p>
      </div>
      
      {onClick && (
        <div className="mt-5 pt-4 border-t border-slate-50 flex items-center justify-between text-slate-400 group-hover:text-blue-600 transition-colors">
          <span className="text-[10px] font-bold uppercase tracking-widest">Full Perspective</span>
          <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform duration-300" />
        </div>
      )}
    </div>
  );
}