
import React from 'react';
import { useColosseum } from '../contexts/ColosseumContext';
import { Agent, AgentTask, TaskStatus, AgentRole } from '../types';
import { Play, Square, Cpu, BrainCircuit, Terminal, CheckCircle2, Circle, Clock, AlertTriangle, MessageSquare, Briefcase, Zap } from 'lucide-react';

const AgentCard: React.FC<{ agent: Agent }> = ({ agent }) => {
    const getStatusColor = (status: string) => {
        switch(status) {
            case 'idle': return 'border-slate-700 bg-slate-900';
            case 'working': return 'border-blue-500 bg-blue-900/10 shadow-lg shadow-blue-500/10';
            case 'thinking': return 'border-purple-500 bg-purple-900/10 shadow-lg shadow-purple-500/10 animate-pulse';
            case 'error': return 'border-red-500 bg-red-900/10';
            default: return 'border-slate-700';
        }
    };

    const getIcon = (role: AgentRole) => {
        switch(role) {
            case 'architect': return <BrainCircuit size={16} className="text-purple-400" />;
            case 'developer': return <Terminal size={16} className="text-blue-400" />;
            case 'security': return <Briefcase size={16} className="text-red-400" />;
            case 'qa': return <CheckCircle2 size={16} className="text-green-400" />;
            default: return <Cpu size={16} />;
        }
    };

    return (
        <div className={`p-4 rounded-xl border transition-all duration-300 ${getStatusColor(agent.status)}`}>
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-slate-800 rounded-lg">
                        {getIcon(agent.role)}
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-slate-200">{agent.name}</h4>
                        <p className="text-[10px] text-slate-400 uppercase tracking-wider">{agent.role} • {agent.specialization}</p>
                    </div>
                </div>
                <div className={`text-[10px] font-mono px-2 py-0.5 rounded-full uppercase
                    ${agent.status === 'idle' ? 'bg-slate-800 text-slate-500' : 
                      agent.status === 'working' ? 'bg-blue-500/20 text-blue-300' :
                      agent.status === 'thinking' ? 'bg-purple-500/20 text-purple-300' : 'bg-red-500/20 text-red-300'
                    }`}>
                    {agent.status}
                </div>
            </div>
            
            <div className="space-y-2">
                <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div 
                        className="h-full bg-blue-500 transition-all duration-500" 
                        style={{ width: `${agent.progress}%` }}
                    ></div>
                </div>
                <p className="text-xs text-slate-400 truncate min-h-[1.25rem]">
                    {agent.message || 'Waiting for assignment...'}
                </p>
            </div>
        </div>
    );
};

const TaskItem: React.FC<{ task: AgentTask }> = ({ task }) => {
    const statusIcon = {
        pending: <Circle size={14} className="text-slate-500" />,
        in_progress: <Clock size={14} className="text-blue-400 animate-spin-slow" />,
        completed: <CheckCircle2 size={14} className="text-green-500" />,
        failed: <AlertTriangle size={14} className="text-red-500" />
    };

    return (
        <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg hover:border-slate-700 transition-colors group">
            <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2">
                    <div className="mt-0.5">{statusIcon[task.status]}</div>
                    <div>
                        <h5 className={`text-xs font-medium ${task.status === 'completed' ? 'text-slate-400 line-through' : 'text-slate-200'}`}>
                            {task.title}
                        </h5>
                        <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-2">{task.description}</p>
                    </div>
                </div>
                {task.priority === 'critical' || task.priority === 'high' ? (
                     <span className="text-[9px] px-1.5 py-0.5 bg-red-900/30 text-red-400 rounded border border-red-900/50 uppercase">
                         {task.priority}
                     </span>
                ) : null}
            </div>
        </div>
    );
};

