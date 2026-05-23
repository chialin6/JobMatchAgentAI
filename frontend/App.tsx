import React, { useState, useCallback } from 'react';
import { AgentLog, AgentStatus, JobMatch, UserInputs } from './types.ts';
import { fetchJobDetails, evaluateJob } from './services/gemini.ts';
import { AgentTerminal } from './components/AgentTerminal.tsx';
import { JobCard } from './components/JobCard.tsx';
import { DraftModal } from './components/DraftModal.tsx';
import { Briefcase, FileText, MapPin, Link as LinkIcon, Play, RotateCcw } from 'lucide-react';

function App() {
  // Form State
  const [inputs, setInputs] = useState<UserInputs>({
    resume: '',
    criteria: 'e.g., Looking for a Senior Frontend role, remote, good work-life balance.',
    jobLinks: '',
  });

  // Agent State
  const [status, setStatus] = useState<AgentStatus>('idle');
  const [logs, setLogs] = useState<AgentLog[]>([]);
  const [results, setResults] = useState<JobMatch[]>([]);
  
  // UI State
  const [selectedJob, setSelectedJob] = useState<JobMatch | null>(null);

  const addLog = useCallback((message: string, type: AgentLog['type'] = 'info') => {
    setLogs(prev => [...prev, {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: new Date(),
      message,
      type
    }]);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    const { name, value } = e.target;
    setInputs(prev => ({ ...prev, [name]: value }));
  };

  const startAgent = async () => {
    if (!inputs.resume.trim() || !inputs.jobLinks.trim()) {
      addLog("Please provide both a resume and at least one job link.", "error");
      return;
    }

    setStatus('running');
    setLogs([]);
    setResults([]);
    
    // Extract URLs (split by newline, comma, or space)
    const links = inputs.jobLinks
      .split(/[\n, ]+/)
      .map(l => l.trim())
      .filter(l => l.startsWith('http://') || l.startsWith('https://'));

    if (links.length === 0) {
      addLog("No valid URLs found. Please ensure links start with http:// or https://", "error");
      setStatus('error');
      return;
    }
    
    addLog(`Starting evaluation for ${links.length} job(s). Web search may take 10-15s per job...`, 'info');
    addLog(`Criteria: ${inputs.criteria}`, 'info');

    let successCount = 0;

    // Helper function to process a single link
    const evaluateLink = async (url: string, index: number) => {
      const jobId = index + 1;
      
      const addResult = (newJob: JobMatch) => {
        setResults(prev => {
          const updated = [...prev, newJob];
          // Sort: successful jobs first (by score), then errors
          return updated.sort((a, b) => {
            if (a.status === 'error' && b.status !== 'error') return 1;
            if (a.status !== 'error' && b.status === 'error') return -1;
            return b.matchScore - a.matchScore;
          });
        });
      };

      try {
        addLog(`[Job ${jobId}] Fetching details via Google Search: ${url.substring(0, 35)}...`, 'info');
        const jobDetailsText = await fetchJobDetails(url);
        
        if (!jobDetailsText || jobDetailsText.trim() === '') {
          addLog(`[Job ${jobId}] Could not retrieve meaningful details for this link.`, 'warning');
          addResult({
            id: Math.random().toString(36).substring(2, 9),
            url,
            company: 'Unknown Company',
            title: 'Failed to fetch job details',
            snippet: 'The AI could not retrieve meaningful details for this URL.',
            matchScore: 0,
            recommendation: 'Error',
            reasoning: 'Fetch failed or returned empty results.',
            status: 'error'
          });
          return;
        }
        
        addLog(`[Job ${jobId}] Details retrieved. Evaluating against resume...`, 'info');
        const match = await evaluateJob(url, jobDetailsText, inputs.resume, inputs.criteria);
        
        if (match) {
          addLog(`[Job ${jobId}] Done: ${match.title} at ${match.company} (${match.recommendation})`, 'success');
          successCount++;
          addResult({ ...match, status: 'success' });
        } else {
          addLog(`[Job ${jobId}] Failed to generate a structured evaluation.`, 'warning');
          addResult({
            id: Math.random().toString(36).substring(2, 9),
            url,
            company: 'Unknown Company',
            title: 'Evaluation Failed',
            snippet: 'The AI failed to generate a structured evaluation for this job.',
            matchScore: 0,
            recommendation: 'Error',
            reasoning: 'Evaluation parsing failed.',
            status: 'error'
          });
        }
      } catch (error) {
        addLog(`[Job ${jobId}] Error: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
        addResult({
          id: Math.random().toString(36).substring(2, 9),
          url,
          company: 'Unknown Company',
          title: 'Processing Error',
          snippet: error instanceof Error ? error.message : 'Unknown error occurred during processing.',
          matchScore: 0,
          recommendation: 'Error',
          reasoning: 'An exception was thrown during the fetch or evaluation process.',
          status: 'error'
        });
      }
    };

    // Process links in batches of 3 to speed up execution without hitting rate limits too hard
    const batchSize = 3;
    for (let i = 0; i < links.length; i += batchSize) {
      const batch = links.slice(i, i + batchSize);
      await Promise.all(batch.map((url, index) => evaluateLink(url, i + index)));
    }

    addLog(`Agent finished. Successfully evaluated ${successCount} out of ${links.length} jobs.`, 'success');
    setStatus('completed');
  };

  const resetAgent = () => {
    setStatus('idle');
    setLogs([]);
    setResults([]);
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      
      {/* Left Sidebar - Inputs */}
      <div className="w-1/3 min-w-[400px] max-w-[500px] bg-white border-r border-gray-200 flex flex-col h-full shadow-sm z-10">
        <div className="p-6 border-b border-gray-100 bg-indigo-600 text-white">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-white/20 p-2 rounded-lg">
              <Briefcase size={24} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">JobMatchAgent AI</h1>
          </div>
          <p className="text-indigo-100 text-sm">Your personal AI recruiter and application assistant.</p>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Resume Input */}
          <div>
            <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
              <FileText size={16} className="mr-2 text-indigo-500" />
              Your Resume (Text)
            </label>
            <textarea
              name="resume"
              value={inputs.resume}
              onChange={handleInputChange}
              placeholder="Paste your full resume here..."
              className="w-full h-40 p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none text-sm shadow-sm"
            />
          </div>

          {/* Criteria Input */}
          <div>
            <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
              <MapPin size={16} className="mr-2 text-indigo-500" />
              Job Criteria & Preferences
            </label>
            <textarea
              name="criteria"
              value={inputs.criteria}
              onChange={handleInputChange}
              className="w-full h-20 p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none text-sm shadow-sm"
            />
          </div>

          {/* Job Links Input */}
          <div>
            <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
              <LinkIcon size={16} className="mr-2 text-indigo-500" />
              Job Links to Evaluate
            </label>
            <textarea
              name="jobLinks"
              value={inputs.jobLinks}
              onChange={handleInputChange}
              placeholder="Paste job URLs here (one per line or comma separated)...&#10;https://careers.google.com/...&#10;https://jobs.apple.com/..."
              className="w-full h-32 p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none text-sm shadow-sm"
            />
          </div>
        </div>

        {/* Action Area */}
        <div className="p-6 border-t border-gray-100 bg-gray-50">
          {status === 'idle' || status === 'completed' || status === 'error' ? (
            <button
              onClick={startAgent}
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white py-3 px-4 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-md hover:shadow-lg active:scale-[0.98]"
            >
              <Play size={18} />
              {status === 'completed' || status === 'error' ? 'Evaluate Again' : 'Start Evaluation'}
            </button>
          ) : (
            <button
              disabled
              className="w-full flex items-center justify-center gap-2 bg-indigo-400 text-white py-3 px-4 rounded-xl font-bold cursor-not-allowed shadow-inner"
            >
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              Evaluating Jobs...
            </button>
          )}
          
          {(status === 'completed' || status === 'error') && (
             <button
             onClick={resetAgent}
             className="w-full mt-3 flex items-center justify-center gap-2 bg-white border border-gray-300 text-gray-700 py-2 px-4 rounded-xl font-medium hover:bg-gray-50 transition-colors"
           >
             <RotateCcw size={16} />
             Reset
           </button>
          )}
        </div>
      </div>

      {/* Right Main Content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-gray-100">
        
        {/* Top Half: Agent Terminal */}
        <div className="h-1/3 p-6 pb-3">
          <AgentTerminal logs={logs} status={status} />
        </div>

        {/* Bottom Half: Results */}
        <div className="flex-1 p-6 pt-3 overflow-hidden flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              Evaluation Results
              {results.length > 0 && (
                <span className="bg-indigo-100 text-indigo-800 text-xs py-1 px-2.5 rounded-full font-bold">
                  {results.length} processed
                </span>
              )}
            </h2>
          </div>
          
          <div className="flex-1 overflow-y-auto pr-2 pb-4">
            {results.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-400 bg-white rounded-xl border border-gray-200 border-dashed">
                <Briefcase size={48} className="mb-4 opacity-20" />
                <p className="text-lg font-medium">No evaluations yet</p>
                <p className="text-sm mt-1">Paste job links and start the agent to see results.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                {results.map(job => (
                  <JobCard 
                    key={job.id} 
                    job={job} 
                    onDraftClick={setSelectedJob} 
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Draft Modal */}
      {selectedJob && (
        <DraftModal 
          job={selectedJob} 
          resume={inputs.resume} 
          onClose={() => setSelectedJob(null)} 
        />
      )}

    </div>
  );
}

export default App;