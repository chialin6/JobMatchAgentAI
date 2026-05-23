import React from 'react';
import { JobMatch } from '../types.ts';
import { ExternalLink, Building2, PenTool, ThumbsUp, ThumbsDown, HelpCircle, AlertCircle } from 'lucide-react';

interface JobCardProps {
  job: JobMatch;
  onDraftClick: (job: JobMatch) => void;
}

export const JobCard: React.FC<JobCardProps> = ({ job, onDraftClick }) => {
  
  const getRecommendationStyle = (rec: string) => {
    switch (rec) {
      case 'Strong Yes':
        return { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-200', icon: <ThumbsUp size={14} className="mr-1" /> };
      case 'Yes':
        return { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', icon: <ThumbsUp size={14} className="mr-1" /> };
      case 'Maybe':
        return { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-200', icon: <HelpCircle size={14} className="mr-1" /> };
      case 'No':
        return { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-200', icon: <ThumbsDown size={14} className="mr-1" /> };
      case 'Error':
        return { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-200', icon: <AlertCircle size={14} className="mr-1" /> };
      default:
        return { bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-200', icon: null };
    }
  };

  const recStyle = getRecommendationStyle(job.recommendation);
  const isError = job.status === 'error';

  return (
    <div className={`bg-white rounded-xl border ${isError ? 'border-red-300' : 'border-gray-200'} shadow-sm hover:shadow-md transition-shadow p-5 flex flex-col h-full`}>
      <div className="flex justify-between items-start mb-3">
        <div className="pr-2">
          <div className={`flex items-center text-sm mb-1 font-medium ${isError ? 'text-red-400' : 'text-gray-500'}`}>
            <Building2 size={14} className="mr-1" />
            {job.company}
          </div>
          <h3 className={`text-lg font-bold leading-tight ${isError ? 'text-red-900' : 'text-gray-900'}`}>
            {job.title}
          </h3>
        </div>
        <div className="flex flex-col items-end gap-2 shrink-0">
          <div className={`px-2.5 py-1 rounded-full border text-xs font-bold flex items-center ${recStyle.bg} ${recStyle.text} ${recStyle.border}`}>
            {recStyle.icon}
            {job.recommendation}
          </div>
          <div className={`text-xs font-semibold ${isError ? 'text-red-400' : 'text-gray-500'}`}>
            {isError ? 'Score: N/A' : `Score: ${job.matchScore}/100`}
          </div>
        </div>
      </div>
      
      <p className={`text-sm mb-4 flex-1 line-clamp-3 ${isError ? 'text-red-700' : 'text-gray-600'}`}>
        {job.snippet}
      </p>
      
      <div className={`rounded-lg p-3 mb-4 text-sm border ${isError ? 'bg-red-50 border-red-100 text-red-800' : 'bg-gray-50 border-gray-100 text-gray-700'}`}>
        <span className={`font-semibold block mb-1 ${isError ? 'text-red-900' : 'text-gray-900'}`}>
          {isError ? 'Error Details:' : 'AI Evaluation:'}
        </span>
        {job.reasoning}
      </div>

      <div className="flex items-center gap-3 mt-auto pt-4 border-t border-gray-100">
        <a 
          href={job.url} 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center gap-2 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
        >
          View Link <ExternalLink size={14} />
        </a>
        <button 
          onClick={() => onDraftClick(job)}
          disabled={isError}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            isError 
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200' 
              : 'bg-indigo-600 text-white hover:bg-indigo-700'
          }`}
        >
          Draft Answers <PenTool size={14} />
        </button>
      </div>
    </div>
  );
};