const AgentDashboard: React.FC<{ onClose: () => void, fullContext: string }> = ({ onClose, fullContext }) => {
    const { agents, tasks, events, isSwarmActive, startSwarm, stopSwarm } = useColosseum();

    const pendingTasks = tasks.filter(t => t.status === 'pending');
    const inProgressTasks = tasks.filter(t => t.status === 'in_progress');
    const completedTasks = tasks.filter(t => t.status === 'completed');

    return (
        <div className="fixed inset-0 z-[100] bg-[#0b1120] text-slate-200 flex flex-col font-sans">
            
            {/* Header */}
            <div className="h-16 border-b border-slate-800 bg-slate-950/80 backdrop-blur flex items-center justify-between px-6">
                <div className="flex items-center gap-4">
                    <div className="p-2 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-lg shadow-lg shadow-purple-900/30">
                        <BrainCircuit size={24} className="text-white" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                            Agent Colosseum
                            <span className="px-2 py-0.5 rounded text-[10px] bg-purple-500/10 text-purple-400 border border-purple-500/20 uppercase tracking-wider">
                                Gemini 3 Pro Swarm
                            </span>
                        </h1>
                        <p className="text-xs text-slate-500">Autonomous Project Rejuvenation Orchestrator</p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-4 px-4 py-2 bg-slate-900 rounded-full border border-slate-800">
                        <div className="flex flex-col items-center px-2 border-r border-slate-800">
                            <span className="text-[10px] text-slate-500 uppercase">Tasks</span>
                            <span className="text-sm font-bold text-white">{tasks.length}</span>
                        </div>
                        <div className="flex flex-col items-center px-2 border-r border-slate-800">
                            <span className="text-[10px] text-slate-500 uppercase">Active</span>
                            <span className="text-sm font-bold text-blue-400">{agents.filter(a => a.status !== 'idle').length}</span>
                        </div>
                        <div className="flex flex-col items-center px-2">
                            <span className="text-[10px] text-slate-500 uppercase">Progress</span>
                            <span className="text-sm font-bold text-green-400">
                                {tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0}%
                            </span>
                        </div>
                    </div>

                    <div className="h-8 w-px bg-slate-800"></div>

                    {!isSwarmActive ? (
                        <button 
                            onClick={() => startSwarm(fullContext)}
                            className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-all shadow-lg shadow-blue-900/20"
                        >
                            <Play size={16} fill="currentColor" />
                            Start Swarm
                        </button>
                    ) : (
                        <button 
                            onClick={stopSwarm}
                            className="flex items-center gap-2 px-6 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 rounded-lg font-medium transition-all"
                        >
                            <Square size={16} fill="currentColor" />
                            Stop Swarm
                        </button>
                    )}

                    <button 
                        onClick={onClose}
                        className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-hidden flex">
                
                {/* Left: Swarm Activity & Feed */}
                <div className="w-[450px] flex flex-col border-r border-slate-800 bg-slate-900/30">
                    
                    {/* Agents Grid */}
                    <div className="p-4 overflow-y-auto max-h-[50%] border-b border-slate-800">
                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                            <Zap size={12} /> Active Agents
                        </h3>
                        <div className="grid grid-cols-1 gap-3">
                            {agents.map(agent => (
                                <AgentCard key={agent.id} agent={agent} />
                            ))}
                        </div>
                    </div>

                    {/* Intelligence Feed */}
                    <div className="flex-1 flex flex-col overflow-hidden bg-black/20">
                        <div className="px-4 py-2 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                <MessageSquare size={12} /> Swarm Intelligence Feed
                            </span>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-3 font-mono text-xs">
                            {events.map(event => (
                                <div key={event.id} className="flex gap-3 animate-in fade-in slide-in-from-left-2 duration-300">
                                    <span className="text-slate-600 shrink-0">
                                        {new Date(event.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute:'2-digit', second:'2-digit' })}
                                    </span>
                                    <div className="flex-1">
                                        <span className={`font-bold mr-2 ${
                                            event.type === 'error' ? 'text-red-400' :
                                            event.type === 'success' ? 'text-green-400' :
                                            event.type === 'warning' ? 'text-yellow-400' : 'text-blue-400'
                                        }`}>
                                            [{event.source}]
                                        </span>
                                        <span className="text-slate-300">{event.message}</span>
                                    </div>
                                </div>
                            ))}
                            {events.length === 0 && (
                                <div className="text-slate-600 text-center italic mt-10">Waiting for swarm activation...</div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right: Task Pipeline */}
                <div className="flex-1 flex flex-col bg-slate-950">
                    <div className="p-4 border-b border-slate-800 bg-slate-900/20">
                         <h3 className="text-sm font-bold text-slate-300">Task Execution Pipeline</h3>
                    </div>
                    
                    <div className="flex-1 p-4 grid grid-cols-3 gap-4 overflow-hidden">
                        
                        {/* Pending */}
                        <div className="flex flex-col bg-slate-900/50 rounded-xl border border-slate-800/50">
                            <div className="p-3 border-b border-slate-800/50 flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-400 uppercase">Backlog</span>
                                <span className="bg-slate-800 text-slate-400 text-[10px] px-2 py-0.5 rounded-full">{pendingTasks.length}</span>
                            </div>
                            <div className="flex-1 overflow-y-auto p-2 space-y-2">
                                {pendingTasks.map(task => <TaskItem key={task.id} task={task} />)}
                                {pendingTasks.length === 0 && <div className="text-slate-600 text-xs text-center py-4">No pending tasks</div>}
                            </div>
                        </div>

                        {/* In Progress */}
                        <div className="flex flex-col bg-blue-900/5 rounded-xl border border-blue-900/20">
                            <div className="p-3 border-b border-blue-900/20 flex items-center justify-between">
                                <span className="text-xs font-bold text-blue-400 uppercase">In Progress</span>
                                <span className="bg-blue-900/20 text-blue-300 text-[10px] px-2 py-0.5 rounded-full">{inProgressTasks.length}</span>
                            </div>
                            <div className="flex-1 overflow-y-auto p-2 space-y-2">
                                {inProgressTasks.map(task => <TaskItem key={task.id} task={task} />)}
                                {inProgressTasks.length === 0 && <div className="text-slate-600 text-xs text-center py-4">No active tasks</div>}
                            </div>
                        </div>

                        {/* Completed */}
                        <div className="flex flex-col bg-green-900/5 rounded-xl border border-green-900/20">
                            <div className="p-3 border-b border-green-900/20 flex items-center justify-between">
                                <span className="text-xs font-bold text-green-400 uppercase">Completed</span>
                                <span className="bg-green-900/20 text-green-300 text-[10px] px-2 py-0.5 rounded-full">{completedTasks.length}</span>
                            </div>
                            <div className="flex-1 overflow-y-auto p-2 space-y-2">
                                {completedTasks.map(task => <TaskItem key={task.id} task={task} />)}
                                {completedTasks.length === 0 && <div className="text-slate-600 text-xs text-center py-4">No completed tasks</div>}
                            </div>
                        </div>

                    </div>
                </div>

            </div>
        </div>
    );
};

export default AgentDashboard;
