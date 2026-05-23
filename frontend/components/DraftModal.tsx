import React, { useState } from 'react';
import { JobMatch } from '../types.ts';
import { X, Send, Loader2, Copy, Check, Sparkles } from 'lucide-react';
import { draftApplicationAnswer } from '../services/gemini.ts';

interface DraftModalProps {
  job: JobMatch;
  resume: string;
  onClose: () => void;
}

export const DraftModal: React.FC<DraftModalProps> = ({ job, resume, onClose }) => {
  const [question, setQuestion] = useState('');
  const [userDraft, setUserDraft] = useState('');
  const [answer, setAnswer] = useState('');
  const [isDrafting, setIsDrafting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDraft = async () => {
    if (!question.trim()) return;
    
    setIsDrafting(true);
    setError(null);
    setAnswer('');
    setCopied(false);
    
    try {
      const result = await draftApplicationAnswer(job, resume, question, userDraft);
      setAnswer(result);
    } catch (err) {
      setError("Failed to generate answer. Please try again.");
    } finally {
      setIsDrafting(false);
    }
  };

  const handleCopy = async () => {
    const fallbackCopy = () => {
      try {
        const textArea = document.createElement("textarea");
        textArea.value = answer;
        // Move textarea out of viewport so it's invisible
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        textArea.style.top = "-999999px";
        document.body.appendChild(textArea);
        
        textArea.focus();
        textArea.select();
        
        document.execCommand('copy');
        textArea.remove();
        
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Fallback copy failed', err);
      }
    };

    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(answer);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.warn('Clipboard API failed or blocked, using fallback', err);
        fallbackCopy();
      }
    } else {
      fallbackCopy();
    }
  };

  const hasUserDraft = userDraft.trim().length > 0;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl flex flex-col max-h-[90vh] overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Draft Application Answers</h2>
            <p className="text-sm text-gray-500">{job.title} at {job.company}</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-5">
          
          {/* Question Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Paste a question from the application page: <span className="text-red-500">*</span>
            </label>
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="e.g., Why do you want to work here? or Describe a time you solved a complex problem."
              className="w-full h-20 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none text-sm"
            />
          </div>

          {/* User Draft Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your Draft Answer (Optional):
            </label>
            <textarea
              value={userDraft}
              onChange={(e) => setUserDraft(e.target.value)}
              placeholder="Paste your initial thoughts or draft here, and the AI will refine it..."
              className="w-full h-24 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none text-sm"
            />
            <div className="mt-4 flex justify-end">
              <button
                onClick={handleDraft}
                disabled={isDrafting || !question.trim()}
                className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
              >
                {isDrafting ? (
                  <><Loader2 size={16} className="animate-spin" /> {hasUserDraft ? 'Refining...' : 'Drafting...'}</>
                ) : hasUserDraft ? (
                  <><Sparkles size={16} /> Refine My Answer</>
                ) : (
                  <><Send size={16} /> Generate Answer</>
                )}
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200">
              {error}
            </div>
          )}

          {/* Answer Output */}
          {answer && (
            <div className="flex-1 flex flex-col mt-2 border-t border-gray-100 pt-5">
              <div className="flex justify-between items-center mb-3">
                <label className="block text-sm font-bold text-gray-800 flex items-center gap-2">
                  <Sparkles size={16} className="text-indigo-500" />
                  {hasUserDraft ? 'Refined Answer:' : 'AI Generated Answer:'}
                </label>
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-800 transition-colors bg-indigo-50 px-3 py-1.5 rounded-md"
                >
                  {copied ? <><Check size={14} /> Copied!</> : <><Copy size={14} /> Copy to clipboard</>}
                </button>
              </div>
              <div className="flex-1 bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm text-gray-800 whitespace-pre-wrap overflow-y-auto min-h-[150px] shadow-inner">
                {answer}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};