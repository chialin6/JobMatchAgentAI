import React, { useEffect, useRef } from 'react';
import { AgentLog, AgentStatus } from '../types.ts';
import { Terminal, Loader2, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';

interface AgentTerminalProps {
  logs: AgentLog[];
  status: AgentStatus;
}

export const AgentTerminal: React.FC<AgentTerminalProps> = ({ logs, status }) => {
  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const getIcon = (type: AgentLog['type']) => {
    switch (type) {
      case 'info': return <span className="text-blue-400 mr-2">›</span>;
      case 'success': return <CheckCircle2 size={14} className="text-green-400 mr-2 inline" />;
      case 'error': return <XCircle size={14} className="text-red-400 mr-2 inline" />;
      case 'warning': return <AlertCircle size={14} className="text-yellow-400 mr-2 inline" />;
    }
  };

  return (
    <div className="bg-gray-900 rounded-lg border border-gray-700 shadow-lg overflow-hidden flex flex-col h-full">
      <div className="bg-gray-800 px-4 py-2 border-b border-gray-700 flex items-center justify-between">
        <div className="flex items-center text-gray-300 text-sm font-medium">
          <Terminal size={16} className="mr-2" />
          Agent Activity Log
        </div>
        {status === 'running' && (
          <div className="flex items-center text-blue-400 text-xs">
            <Loader2 size={12} className="animate-spin mr-1" />
            Processing
          </div>
        )}
      </div>
      <div className="p-4 overflow-y-auto flex-1 terminal-scroll font-mono text-sm">
        {logs.length === 0 ? (
          <div className="text-gray-500 italic">Agent is idle. Waiting for input...</div>
        ) : (
          logs.map((log) => (
            <div key={log.id} className="mb-2 flex items-start">
              <span className="text-gray-500 mr-3 shrink-0">
                [{log.timestamp.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}]
              </span>
              <div className={`flex-1 ${
                log.type === 'error' ? 'text-red-400' : 
                log.type === 'success' ? 'text-green-400' : 
                log.type === 'warning' ? 'text-yellow-400' : 'text-gray-300'
              }`}>
                {getIcon(log.type)}
                {log.message}
              </div>
            </div>
          ))
        )}
        <div ref={endOfMessagesRef} />
      </div>
    </div>
  );
};