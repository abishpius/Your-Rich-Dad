import React, { useState, useMemo } from 'react';
import { findHousingOptions } from '../services/geminiService';
import { Search, MapPin, Home, Building, ExternalLink, Loader2, ChevronDown, ChevronUp, Calculator, DollarSign, Percent, Clock, PiggyBank } from 'lucide-react';
import { AiAdviceResponse } from '../types';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface Props {
  defaultLocation: string;
  monthlyBudget: number;
}

export const HousingSearch: React.FC<Props> = ({ defaultLocation, monthlyBudget }) => {
  const [activeTab, setActiveTab] = useState<'find' | 'optimize'>('find');

  // --- Search State ---
  const [location, setLocation] = useState(defaultLocation);
  const [type, setType] = useState<'rent' | 'buy'>('rent');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<AiAdviceResponse | null>(null);
  const [isExpanded, setIsExpanded] = useState(true);

  // --- Mortgage Optimizer State ---
  const [loanBalance, setLoanBalance] = useState(300000);
  const [interestRate, setInterestRate] = useState(6.5);
  const [monthlyPayment, setMonthlyPayment] = useState(2500); 
  const [extraPrincipal, setExtraPrincipal] = useState(0);

  // --- Search Handlers ---
  const handleSearch = async () => {
    if (!location) return;
    setLoading(true);
    const data = await findHousingOptions(location, type, monthlyBudget);
    setResults(data);
    setIsExpanded(true);
    setLoading(false);
  };

  // --- Mortgage Calculations ---
  const mortgageData = useMemo(() => {
    const r = interestRate / 100 / 12;
    // Avoid division by zero or negative infinite loops
    if (r <= 0 || monthlyPayment <= loanBalance * r) {
        return null;
    }

    let b1 = loanBalance;
    let b2 = loanBalance;
    let totalInterest1 = 0;
    let totalInterest2 = 0;
    let months1 = 0;
    let months2 = 0;
    const data = [];
    
    // Simulate up to 60 years max to be safe
    const maxMonths = 720;

    for(let i = 0; i <= maxMonths; i++) {
       // Record data point at start of year
       if (i % 12 === 0 && (b1 > 0 || b2 > 0)) {
           data.push({
               year: `Year ${i/12}`,
               balanceStandard: Math.max(0, Math.round(b1)),
               balanceAccelerated: Math.max(0, Math.round(b2))
           });
       }

       // Scenario 1: Standard
       if (b1 > 0) {
           const interest = b1 * r;
           const principal = Math.min(b1, monthlyPayment - interest);
           totalInterest1 += interest;
           b1 -= principal;
           months1++;
       }

       // Scenario 2: Accelerated
       if (b2 > 0) {
           const interest = b2 * r;
           const totalPay = monthlyPayment + extraPrincipal;
           const principal = Math.min(b2, totalPay - interest);
           totalInterest2 += interest;
           b2 -= principal;
           months2++;
       }

       if (b1 <= 0 && b2 <= 0) break;
    }

    return {
        interestSaved: Math.round(totalInterest1 - totalInterest2),
        timeSavedMonths: Math.max(0, months1 - months2),
        totalInterestStandard: Math.round(totalInterest1),
        payoffYearsStandard: (months1 / 12).toFixed(1),
        payoffYearsAccelerated: (months2 / 12).toFixed(1),
        chartData: data
    };

  }, [loanBalance, interestRate, monthlyPayment, extraPrincipal]);


  // --- Helper Renderer for Markdown ---
  const renderMarkdown = (text: string) => {
    // Helper to format inline styles (bold, links)
    const formatInline = (str: string) => {
      const parts = str.split(/(\*\*.*?\*\*|\[.*?\]\(.*?\))/g);
      return parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={i} className="font-semibold text-slate-900">{part.slice(2, -2)}</strong>;
        }
        if (part.startsWith('[') && part.includes('](') && part.endsWith(')')) {
          const match = part.match(/\[(.*?)\]\((.*?)\)/);
          if (match) {
            return (
              <a 
                key={i} 
                href={match[2]} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-blue-600 hover:text-blue-800 hover:underline inline-flex items-center gap-0.5"
              >
                {match[1]}
                <ExternalLink size={10} className="mb-0.5" />
              </a>
            );
          }
        }
        return part;
      });
    };

    return text.split('\n').map((line, index) => {
      const trimmed = line.trim();
      if (!trimmed) return <div key={index} className="h-3" />;

      if (trimmed.startsWith('###')) {
        return (
          <h3 key={index} className="text-lg font-bold text-slate-800 mt-5 mb-3 border-b border-slate-100 pb-1">
            {formatInline(trimmed.replace(/^###\s*/, ''))}
          </h3>
        );
      }

      if (trimmed.startsWith('##')) {
        return (
          <h2 key={index} className="text-xl font-bold text-slate-800 mt-6 mb-3">
            {formatInline(trimmed.replace(/^##\s*/, ''))}
          </h2>
        );
      }

      if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
        return (
          <div key={index} className="flex gap-2 mb-2 ml-1 text-slate-600">
            <span className="shrink-0 mt-2 w-1.5 h-1.5 rounded-full bg-blue-400"></span>
            <div className="text-sm leading-relaxed text-slate-700">
              {formatInline(trimmed.replace(/^[\*\-]\s*/, ''))}
            </div>
          </div>
        );
      }

      return (
        <p key={index} className="text-sm text-slate-600 leading-relaxed mb-2">
          {formatInline(trimmed)}
        </p>
      );
    });
  };

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);

  // Limit slider to 1x Monthly Payment (generous enough for extra principal)
  const maxExtraSlider = monthlyPayment; 

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2">
            <span className="bg-blue-100 text-blue-600 p-2 rounded-lg text-sm font-semibold">Step 3</span>
            <h2 className="text-xl font-semibold text-slate-800">Housing Plan</h2>
        </div>
        
        {/* Toggle Tabs */}
        <div className="flex bg-slate-100 p-1 rounded-xl shrink-0">
          <button 
            onClick={() => setActiveTab('find')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'find' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <Search size={14} /> Find Housing
          </button>
          <button 
            onClick={() => setActiveTab('optimize')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'optimize' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <Calculator size={14} /> Optimize Mortgage
          </button>
        </div>
      </div>

      {activeTab === 'find' ? (
        // --- EXISTING SEARCH UI ---
        <div className="animate-in fade-in duration-300">
            <p className="text-slate-500 text-sm mb-6">
                Find homes or rentals that match your <span className="font-bold text-slate-700">${monthlyBudget.toLocaleString()}/mo</span> housing budget.
            </p>

            <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="flex-1 relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                    type="text" 
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Enter City, State or Zip"
                    className="w-full pl-10 pr-4 py-2.5 bg-white text-slate-800 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder:text-slate-400"
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
                </div>
                
                <div className="flex bg-slate-100 p-1 rounded-xl shrink-0">
                <button 
                    onClick={() => setType('rent')}
                    className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${type === 'rent' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    <Building size={14} /> Rent
                </button>
                <button 
                    onClick={() => setType('buy')}
                    className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${type === 'buy' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    <Home size={14} /> Buy
                </button>
                </div>

                <button 
                onClick={handleSearch}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed min-w-[120px]"
                >
                {loading ? <Loader2 className="animate-spin" size={18} /> : <Search size={18} />}
                Search
                </button>
            </div>

            {results && (
                <div className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
                <button 
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="w-full flex items-center justify-between p-4 bg-slate-100/50 hover:bg-slate-100 transition-colors text-left focus:outline-none"
                >
                    <span className="font-semibold text-slate-700 text-sm">
                    {isExpanded ? 'Hide Search Results' : 'Show Search Results'}
                    </span>
                    {isExpanded ? <ChevronUp size={16} className="text-slate-500" /> : <ChevronDown size={16} className="text-slate-500" />}
                </button>

                {isExpanded && (
                    <div className="p-6 border-t border-slate-200">
                        <div className="mb-4">
                        {renderMarkdown(results.markdown)}
                        </div>
                        
                        {results.sources && results.sources.length > 0 && (
                        <div className="grid gap-2 grid-cols-1 sm:grid-cols-2 mt-6 pt-4 border-t border-slate-200">
                            {results.sources.map((source, idx) => (
                            <a 
                                key={idx}
                                href={source.uri}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg hover:border-blue-300 hover:shadow-sm transition-all group"
                            >
                                <div className="flex flex-col overflow-hidden">
                                <span className="text-xs text-slate-400 font-medium mb-0.5">Source</span>
                                <span className="text-sm text-slate-700 font-medium truncate group-hover:text-blue-600">{source.title}</span>
                                </div>
                                <ExternalLink size={14} className="text-slate-400 group-hover:text-blue-500 flex-shrink-0 ml-2" />
                            </a>
                            ))}
                        </div>
                        )}
                    </div>
                )}
                </div>
            )}
        </div>
      ) : (
        // --- NEW MORTGAGE OPTIMIZER UI ---
        <div className="animate-in fade-in duration-300 space-y-8">
            <p className="text-slate-500 text-sm">
                Already own a home? See how extra payments can save you thousands in interest and shorten your loan term.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Input Column */}
                <div className="space-y-4 md:col-span-1">
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Current Balance</label>
                        <div className="relative">
                            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                            <input 
                                type="number" 
                                value={loanBalance} 
                                onChange={(e) => setLoanBalance(Number(e.target.value))}
                                className="w-full pl-8 p-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none font-medium text-slate-900 transition-all"
                            />
                        </div>
                    </div>
                    
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Interest Rate (%)</label>
                        <div className="relative">
                            <Percent className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                            <input 
                                type="number" 
                                value={interestRate} 
                                onChange={(e) => setInterestRate(Number(e.target.value))}
                                step="0.1"
                                className="w-full pl-8 p-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none font-medium text-slate-900 transition-all"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Monthly Payment</label>
                        <div className="relative">
                            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                            <input 
                                type="number" 
                                value={monthlyPayment} 
                                onChange={(e) => setMonthlyPayment(Number(e.target.value))}
                                className="w-full pl-8 p-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none font-medium text-slate-900 transition-all"
                            />
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1">Must be higher than interest-only portion.</p>
                    </div>
                </div>

                {/* Extra Payment Slider & Stats */}
                <div className="md:col-span-2 bg-slate-50 p-6 rounded-xl border border-slate-200">
                    <div className="mb-6">
                         <div className="flex justify-between items-center mb-2">
                             <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                <PiggyBank className="text-emerald-500" size={16} />
                                Extra Monthly Principal
                             </label>
                             <div className="relative group">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-600 font-bold z-10 pointer-events-none">+ $</span>
                                <input 
                                    type="number" 
                                    min="0"
                                    value={extraPrincipal}
                                    onChange={(e) => setExtraPrincipal(Math.max(0, Number(e.target.value)))}
                                    className="w-32 pl-10 pr-3 py-1 text-lg font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-right transition-all hover:border-emerald-200"
                                />
                             </div>
                         </div>
                         <input 
                            type="range" 
                            min="0" 
                            max={maxExtraSlider} 
                            step="50"
                            value={extraPrincipal}
                            onChange={(e) => setExtraPrincipal(Number(e.target.value))}
                            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                        />
                         <div className="flex justify-between text-xs text-slate-400 mt-2">
                            <span>$0</span>
                            <span>{formatCurrency(maxExtraSlider / 2)}</span>
                            <span>{formatCurrency(maxExtraSlider)}+</span>
                         </div>
                    </div>

                    {!mortgageData ? (
                        <div className="text-center text-red-500 text-sm py-4">
                            Monthly payment is too low to cover interest. Please increase payment amount.
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                                <div className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-1 flex items-center gap-1">
                                    <Clock size={12} /> Time Saved
                                </div>
                                <div className="text-2xl font-bold text-slate-800">
                                    {Math.floor(mortgageData.timeSavedMonths / 12)} <span className="text-sm font-normal text-slate-500">yrs</span> {mortgageData.timeSavedMonths % 12} <span className="text-sm font-normal text-slate-500">mos</span>
                                </div>
                                <div className="text-xs text-slate-400 mt-1">
                                    New payoff: {mortgageData.payoffYearsAccelerated} years
                                </div>
                            </div>
                            <div className="bg-white p-4 rounded-xl border border-emerald-100 shadow-sm bg-gradient-to-br from-white to-emerald-50">
                                <div className="text-emerald-600/80 text-xs font-medium uppercase tracking-wider mb-1 flex items-center gap-1">
                                    <DollarSign size={12} /> Interest Saved
                                </div>
                                <div className="text-2xl font-bold text-emerald-600">
                                    {formatCurrency(mortgageData.interestSaved)}
                                </div>
                                <div className="text-xs text-emerald-600/60 mt-1">
                                    Total Interest: {formatCurrency(mortgageData.totalInterestStandard - mortgageData.interestSaved)}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Chart */}
            {mortgageData && (
                <div className="h-64 mt-6 border border-slate-100 rounded-xl p-4 bg-white relative">
                     <p className="absolute top-4 left-4 text-xs font-semibold text-slate-400 z-10">Loan Balance Projection</p>
                     <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={mortgageData.chartData} margin={{ top: 20, right: 10, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorStandard" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="#94a3b8" stopOpacity={0.1}/>
                                </linearGradient>
                                <linearGradient id="colorAccelerated" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis 
                                dataKey="year" 
                                tick={{fontSize: 10, fill: '#cbd5e1'}} 
                                tickLine={false} 
                                axisLine={false} 
                                minTickGap={30}
                            />
                            <YAxis 
                                tick={{fontSize: 10, fill: '#cbd5e1'}} 
                                tickFormatter={(val) => `$${val/1000}k`} 
                                tickLine={false} 
                                axisLine={false}
                            />
                            <Tooltip 
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                formatter={(value: number, name: string) => [
                                    formatCurrency(value), 
                                    name === 'balanceStandard' ? 'Standard Plan' : 'With Extra Payment'
                                ]}
                            />
                            <Area 
                                type="monotone" 
                                dataKey="balanceStandard" 
                                stackId="1" 
                                stroke="#94a3b8" 
                                fill="url(#colorStandard)" 
                                strokeWidth={2}
                            />
                            <Area 
                                type="monotone" 
                                dataKey="balanceAccelerated" 
                                stackId="2" 
                                stroke="#10b981" 
                                fill="url(#colorAccelerated)" 
                                strokeWidth={2}
                            />
                        </AreaChart>
                     </ResponsiveContainer>
                </div>
            )}
        </div>
      )}
    </div>
  );
};