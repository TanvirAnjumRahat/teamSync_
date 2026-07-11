'use client';

import { useState } from 'react';
import { ApiClient } from '@/lib/api';

interface AIAnalysisResult {
  summary: string;
  suggestedPriority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  estimatedHours: number;
  suggestedLabels: string[];
}

interface AIAnalyzeButtonProps {
  title: string;
  description: string;
  onResult: (result: AIAnalysisResult) => void;
  onError?: (error: string) => void;
}

export function AIAnalyzeButton({ title, description, onResult, onError }: AIAnalyzeButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AIAnalysisResult | null>(null);

  const handleAnalyze = async () => {
    if (!title.trim()) {
      setError('Please enter a task title first');
      if (onError) onError('Please enter a task title first');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await ApiClient.analyzeTask(title, description);
      
      if (response.success && response.data) {
        const data = response.data as any;
        const analysisResult: AIAnalysisResult = {
          summary: data.summary,
          suggestedPriority: data.suggestedPriority,
          estimatedHours: data.estimatedHours,
          suggestedLabels: data.suggestedLabels || [],
        };
        setResult(analysisResult);
        onResult(analysisResult);
      } else {
        setError('Failed to analyze task. Please try again.');
        if (onError) onError('Failed to analyze task');
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'AI analysis failed';
      setError(errorMsg);
      if (onError) onError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={handleAnalyze}
        disabled={loading || !title.trim()}
        className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-medium rounded-lg transition-all duration-200"
      >
        {loading ? (
          <>
            <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Analyzing...
          </>
        ) : (
          <>
            <span className="text-lg">🤖</span>
            AI Analyze Task
          </>
        )}
      </button>

      {error && (
        <div className="bg-red-900/20 border border-red-700 text-red-400 px-3 py-2 rounded-lg text-sm">
          {error}
        </div>
      )}

      {result && !loading && (
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 space-y-3">
          <div className="flex items-center gap-2 text-green-400 text-sm">
            <span>✅</span>
            <span className="font-medium">AI Analysis Complete</span>
          </div>
          
          <div>
            <p className="text-xs text-gray-400 font-medium">SUMMARY</p>
            <p className="text-sm text-gray-200">{result.summary}</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-gray-400 font-medium">SUGGESTED PRIORITY</p>
              <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium mt-1 ${
                result.suggestedPriority === 'URGENT' ? 'bg-red-900/50 text-red-300' :
                result.suggestedPriority === 'HIGH' ? 'bg-orange-900/50 text-orange-300' :
                result.suggestedPriority === 'MEDIUM' ? 'bg-blue-900/50 text-blue-300' :
                'bg-gray-700 text-gray-300'
              }`}>
                {result.suggestedPriority}
              </span>
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium">ESTIMATED HOURS</p>
              <p className="text-sm text-gray-200">{result.estimatedHours}h</p>
            </div>
          </div>

          {result.suggestedLabels.length > 0 && (
            <div>
              <p className="text-xs text-gray-400 font-medium">SUGGESTED LABELS</p>
              <div className="flex flex-wrap gap-1 mt-1">
                {result.suggestedLabels.map((label, index) => (
                  <span key={index} className="px-2 py-0.5 bg-gray-700 text-gray-300 rounded text-xs">
                    {label}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
