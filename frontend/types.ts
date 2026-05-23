export interface JobMatch {
  id: string;
  company: string;
  title: string;
  url: string;
  snippet: string;
  matchScore: number;
  recommendation: 'Strong Yes' | 'Yes' | 'Maybe' | 'No';
  reasoning: string;
}

export interface AgentLog {
  id: string;
  timestamp: Date;
  message: string;
  type: 'info' | 'success' | 'error' | 'warning';
}

export type AgentStatus = 'idle' | 'running' | 'completed' | 'error';

export interface UserInputs {
  resume: string;
  criteria: string;
  jobLinks: string;
}