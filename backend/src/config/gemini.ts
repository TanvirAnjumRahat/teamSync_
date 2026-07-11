// backend/src/config/gemini.ts
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as dotenv from 'dotenv';

dotenv.config();

console.log('🤖 Initializing Gemini...');
console.log(`🔑 Gemini API Key exists: ${!!process.env.GEMINI_API_KEY}`);

// Validate API key
if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_gemini_api_key_here') {
  console.warn('⚠️ GEMINI_API_KEY is missing or using placeholder. AI features will use fallback mode.');
}

// Initialize Gemini with your API key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Choose the best free model (Gemini 1.5 Flash - Fastest & Free)
export const geminiModel = genAI.getGenerativeModel({ 
  model: "gemini-1.5-flash",
  generationConfig: {
    temperature: 0.3,
    topK: 1,
    topP: 0.8,
    maxOutputTokens: 2048,
  },
});

console.log('✅ Gemini initialized with model: gemini-1.5-flash');

export default genAI;
