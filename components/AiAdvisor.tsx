import React, { useState, useEffect } from 'react';
import { getSmartFinancialAdvice, getDeepDivePlan } from '../services/geminiService';
import { Sparkles, BrainCircuit, ExternalLink, Loader2, X, ChevronRight } from 'lucide-react';
import { AiAdviceResponse } from '../types';

interface Props {
  income: number;
  state: string;
  allocations: any;
}

export const AiAdvisor: React.FC<Props> = ({ income, state, allocations }) => {
  const [advice, setAdvice] = useState<AiAdviceResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [deepPlan, setDeepPlan] = useState<string | null>(null);
  const [deepLoading, setDeepLoading] = useState(false);

  // Debounced effect to fetch quick advice
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchAdvice();
    }, 1500); // 1.5s debounce to avoid spamming API while sliding

    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [income, state]); 

  const fetchAdvice = async () => {
    setLoading(true);
    const result = await getSmartFinancialAdvice(income, state, allocations);
    setAdvice(result);
    setLoading(false);
  };

  const handleDeepDive = async () => {
    setDeepLoading(true);
    const plan = await getDeepDivePlan(income, state);
    setDeepPlan(plan);
    setDeepLoading(false);
  };

  const renderDeepDiveContent = (text: string) => {
    const lines = text.split('\n');
    
    // Inline formatter for bold text (**text**)
    const formatInline = (str: string) => {
      const parts = str.split(/(\*\*.*?\*\*)/g);
      return parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={i} className="font-bold text-slate-900 bg-yellow-50 px-1 rounded">{part.slice(2, -2)}</strong>;
        }
        return part;
      });
    };

    return lines.map((line, index) => {
      const trimmed = line.trim();
      if (!trimmed) return <div key={index} className="h-3" />;

      // H1 / Title (Single # usually not used, but handling it)
      if (trimmed.startsWith('# ')) {
         return (
             <h1 key={index} className="text-2xl font-bold text-indigo-900 mt-6 mb-4 pb-2 border-b border-indigo-100">
                 {formatInline(trimmed.replace(/^#\s*/, ''))}
             </h1>
         );
      }

      // H2
      if (trimmed.startsWith('## ')) {
        return (
          <h2 key={index} className="text-lg font-bold text-slate-800 mt-8 mb-3 flex items-center gap-2">
            <span className="w-1 h-6 bg-indigo-500 rounded-full"></span>
            {formatInline(trimmed.replace(/^##\s*/, ''))}
          </h2>
        );
      }

      // H3
      if (trimmed.startsWith('### ')) {
        return (
          <h3 key={index} className="text-base font-bold text-slate-700 mt-5 mb-2 uppercase tracking-wide">
            {formatInline(trimmed.replace(/^###\s*/, ''))}
          </h3>
        );
      }

      // Separator
      if (trimmed.startsWith('---')) {
          return <hr key={index} className="my-6 border-slate-200 border-dashed" />;
      }

      // Bullet points
      if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
        return (
          <div key={index} className="flex items-start gap-3 mb-2 ml-1">
            <ChevronRight size={14} className="mt-1 shrink-0 text-indigo-400" />
            <div className="text-sm text-slate-600 leading-relaxed">
              {formatInline(trimmed.replace(/^[\*\-]\s*/, ''))}
            </div>
          </div>
        );
      }

      // Numbered lists (rough check)
      if (/^\d+\.\s/.test(trimmed)) {
          return (
            <div key={index} className="flex items-start gap-3 mb-2 ml-1">
                <span className="shrink-0 font-bold text-indigo-600 text-sm mt-0.5">{trimmed.split('.')[0]}.</span>
                <div className="text-sm text-slate-600 leading-relaxed">
                     {formatInline(trimmed.replace(/^\d+\.\s*/, ''))}
                </div>
            </div>
          );
      }

      // Standard paragraph
      return (
        <p key={index} className="text-sm text-slate-600 leading-relaxed mb-3">
          {formatInline(trimmed)}
        </p>
      );
    });
  };

  return (
    <div className="space-y-6">
        {/* Quick Insights Card */}
        <div className="bg-gradient-to-br from-indigo-900 to-slate-900 p-6 rounded-2xl shadow-lg text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 p-3 opacity-10">
                <Sparkles size={120} />
            </div>
            
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 relative z-10">
                <Sparkles className="text-yellow-400" size={20} />
                AI Financial Pulse
            </h2>

            {loading ? (
                <div className="flex items-center gap-2 text-indigo-200 animate-pulse">
                    <Loader2 className="animate-spin" size={16} />
                    <span>Analyzing local market data...</span>
                </div>
            ) : (
                <div className="relative z-10 space-y-4">
                    <div className="prose prose-invert prose-sm max-w-none">
                        <p className="whitespace-pre-wrap leading-relaxed opacity-90">
                            {advice?.markdown || "Adjust the sliders to get real-time AI insights."}
                        </p>
                    </div>
                    {advice?.sources && advice.sources.length > 0 && (
                        <div className="pt-3 border-t border-white/10">
                            <p className="text-xs text-indigo-300 mb-2">Sources:</p>
                            <div className="flex flex-wrap gap-2">
                                {advice.sources.map((source, idx) => (
                                    <a 
                                        key={idx} 
                                        href={source.uri} 
                                        target="_blank" 
                                        rel="noreferrer"
                                        className="text-xs bg-white/10 hover:bg-white/20 px-2 py-1 rounded-md flex items-center gap-1 transition-colors truncate max-w-[200px]"
                                    >
                                        <ExternalLink size={10} />
                                        {source.title}
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>

        {/* Deep Dive Button & Section */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
                    <BrainCircuit className="text-pink-600" size={20} />
                    Deep Dive Planning
                </h2>
            </div>
            {!deepPlan && (
                <p className="text-slate-500 text-sm mb-4">
                    Need a roadmap? Generate a comprehensive 20-year strategy based on your profile using our advanced reasoning model.
                </p>
            )}
            
            {!deepPlan && (
                <button 
                    onClick={handleDeepDive}
                    disabled={deepLoading}
                    className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
                >
                    {deepLoading ? <Loader2 className="animate-spin" /> : <BrainCircuit size={18} />}
                    {deepLoading ? "Thinking (this may take 20s)..." : "Generate 20-Year Plan"}
                </button>
            )}

            {deepPlan && (
                <div className="mt-2 animate-in fade-in slide-in-from-bottom-4 duration-500">
                     <div className="bg-slate-50 rounded-xl border border-slate-200 p-6 max-h-[600px] overflow-y-auto custom-scrollbar">
                        {renderDeepDiveContent(deepPlan)}
                     </div>
                     <button 
                        onClick={() => setDeepPlan(null)}
                        className="mt-4 w-full py-2 text-sm text-slate-500 hover:text-slate-800 font-medium border border-transparent hover:border-slate-200 rounded-lg transition-all flex items-center justify-center gap-2"
                    >
                        <X size={14} /> Close Plan
                    </button>
                </div>
            )}
        </div>
    </div>
  );
};