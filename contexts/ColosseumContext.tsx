
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { Agent, AgentTask, ColosseumEvent, AgentRole } from '../types';
import { decomposeProject, executeAgentTask } from '../services/geminiService';

interface ColosseumContextType {
    agents: Agent[];
    tasks: AgentTask[];
    events: ColosseumEvent[];
    isSwarmActive: boolean;
    startSwarm: (context: string) => Promise<void>;
    stopSwarm: () => void;
    addTask: (task: Omit<AgentTask, 'id' | 'status' | 'dependencies'>) => void;
    projectContext: string | null;
}

const ColosseumContext = createContext<ColosseumContextType | undefined>(undefined);

export const useColosseum = () => {
    const context = useContext(ColosseumContext);
    if (!context) throw new Error('useColosseum must be used within a ColosseumProvider');
    return context;
};

const INITIAL_AGENTS: Agent[] = [
    { id: 'a1', name: 'Architect Prime', role: 'architect', specialization: 'System Design', status: 'idle', progress: 0 },
    { id: 'a2', name: 'Dev Unit Alpha', role: 'developer', specialization: 'Backend Logic', status: 'idle', progress: 0 },
    { id: 'a3', name: 'Dev Unit Beta', role: 'developer', specialization: 'Frontend UI', status: 'idle', progress: 0 },
    { id: 'a4', name: 'Sentinel', role: 'security', specialization: 'Vulnerability Scan', status: 'idle', progress: 0 },
    { id: 'a5', name: 'QA Bot', role: 'qa', specialization: 'Test Coverage', status: 'idle', progress: 0 },
];

export const ColosseumProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [agents, setAgents] = useState<Agent[]>(INITIAL_AGENTS);
    const [tasks, setTasks] = useState<AgentTask[]>([]);
    const [events, setEvents] = useState<ColosseumEvent[]>([]);
    const [isSwarmActive, setIsSwarmActive] = useState(false);
    const [projectContext, setProjectContext] = useState<string | null>(null);

    // Refs for safe async access
    const tasksRef = useRef(tasks);
    const agentsRef = useRef(agents);
    const contextRef = useRef(projectContext);
    
    // Keep refs in sync
    useEffect(() => { tasksRef.current = tasks; }, [tasks]);
    useEffect(() => { agentsRef.current = agents; }, [agents]);
    useEffect(() => { contextRef.current = projectContext; }, [projectContext]);

    const addEvent = (source: string, type: ColosseumEvent['type'], message: string) => {
        const newEvent: ColosseumEvent = {
            id: Math.random().toString(36).substr(2, 9),
            timestamp: Date.now(),
            source,
            type,
            message
        };
        setEvents(prev => [newEvent, ...prev].slice(0, 100));
    };

    const addTask = (task: Omit<AgentTask, 'id' | 'status' | 'dependencies'>) => {
        const newTask: AgentTask = {
            ...task,
            id: Math.random().toString(36).substr(2, 9),
            status: 'pending',
            dependencies: []
        };
        setTasks(prev => [...prev, newTask]);
        addEvent('System', 'info', `Task added: ${newTask.title}`);
    };

    // The "Brain" of the Swarm
    const startSwarm = async (context: string) => {
        if (!process.env.API_KEY) {
            addEvent('System', 'error', 'API Key missing. Cannot start Swarm.');
            return;
        }

        setIsSwarmActive(true);
        setProjectContext(context);
        addEvent('System', 'info', 'Swarm Activated. Analyzing Project...');

        try {
            // 1. Decompose
            const newTasksRaw = await decomposeProject(context);
            const newTasks: AgentTask[] = newTasksRaw.map(t => ({
                id: Math.random().toString(36).substr(2, 9),
                title: t.title || 'Untitled Task',
                description: t.description || '',
                type: t.type || 'feature',
                status: 'pending',
                priority: (t.priority as any) || 'medium',
                dependencies: []
            }));

            setTasks(prev => [...prev, ...newTasks]);
            addEvent('Architect Prime', 'success', `Decomposed project into ${newTasks.length} tasks.`);

        } catch (e) {
            addEvent('System', 'error', 'Failed to analyze project.');
            setIsSwarmActive(false);
        }
    };

    const stopSwarm = () => {
        setIsSwarmActive(false);
        setAgents(prev => prev.map(a => ({ ...a, status: 'idle', message: 'Swarm stopped.' })));
        addEvent('System', 'warning', 'Swarm Deactivated.');
    };

    // Game Loop
    useEffect(() => {
        if (!isSwarmActive) return;

        const loop = setInterval(async () => {
            const currentAgents = agentsRef.current;
            const currentTasks = tasksRef.current;
            const context = contextRef.current;

            // 1. Check for idle agents and pending tasks
            currentAgents.forEach(async (agent) => {
                if (agent.status === 'idle') {
                    // Find a suitable task
                    // Simple logic: find first pending task that matches role (if strict) or just any pending for now
                    // For better logic: check AgentRole vs Task Type
                    
                    const pendingTask = currentTasks.find(t => t.status === 'pending');
                    
                    if (pendingTask) {
                        // Assign Task
                        const taskId = pendingTask.id;
                        
                        // Optimistic Update: Mark task in progress
                        setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: 'in_progress', assignedAgentId: agent.id } : t));
                        
                        // Update Agent
                        setAgents(prev => prev.map(a => a.id === agent.id ? { 
                            ...a, 
                            status: 'working', 
                            currentTaskId: taskId, 
                            message: `Starting: ${pendingTask.title}`,
                            progress: 0
                        } : a));

                        addEvent(agent.name, 'info', `Picked up task: ${pendingTask.title}`);

                        // Execute Task (Async)
                        if (context) {
                            try {
                                // Simulate "Thinking" delay updates
                                setTimeout(() => {
                                     setAgents(prev => prev.map(a => a.id === agent.id ? { ...a, status: 'thinking', progress: 30 } : a));
                                }, 1000);

                                const result = await executeAgentTask(agent.role, pendingTask, context);
                                
                                // Task Complete
                                setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: 'completed', result } : t));
                                setAgents(prev => prev.map(a => a.id === agent.id ? { 
                                    ...a, 
                                    status: 'idle', 
                                    currentTaskId: undefined, 
                                    message: `Completed: ${pendingTask.title}`,
                                    progress: 100 
                                } : a));
                                addEvent(agent.name, 'success', `Finished task: ${pendingTask.title}`);

                            } catch (error) {
                                // Task Failed
                                setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: 'failed' } : t));
                                setAgents(prev => prev.map(a => a.id === agent.id ? { ...a, status: 'error', message: 'Task Failed', progress: 0 } : a));
                                addEvent(agent.name, 'error', `Failed task: ${pendingTask.title}`);
                                
                                // Recover agent after delay
                                setTimeout(() => {
                                    setAgents(prev => prev.map(a => a.id === agent.id ? { ...a, status: 'idle', message: 'Recovered.' } : a));
                                }, 3000);
                            }
                        }
                    }
                }
            });

        }, 2000); // Check every 2 seconds

        return () => clearInterval(loop);
    }, [isSwarmActive]);

    return (
        <ColosseumContext.Provider value={{
            agents,
            tasks,
            events,
            isSwarmActive,
            startSwarm,
            stopSwarm,
            addTask,
            projectContext
        }}>
            {children}
        </ColosseumContext.Provider>
    );
};
