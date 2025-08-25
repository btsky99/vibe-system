// VIBE 시스템 타입 정의

export interface Agent {
  id: string;
  name: string;
  description: string;
  status: 'idle' | 'running' | 'completed' | 'error';
  type: 'general-purpose' | 'frontend' | 'backend' | 'mobile' | 'security' | 'performance' | 'docs' | 'ai' | 'workflow';
  lastRun?: Date;
  result?: any;
}

export interface LogEntry {
  id: string;
  timestamp: Date;
  level: 'info' | 'warn' | 'error' | 'success';
  message: string;
  source: 'vibe' | 'ons' | 'claude-code' | 'agent';
  details?: any;
  agentId?: string;
}

export interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  size?: number;
  modified?: Date;
  children?: FileNode[];
}

export interface SystemStatus {
  isOnline: boolean;
  isConnectedToOnS: boolean;
  activeAgents: number;
  totalAgents: number;
  memoryUsage: number;
  uptime: number;
}

export interface VIBEConfig {
  onsProjectPath: string;
  port: number;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  maxLogEntries: number;
  autoSaveInterval: number;
  theme: 'light' | 'dark' | 'auto';
}

export interface Command {
  id: string;
  name: string;
  description: string;
  shortcut?: string;
  category: 'file' | 'agent' | 'system' | 'custom';
  action: () => Promise<void>;
}

export interface TerminalSession {
  id: string;
  name: string;
  isActive: boolean;
  history: string[];
  currentDir: string;
}

export interface ChatMessage {
  id: string;
  timestamp: Date;
  type: 'user' | 'assistant' | 'system';
  content: string;
  isLoading?: boolean;
}