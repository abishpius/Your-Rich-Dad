import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { BudgetBreakdown as IBudgetBreakdown } from '../types';
import { Home, ShoppingCart, Coffee, TrendingUp, Info, RotateCcw } from 'lucide-react';

interface Props {
  data: IBudgetBreakdown;
  onUpdateAllocation: (category: keyof IBudgetBreakdown['allocations'], value: number) => void;
  onReset: () => void;
}

export const BudgetBreakdown: React.FC<Props> = ({ data, onUpdateAllocation, onReset }) => {
  const chartData = [
    { name: 'Housing', key: 'housing' as const, value: data.allocations.housing, color: '#6366f1', icon: Home, accent: 'accent-indigo-500', bg: 'bg-indigo-50', text: 'text-indigo-600' },
    { name: 'Food', key: 'food' as const, value: data.allocations.food, color: '#f59e0b', icon: ShoppingCart, accent: 'accent-amber-500', bg: 'bg-amber-50', text: 'text-amber-600' },
    { name: 'General', key: 'general' as const, value: data.allocations.general, color: '#ec4899', icon: Coffee, accent: 'accent-pink-500', bg: 'bg-pink-50', text: 'text-pink-600' },
    { name: 'Savings', key: 'savings' as const, value: data.allocations.savings, color: '#10b981', icon: TrendingUp, accent: 'accent-emerald-500', bg: 'bg-emerald-50', text: 'text-emerald-600' },
  ];

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col h-full">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
            <span className="bg-emerald-100 text-emerald-600 p-2 rounded-lg text-sm">Step 2</span>
            Your Monthly Plan
        </h2>
        <button 
            onClick={onReset}
            className="text-sm text-slate-500 hover:text-indigo-600 flex items-center gap-1 transition-colors px-3 py-1 rounded-lg hover:bg-slate-50"
            title="Reset to recommended allocations"
        >
            <RotateCcw size={14} />
            Reset
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        {/* Chart */}
        <div className="h-64 w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="value"
                  animationDuration={500}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center">
                    <p className="text-xs text-slate-500 font-medium">Net Monthly</p>
                    <p className="text-2xl font-bold text-slate-800 tracking-tight">{formatCurrency(data.netMonthlyIncome)}</p>
                </div>
            </div>
        </div>

        {/* Interactive Controls */}
        <div className="grid grid-cols-1 gap-4">
          {chartData.map((item) => (
             <div key={item.key} className="p-3 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:shadow-md hover:border-slate-200 transition-all duration-200">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                        <div className={`p-1.5 rounded-lg ${item.bg} ${item.text}`}>
                            <item.icon size={16} />
                        </div>
                        <span className="text-sm font-semibold text-slate-700">{item.name}</span>
                    </div>
                    
                    {/* Editable Input Field */}
                    <div className="relative w-28">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-medium text-sm pointer-events-none">$</span>
                        <input
                            type="number"
                            value={Math.round(item.value)}
                            onChange={(e) => onUpdateAllocation(item.key, Number(e.target.value))}
                            className="w-full pl-6 pr-2 py-1 text-right font-bold text-slate-800 bg-white border border-slate-200 rounded-md focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all text-sm outline-none"
                        />
                    </div>
                </div>
                
                <div className="relative h-6 flex items-center">
                     <input
                        type="range"
                        min="0"
                        max={data.netMonthlyIncome}
                        step="10"
                        value={item.value}
                        onChange={(e) => onUpdateAllocation(item.key, Number(e.target.value))}
                        className={`w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer ${item.accent} focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-slate-300`}
                    />
                </div>
             </div>
          ))}
        </div>
      </div>
      
      <div className="mt-6 pt-4 border-t border-slate-100">
        <div className="flex items-start gap-2 mb-4 p-3 bg-blue-50 text-blue-700 rounded-lg text-xs">
            <Info size={14} className="mt-0.5 shrink-0" />
            <p>
                <strong>Note:</strong> Your specific state tax for {data.taxes.state > 0 ? 'your selected state' : 'this state'} has already been deducted from your Net Monthly Income figure above.
            </p>
        </div>

        <div className="grid grid-cols-3 gap-4">
            <div>
                <span className="block text-xs text-slate-400 mb-1">Federal Tax</span>
                <span className="block text-sm font-medium text-slate-600">{formatCurrency(data.taxes.federal / 12)}/mo</span>
            </div>
            <div>
                <span className="block text-xs text-slate-400 mb-1">State Tax</span>
                <span className="block text-sm font-medium text-slate-600">{formatCurrency(data.taxes.state / 12)}/mo</span>
            </div>
            <div>
                <span className="block text-xs text-slate-400 mb-1">FICA</span>
                <span className="block text-sm font-medium text-slate-600">{formatCurrency(data.taxes.fica / 12)}/mo</span>
            </div>
        </div>
      </div>
    </div>
  );
};