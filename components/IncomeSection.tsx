import React, { useCallback } from 'react';
import { US_STATES } from '../constants';

interface IncomeSectionProps {
  income: number;
  setIncome: (val: number) => void;
  selectedState: string;
  setSelectedState: (val: string) => void;
}

export const IncomeSection: React.FC<IncomeSectionProps> = ({
  income,
  setIncome,
  selectedState,
  setSelectedState,
}) => {
  
  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIncome(Number(e.target.value));
  };

  const handleManualChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    if (!isNaN(val) && val >= 0) {
      setIncome(val);
    }
  };

  // Preset tiers
  const TIERS = [30000, 40000, 50000, 60000, 70000, 80000, 90000, 100000, 120000, 150000, 200000];

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
      <h2 className="text-xl font-semibold text-slate-800 mb-6 flex items-center gap-2">
        <span className="bg-indigo-100 text-indigo-600 p-2 rounded-lg text-sm">Step 1</span>
        Your Details
      </h2>

      <div className="space-y-6">
        {/* State Selection */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Where do you live?</label>
          <select
            value={selectedState}
            onChange={(e) => setSelectedState(e.target.value)}
            className="w-full p-3 rounded-lg border border-slate-300 bg-slate-50 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
          >
            {US_STATES.map((s) => (
              <option key={s.abbreviation} value={s.name}>
                {s.name} ({s.abbreviation})
              </option>
            ))}
          </select>
          <p className="text-xs text-slate-500 mt-2">
            *Determines your estimated state tax burden.
          </p>
        </div>

        {/* Income Input */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Annual Gross Income</label>
          
          <div className="relative mb-4">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-semibold">$</span>
            <input
              type="number"
              value={income}
              onChange={handleManualChange}
              className="w-full pl-8 p-3 text-lg font-bold text-slate-800 bg-white rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div className="mb-4">
            <input
              type="range"
              min="30000"
              max="300000"
              step="5000"
              value={income}
              onChange={handleSliderChange}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
            <div className="flex justify-between text-xs text-slate-400 mt-2">
              <span>$30k</span>
              <span>$150k</span>
              <span>$300k+</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {TIERS.map((tier) => (
              <button
                key={tier}
                onClick={() => setIncome(tier)}
                className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                  income === tier
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300'
                }`}
              >
                ${(tier / 1000).toFixed(0)}k
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};