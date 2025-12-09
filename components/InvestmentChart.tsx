import React, { useMemo, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { INVESTMENT_RETURN_RATE, BANK_RETURN_RATE } from '../constants';
import { TrendingUp, Landmark, ArrowRightLeft, RotateCcw, Sparkles, ExternalLink } from 'lucide-react';

interface Props {
  monthlyContribution: number;
}

export const InvestmentChart: React.FC<Props> = ({ monthlyContribution }) => {
  // Default to 40% investing, 60% banking (User requested default split: 60% bank / 40% invest)
  const DEFAULT_INVEST_RATIO = 0.4;
  
  // State for the split slider (0 to 1)
  const [investRatio, setInvestRatio] = useState(DEFAULT_INVEST_RATIO);

  // State for return rates (displayed as percentages, stored as whole numbers for input)
  const [investReturnRatePercent, setInvestReturnRatePercent] = useState(INVESTMENT_RETURN_RATE * 100);
  const [bankReturnRatePercent, setBankReturnRatePercent] = useState(BANK_RETURN_RATE * 100);

  const handleReset = () => {
    setInvestRatio(DEFAULT_INVEST_RATIO);
    setInvestReturnRatePercent(INVESTMENT_RETURN_RATE * 100);
    setBankReturnRatePercent(BANK_RETURN_RATE * 100);
  };

  const monthlyInvest = monthlyContribution * investRatio;
  const monthlyBank = monthlyContribution * (1 - investRatio);

  const data = useMemo(() => {
    const years = 30;
    const result = [];
    
    let currentInvestAmount = 0;
    let currentBankAmount = 0;

    // Convert percentages back to decimals for calculation
    const investRateDecimal = investReturnRatePercent / 100;
    const bankRateDecimal = bankReturnRatePercent / 100;

    for (let year = 0; year <= years; year++) {
      result.push({
        year: `Year ${year}`,
        investAmount: Math.round(currentInvestAmount),
        bankAmount: Math.round(currentBankAmount),
        // For the gap chart, we want 'invest' as the top line usually, 
        // but rechart's 'range' behavior for area charts isn't native like this.
        // We will just plot two areas. 
        // To make a "fill between", we can stack them or use a hack, 
        // but plotting both lines clearly is often enough if one is filled semi-transparently.
        difference: Math.round(currentInvestAmount - currentBankAmount),
      });

      // Compound for next year
      currentInvestAmount = (currentInvestAmount + (monthlyInvest * 12)) * (1 + investRateDecimal);
      currentBankAmount = (currentBankAmount + (monthlyBank * 12)) * (1 + bankRateDecimal);
    }
    return result;
  }, [monthlyInvest, monthlyBank, investReturnRatePercent, bankReturnRatePercent]);

  // For charts - compact
  const formatCurrencyCompact = (val: number) => {
    if (val >= 1000000) return `$${(val / 1000000).toFixed(1)}M`;
    if (val >= 1000) return `$${(val / 1000).toFixed(0)}k`;
    return `$${val.toFixed(0)}`;
  };

  // For detailed view - precise with cents
  const formatDetailedCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(val);
  };

  const CustomTooltip = ({ active, payload, label, showDifference }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-slate-100 shadow-lg rounded-xl">
          <p className="text-xs text-slate-500 mb-1">{label}</p>
          {payload.map((entry: any, index: number) => (
             <div key={index} className="flex items-center gap-2 text-sm font-medium" style={{ color: entry.color }}>
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }}></span>
                <span>{entry.name}: {formatCurrencyCompact(entry.value)}</span>
             </div>
          ))}
          {showDifference && payload[0] && (
             <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between gap-4">
                 <span className="text-xs font-semibold text-slate-500">Difference</span>
                 <span className="text-sm font-bold text-emerald-600">+{formatCurrencyCompact(payload[0].payload.difference)}</span>
             </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
            <span className="bg-purple-100 text-purple-600 p-2 rounded-lg text-sm">Step 4</span>
            Wealth Projection
        </h2>
        <button 
            onClick={handleReset}
            className="text-sm text-slate-500 hover:text-indigo-600 flex items-center gap-1 transition-colors px-3 py-1 rounded-lg hover:bg-slate-50"
            title="Reset to defaults"
        >
            <RotateCcw size={14} />
            Reset
        </button>
      </div>

      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-8">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
            {/* Bank Savings Rate Input */}
            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm">
                <Landmark size={16} className="text-blue-500 shrink-0"/>
                <span className="text-sm font-medium text-slate-700 whitespace-nowrap">Bank Rate:</span>
                <div className="relative flex items-center">
                    <input 
                        type="number" 
                        value={bankReturnRatePercent}
                        onChange={(e) => setBankReturnRatePercent(Math.max(0, Number(e.target.value)))}
                        className="w-16 text-right font-bold text-blue-600 bg-transparent outline-none border-b border-dashed border-blue-200 focus:border-blue-500 text-sm"
                        step="0.01"
                    />
                    <span className="text-xs font-bold text-slate-500 ml-0.5">%</span>
                </div>
            </div>

            {/* Investing Rate Input */}
            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm">
                <span className="text-sm font-medium text-slate-700 whitespace-nowrap">Invest Rate:</span>
                <div className="relative flex items-center">
                    <input 
                        type="number" 
                        value={investReturnRatePercent}
                        onChange={(e) => setInvestReturnRatePercent(Math.max(0, Number(e.target.value)))}
                        className="w-12 text-right font-bold text-purple-600 bg-transparent outline-none border-b border-dashed border-purple-200 focus:border-purple-500 text-sm"
                        step="0.1"
                    />
                    <span className="text-xs font-bold text-slate-500 ml-0.5">%</span>
                </div>
                <TrendingUp size={16} className="text-purple-500 shrink-0"/>
            </div>
        </div>
        
        <input 
            type="range" 
            min="0" 
            max="1" 
            step="0.05"
            value={investRatio}
            onChange={(e) => setInvestRatio(parseFloat(e.target.value))}
            className="w-full h-3 bg-gradient-to-r from-blue-400 to-purple-500 rounded-lg appearance-none cursor-pointer mb-2"
        />

        <div className="flex justify-between text-xs text-slate-500 font-medium">
            <span>{Math.round((1 - investRatio) * 100)}% Bank ({formatDetailedCurrency(monthlyBank)}/mo)</span>
            <span>{Math.round(investRatio * 100)}% Invest ({formatDetailedCurrency(monthlyInvest)}/mo)</span>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="space-y-8">
        
        {/* Row 1: The Two Paths (Swapped order to match inputs: Bank Left, Invest Right) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Chart 1: Banking */}
            <div className="h-48 border border-slate-100 rounded-xl p-2 relative">
                <div className="absolute top-2 left-3 z-10">
                    <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded-md border border-blue-100">Bank Savings Growth</span>
                </div>
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data} margin={{ top: 25, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorBank" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="year" hide />
                        <YAxis tick={{fontSize: 10}} tickFormatter={(val) => `$${val/1000}k`} tickLine={false} axisLine={false} />
                        <Tooltip content={<CustomTooltip />} />
                        <Area type="monotone" dataKey="bankAmount" stroke="#3b82f6" fill="url(#colorBank)" strokeWidth={2} name="Bank Savings" />
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            {/* Chart 2: Investing */}
            <div className="h-48 border border-slate-100 rounded-xl p-2 relative">
                <div className="absolute top-2 left-3 z-10">
                    <span className="text-xs font-semibold text-purple-600 bg-purple-50 px-2 py-1 rounded-md border border-purple-100">Investing Growth</span>
                </div>
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data} margin={{ top: 25, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorInvest" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.1}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="year" hide />
                        <YAxis tick={{fontSize: 10}} tickFormatter={(val) => `$${val/1000}k`} tickLine={false} axisLine={false} />
                        <Tooltip content={<CustomTooltip />} />
                        <Area type="monotone" dataKey="investAmount" stroke="#8b5cf6" fill="url(#colorInvest)" strokeWidth={2} name="Investing" />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>

        {/* Row 2: The Difference - Combined view */}
        <div className="h-72 border border-slate-100 rounded-xl p-4 bg-slate-50/50 flex flex-col">
            <div className="mb-2">
                <div className="flex flex-col">
                    <span className="text-sm font-bold text-slate-700 flex items-center gap-2">
                        <ArrowRightLeft size={14} className="text-slate-400"/>
                        The "Compound Effect" Gap
                    </span>
                    <span className="text-xs text-slate-500 max-w-lg leading-tight mt-1">
                        Difference in wealth generated between your Investment portion vs. Bank portion over time.
                        Shaded area represents potential gains.
                    </span>
                </div>
            </div>
            <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorInvest2" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.1}/>
                            </linearGradient>
                             <linearGradient id="colorBank2" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.6}/>
                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.3}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis 
                            dataKey="year" 
                            tick={{fontSize: 12, fill: '#94a3b8'}} 
                            tickLine={false} 
                            axisLine={false}
                            interval={4}
                        />
                        <YAxis 
                            tick={{fontSize: 12, fill: '#94a3b8'}} 
                            tickFormatter={formatCurrencyCompact}
                            tickLine={false}
                            axisLine={false}
                        />
                        <Tooltip content={<CustomTooltip showDifference={true} />} />
                        
                        <Area 
                            type="monotone" 
                            dataKey="investAmount" 
                            stroke="#8b5cf6" 
                            fill="url(#colorInvest2)" 
                            strokeWidth={2}
                            name="Investing"
                            stackId="2"
                        />
                         <Area 
                            type="monotone" 
                            dataKey="bankAmount" 
                            stroke="#3b82f6" 
                            fill="#3b82f6" 
                            fillOpacity={0.1}
                            strokeWidth={2}
                            strokeDasharray="5 5"
                            name="Bank Savings"
                            // No stackId ensures it plots from 0 independently
                        />
                        
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>

        {/* Recommendation Footer */}
        <div className="pt-4 border-t border-slate-100">
            <div className="bg-gradient-to-r from-indigo-50 to-white rounded-xl p-5 border border-indigo-100">
                <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <Sparkles size={18} className="text-indigo-500" />
                    Your Rich Dad's Recommendations
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 mb-1">
                            <TrendingUp size={14} className="text-indigo-600" />
                            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Investing Strategy</p>
                        </div>
                        <p className="text-sm text-slate-700 leading-relaxed">
                            We strongly recommend a <strong>Buy & Hold</strong> strategy with low-cost <strong>Index Funds</strong> (like Fidelity FZROX).
                            <br/>
                            <a 
                                href="https://www.google.com/search?q=index+funds+outperform+active+managers" 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-800 hover:underline font-medium text-xs mt-1"
                            >
                                Why this beats 80% of strategies <ExternalLink size={10} />
                            </a>
                        </p>
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center gap-2 mb-1">
                            <Landmark size={14} className="text-emerald-600" />
                            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Banking</p>
                        </div>
                        <p className="text-sm text-slate-700 leading-relaxed">
                            Maximize your cash growth. We recommend <strong>SoFi</strong> for their high-yield savings (currently ~3.60% APY).
                            <br/>
                            <a 
                                href="https://www.sofi.com/invite/money?gcp=c1e06522-7911-4395-ad6c-ae0e5d58470c&isAliasGcp=false" 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-emerald-600 hover:text-emerald-700 font-bold mt-1 hover:underline"
                            >
                                Get 3.60% APY + Bonus <ExternalLink size={12} />
                            </a>
                        </p>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};