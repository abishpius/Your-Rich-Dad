import React, { useState, useEffect, useMemo } from 'react';
import { IncomeSection } from './components/IncomeSection';
import { BudgetBreakdown } from './components/BudgetBreakdown';
import { InvestmentChart } from './components/InvestmentChart';
import { HousingSearch } from './components/HousingSearch';
import { AiAdvisor } from './components/AiAdvisor';
import { US_STATES } from './constants';
import { BudgetBreakdown as IBudgetBreakdown } from './types';
import { Briefcase } from 'lucide-react';

const App: React.FC = () => {
  const [income, setIncome] = useState<number>(60000);
  const [selectedState, setSelectedState] = useState<string>('California');
  const [budgetData, setBudgetData] = useState<IBudgetBreakdown | null>(null);

  // Calculate budget whenever income or state changes
  useEffect(() => {
    calculateBudget();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [income, selectedState]);

  const calculateBudget = () => {
    const stateInfo = US_STATES.find(s => s.name === selectedState) || US_STATES[0];
    
    // Simple Progressive Federal Tax Estimate (2024 approximation for single filer)
    let federalTax = 0;
    const taxable = Math.max(0, income - 14600); // Standard deduction
    
    // Quick bracket logic
    if (taxable > 609350) federalTax += (taxable - 609350) * 0.37 + 183647;
    else if (taxable > 243725) federalTax += (taxable - 243725) * 0.35 + 55678.5;
    else if (taxable > 191950) federalTax += (taxable - 191950) * 0.32 + 39110.5;
    else if (taxable > 100525) federalTax += (taxable - 100525) * 0.24 + 17168.5;
    else if (taxable > 47150) federalTax += (taxable - 47150) * 0.22 + 5426;
    else if (taxable > 11600) federalTax += (taxable - 11600) * 0.12 + 1160;
    else federalTax += taxable * 0.10;

    // FICA (7.65%)
    const fica = income * 0.0765;

    // State Tax (Simplified based on baseRate in constants)
    // For states with no income tax, baseRate is 0.
    const stateTax = Math.max(0, (income - 14600) * stateInfo.baseRate);

    const totalTax = federalTax + stateTax + fica;
    const netIncome = income - totalTax;
    const netMonthly = netIncome / 12;

    // 50/30/20 Rule Logic adapted for reality
    // Housing is usually the biggest chunk. 
    // Let's aim for: 35% Housing, 15% Food, 20% General, 30% Savings (Ideally)
    
    const allocations = {
      housing: netMonthly * 0.35,
      food: netMonthly * 0.15,
      general: netMonthly * 0.20,
      savings: netMonthly * 0.30,
    };

    setBudgetData({
      netMonthlyIncome: netMonthly,
      taxes: {
        federal: federalTax,
        state: stateTax,
        fica: fica,
        total: totalTax
      },
      allocations
    });
  };

  const updateAllocation = (category: keyof IBudgetBreakdown['allocations'], newVal: number) => {
    if (!budgetData) return;

    const { allocations, netMonthlyIncome } = budgetData;
    if (netMonthlyIncome <= 0) return;

    // Clamp new value
    let safeVal = Math.max(0, Math.min(newVal, netMonthlyIncome));
    const currentVal = allocations[category];
    const diff = safeVal - currentVal; // + means we need money, - means we have extra

    if (Math.abs(diff) < 0.001) return;

    const newAllocations = { ...allocations };
    newAllocations[category] = safeVal;

    let remainingDiff = diff;

    if (remainingDiff > 0) {
        // We increased a category, need to take from others.
        // Priority for removal: Savings -> General -> Food -> Housing
        // We take from the 'wants' and 'savings' first before touching necessities.
        const withdrawalOrder: (keyof typeof allocations)[] = ['savings', 'general', 'food', 'housing'];
        
        for (const source of withdrawalOrder) {
            if (source === category) continue; // Don't take from self
            if (Math.abs(remainingDiff) < 0.001) break;

            const available = newAllocations[source];
            // If the source is 0, we can't take anything
            if (available <= 0) continue;

            const toTake = Math.min(available, remainingDiff);
            
            newAllocations[source] -= toTake;
            remainingDiff -= toTake;
        }
    } else {
        // We decreased a category, we have extra money to give back.
        // Default behavior: Add to Savings first.
        const depositOrder: (keyof typeof allocations)[] = ['savings', 'general'];
        
        let moneyToGive = Math.abs(remainingDiff);
        
        for (const target of depositOrder) {
            if (target === category) continue;
            // Dump into the first available priority bucket (Savings)
            newAllocations[target] += moneyToGive;
            moneyToGive = 0; 
            break;
        }
    }

    // Final sanity check for rounding errors to ensure strict equality
    const sum = Object.values(newAllocations).reduce((a, b) => a + b, 0);
    const error = netMonthlyIncome - sum;
    if (Math.abs(error) > 0.001) {
         // Apply tiny rounding error to savings
         newAllocations.savings += error;
    }

    setBudgetData({
        ...budgetData,
        allocations: newAllocations
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-12">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-2 rounded-lg text-white">
                <Briefcase size={24} />
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
              Your Rich Dad
            </h1>
          </div>
          <div className="text-sm text-slate-500 hidden sm:block">
            Smart Budgeting & Wealth Projection
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Controls & Dashboard (8 cols) */}
          <div className="lg:col-span-8 space-y-8">
            <IncomeSection 
              income={income} 
              setIncome={setIncome} 
              selectedState={selectedState}
              setSelectedState={setSelectedState}
            />
            
            {budgetData && (
              <div className="grid grid-cols-1 gap-8">
                <BudgetBreakdown 
                  data={budgetData} 
                  onUpdateAllocation={updateAllocation}
                  onReset={calculateBudget}
                />
                
                <HousingSearch 
                  defaultLocation={selectedState} 
                  monthlyBudget={budgetData.allocations.housing} 
                />

                <InvestmentChart monthlyContribution={budgetData.allocations.savings} />
              </div>
            )}
          </div>

          {/* Right Column: AI Advisor (4 cols) */}
          <div className="lg:col-span-4">
             <div className="lg:sticky lg:top-24">
                {budgetData && (
                    <AiAdvisor 
                        income={income} 
                        state={selectedState} 
                        allocations={budgetData.allocations} 
                    />
                )}
             </div>
          </div>

        </div>
      </main>
    </div>
  );
};

export default App;