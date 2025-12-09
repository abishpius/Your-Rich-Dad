export interface FinancialState {
  income: number;
  state: string;
  filingStatus: 'single' | 'married';
}

export interface BudgetBreakdown {
  netMonthlyIncome: number;
  taxes: {
    federal: number;
    state: number;
    fica: number;
    total: number;
  };
  allocations: {
    housing: number; // 30-35%
    food: number; // 10-15%
    general: number; // 15-20%
    savings: number; // 20%+
  };
}

export interface InvestmentDataPoint {
  year: number;
  amount: number;
  contributions: number;
}

export interface StateTaxInfo {
  name: string;
  abbreviation: string;
  baseRate: number; // Simplified effective rate for estimation
  hasNoIncomeTax: boolean;
}

export interface AiAdviceResponse {
  markdown: string;
  sources?: { uri: string; title: string }[];
}
