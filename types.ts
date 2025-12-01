
export interface ProcessedFile {
  path: string;
  name: string;
  content: string;
  size: number;
  type: string;
  selected: boolean;
  isBinary?: boolean;
  summary?: string;
}

export interface ProcessingStats {
  totalFiles: number;
  totalSize: number;
  tokenCount: number; // Estimated
}

export type FileNode = {
  name: string;
  path: string;
  isFile: boolean;
  children?: FileNode[];
  checked?: boolean;
};

export type SummaryFocus = 'general' | 'security' | 'performance' | 'core';

// --- Safe Mode & Test Framework Types ---

export type ComponentStatus = 'healthy' | 'degraded' | 'failed' | 'disabled' | 'testing';

export enum SafeModeLevel {
  MINIMAL = 1,   // Level 1: Core only
  ESSENTIAL = 2, // Level 2: Auth + Basic Data
  STANDARD = 3,  // Level 3: Most features
  FULL = 4       // Level 4: All features + Integrations
}

export interface SystemComponent {
  id: string;
  name: string;
  category: 'core' | 'ui' | 'data' | 'integration';
  status: ComponentStatus;
  minSafeModeLevel: SafeModeLevel;
  dependencies: string[]; // IDs of parent components
  lastError?: string;
  metrics?: {
    renderTime: number;
    memoryUsage: number; // Simulated MB
    errors: number;
  };
}

export interface SystemLog {
  id: string;
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';
  componentId: string;
  message: string;
}

// --- Agent Colosseum Types ---

export type AgentRole = 'architect' | 'developer' | 'qa' | 'security' | 'reviewer' | 'optimizer';
export type AgentStatus = 'idle' | 'working' | 'thinking' | 'paused' | 'error';

export interface Agent {
  id: string;
  name: string;
  role: AgentRole;
  specialization: string;
  status: AgentStatus;
  currentTaskId?: string;
  progress: number; // 0-100
  message?: string; // Current thought/status message
}

export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'failed';
export type TaskPriority = 'critical' | 'high' | 'medium' | 'low';

export interface AgentTask {
  id: string;
  title: string;
  description: string;
  type: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignedAgentId?: string;
  dependencies: string[]; // IDs of other tasks
  result?: string; // The output of the task
}

export interface ColosseumEvent {
  id: string;
  timestamp: number;
  source: string; // Agent Name
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
}
