import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AlertTriangle, CheckCircle2, AlertCircle } from "lucide-react";
import { MainProblem } from "@/types/analysis";

interface DetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  score: number;
  problems: MainProblem[];
  strengths?: string[]; // Optional: things they did well
}

export function DetailModal({ isOpen, onClose, title, score, problems, strengths = [] }: DetailModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader className="mb-4">
          <div className="flex items-center justify-between mt-2">
            <DialogTitle className="text-2xl font-bold">{title} Analysis</DialogTitle>
            <div className="text-xl font-bold bg-gray-100 px-3 py-1 rounded-md">
              Score: {score.toFixed(1)}/10
            </div>
          </div>
          <DialogDescription>
            Detailed breakdown of {title.toLowerCase()} issues and recommendations.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {strengths.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold text-lg flex items-center text-emerald-700">
                <CheckCircle2 className="w-5 h-5 mr-2" />
                What's working well
              </h3>
              <ul className="space-y-2">
                {strengths.map((str, idx) => (
                  <li key={idx} className="flex items-start text-sm text-gray-700 bg-emerald-50 p-3 rounded-md border border-emerald-100">
                    <span className="mr-2 mt-0.5 text-emerald-500">•</span>
                    {str}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="space-y-4">
            <h3 className="font-semibold text-lg flex items-center text-gray-800">
              <AlertCircle className="w-5 h-5 mr-2 text-gray-500" />
              Identified Problems & Fixes
            </h3>
            
            {problems.length === 0 ? (
              <p className="text-sm text-gray-500 italic">No major problems identified in this area.</p>
            ) : (
              <div className="space-y-4">
                {problems.map((prob, idx) => {
                  let impactColor = "bg-red-100 text-red-800 border-red-200";
                  let icon = <AlertTriangle className="w-4 h-4 text-red-600" />;
                  
                  if (prob.impact === "Medium") {
                    impactColor = "bg-orange-100 text-orange-800 border-orange-200";
                    icon = <AlertCircle className="w-4 h-4 text-orange-600" />;
                  } else if (prob.impact === "Low") {
                    impactColor = "bg-blue-100 text-blue-800 border-blue-200";
                    icon = <AlertCircle className="w-4 h-4 text-blue-600" />;
                  }

                  return (
                    <div key={idx} className="bg-white border rounded-lg p-4 shadow-sm">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                          {icon}
                          {prob.title}
                        </h4>
                        <span className={`text-xs px-2 py-1 rounded-full border font-medium ${impactColor}`}>
                          {prob.impact} Impact
                        </span>
                      </div>
                      
                      <div className="mt-3 space-y-3 text-sm">
                        <div>
                          <span className="font-medium text-gray-700 block mb-1">Issue:</span>
                          <p className="text-gray-600 bg-gray-50 p-2 rounded">{prob.description}</p>
                        </div>
                        
                        <div>
                          <span className="font-medium text-emerald-700 block mb-1">Suggested Fix:</span>
                          <p className="text-gray-600 bg-emerald-50/50 p-2 rounded border border-emerald-100/50">
                            {prob.suggested_fix}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
