import { GoogleGenAI, Type } from "@google/genai";
import { AiAdviceResponse } from "../types";

const apiKey = process.env.API_KEY || '';

// Initialize without creating the instance immediately to allow for key check if needed, 
// though the prompt implies we use process.env.API_KEY directly.
const ai = new GoogleGenAI({ apiKey });

export const getSmartFinancialAdvice = async (
  income: number,
  state: string,
  allocations: any
): Promise<AiAdviceResponse> => {
  if (!apiKey) {
    return { markdown: "API Key is missing. Please check your environment configuration." };
  }

  try {
    const prompt = `
      I am a user living in ${state} with an annual income of $${income.toLocaleString()}.
      My current estimated monthly budget is:
      - Housing: $${allocations.housing.toFixed(0)}
      - Food: $${allocations.food.toFixed(0)}
      - General Spending: $${allocations.general.toFixed(0)}
      - Savings/Investments: $${allocations.savings.toFixed(0)}

      Please provide a brief, helpful financial assessment. 
      Use Google Search to find the current cost of living index or average rent in ${state} to see if my housing budget is realistic.
      Keep it under 200 words. Format with Markdown.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      }
    });

    const text = response.text || "I couldn't generate advice at this moment.";
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    const sources = chunks?.map((c: any) => ({
      uri: c.web?.uri,
      title: c.web?.title
    })).filter((s: any) => s.uri && s.title) || [];

    return {
      markdown: text,
      sources
    };

  } catch (error) {
    console.error("Gemini Flash Error:", error);
    return { markdown: "Sorry, I encountered an error while analyzing your budget." };
  }
};

export const findHousingOptions = async (
  location: string,
  type: 'rent' | 'buy',
  monthlyBudget: number
): Promise<AiAdviceResponse> => {
  if (!apiKey) {
    return { markdown: "API Key is missing." };
  }

  try {
    const budgetString = type === 'rent' 
      ? `$${monthlyBudget.toFixed(0)}/month` 
      : `a monthly mortgage of $${monthlyBudget.toFixed(0)} (approx. home price $${(monthlyBudget * 180).toLocaleString()})`;

    const prompt = `
      Find 3-4 specific real estate listings or rental communities in or near ${location} that would fit a budget of ${budgetString}.
      
      Focus on finding actual links to Zillow, Redfin, Apartments.com, or local listings.
      
      For each finding, provide:
      - A brief description (Neighborhood, Beds/Baths).
      - Estimated Price.
      
      Format the response in Markdown.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      }
    });

    const text = response.text || "No listings found.";
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    const sources = chunks?.map((c: any) => ({
      uri: c.web?.uri,
      title: c.web?.title
    })).filter((s: any) => s.uri && s.title) || [];

    return {
      markdown: text,
      sources
    };
  } catch (error) {
    console.error("Housing Search Error:", error);
    return { markdown: "Unable to search for housing at this time." };
  }
}

export const getDeepDivePlan = async (
  income: number,
  state: string
): Promise<string> => {
  if (!apiKey) return "API Key missing.";

  try {
    const prompt = `
      Create a comprehensive, 20-year financial roadmap for a user earning $${income.toLocaleString()} annually in ${state}.
      
      Consider:
      1. State-specific tax implications.
      2. Inflation and cost of living adjustments for ${state}.
      3. Investment strategies for the savings portion (assume a balanced portfolio).
      4. Milestones (buying a home, emergency fund, retirement).
      
      Structure the response clearly with Markdown headings, bullet points, and a year-by-year or phase-by-phase breakdown.
      Be realistic but encouraging.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 32768 },
      }
    });

    return response.text || "Unable to generate plan.";

  } catch (error) {
    console.error("Gemini Thinking Error:", error);
    return "An error occurred while generating the deep dive plan. Please try again later.";
  }
};