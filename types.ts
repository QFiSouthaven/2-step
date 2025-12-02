
export interface ProcessedFile {
  path: string;
  name: string;
  content: string;
  size: number;
  type: string;
  selected: boolean;
  isBinary?: boolean;
  summary?: string;
  isNew?: boolean; // For newly generated files
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
  isNew?: boolean;
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

export type TaskStatus = 'pending' | 'queued' | 'in_progress' | 'validating' | 'completed' | 'failed' | 'blocked';
export type TaskPriority = 'critical' | 'high' | 'medium' | 'low';

export interface TaskDependency {
    source: string; // Task ID that MUST complete
    target: string; // Task ID that is blocked
    type: 'hard' | 'soft';
}

export interface AgentTask {
  id: string;
  title: string;
  description: string;
  type: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignedAgentId?: string;
  dependencies: string[]; // IDs of other tasks that block this one
  result?: string; // The output of the task
  validationResult?: 'approved' | 'rejected' | 'pending';
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
  retryCount: number;
}

export interface ColosseumEvent {
  id: string;
  timestamp: number;
  source: string; // Agent Name
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
}

// --- Runtime Simulation Types ---

export interface RuntimeHealth {
    status: 'healthy' | 'warning' | 'critical' | 'unknown';
    issues: {
        severity: 'critical' | 'warning' | 'info';
        message: string;
        recommendation: string;
    }[];
    metrics: {
        startupTime: string;
        memoryEstimate: string;
        compatibilityScore: number;
    };
}

export interface SimulationResult {
    logs: string;
    health: RuntimeHealth;
}

// --- Compose to Modular Types ---

export interface Seam {
    id: string;
    name: string;
    type: 'functional' | 'class' | 'namespace' | 'dependency';
    confidence: number; // 0-1
    rationale: string;
    files: string[]; // List of file paths involved
}

export interface ModuleDefinition {
    name: string;
    description: string;
    files: string[];
    dependencies: string[]; // Names of other modules
}

export interface ProjectAnalysis {
    metrics: {
        loc: number;
        fileCount: number;
        complexity: number; // 1-10
        maintainability: 'A' | 'B' | 'C' | 'D' | 'F';
    };
    seams: Seam[];
    detectedModules: ModuleDefinition[];
}

export type ModularizationStrategyType = 'conservative' | 'balanced' | 'aggressive';

export interface ModularizationStrategy {
    type: ModularizationStrategyType;
    preserveStructure: boolean;
    separateFolders: boolean;
    generateDocs: boolean;
    addTypeHints: boolean;
}

export interface RefactoringPlan {
    strategy: ModularizationStrategyType;
    modules: ModuleDefinition[];
    newStructure: { path: string; type: 'file' | 'dir' }[];
    docs: string; // Markdown documentation of the plan
}
