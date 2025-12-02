
import React, { useState, useEffect, useRef } from 'react';
import { Play, Square, Terminal, AlertTriangle, CheckCircle2, RotateCcw, Cpu, Box, Settings, Activity } from 'lucide-react';
import { simulateRuntime } from '../services/geminiService';
import { SimulationResult, RuntimeHealth, ProcessedFile } from '../types';

interface ProjectSandboxProps {
    onClose: () => void;
    fullContext: string;
    files: ProcessedFile[];
}

const ProjectSandbox: React.FC<ProjectSandboxProps> = ({ onClose, fullContext, files }) => {
    const [platform, setPlatform] = useState('Detecting...');
    const [startCommand, setStartCommand] = useState('');
    const [isRunning, setIsRunning] = useState(false);
    const [isSimulating, setIsSimulating] = useState(false);
    const [terminalOutput, setTerminalOutput] = useState<string[]>(['> Sandbox initialized.', '> Ready to launch project...']);
    const [healthReport, setHealthReport] = useState<RuntimeHealth | null>(null);

    const terminalEndRef = useRef<HTMLDivElement>(null);

    // Auto-detect environment on mount
    useEffect(() => {
        const detectEnv = () => {
            const fileNames = files.map(f => f.name);
            
            if (fileNames.includes('package.json')) {
                setPlatform('Node.js');
                setStartCommand('npm start');
                return;
            }
            if (fileNames.includes('requirements.txt') || fileNames.some(f => f.endsWith('.py'))) {
                setPlatform('Python');
                setStartCommand('python main.py');
                return;
            }
            if (fileNames.includes('go.mod')) {
                setPlatform('Go');
                setStartCommand('go run .');
                return;
            }
            if (fileNames.includes('Cargo.toml')) {
                setPlatform('Rust');
                setStartCommand('cargo run');
                return;
            }
            if (fileNames.includes('index.html')) {
                setPlatform('Static Web');
                setStartCommand('npx serve .');
                return;
            }
            setPlatform('Unknown');
            setStartCommand('./run.sh');
        };
        detectEnv();
    }, [files]);

    // Scroll terminal to bottom
    useEffect(() => {
        terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [terminalOutput]);

    const handleRun = async () => {
        if (!fullContext) return;
        
        setIsRunning(true);
        setIsSimulating(true);
        setTerminalOutput(['> Initializing Virtual Container...', `> Platform: ${platform}`, `> Executing: ${startCommand}`, '> ...']);
        setHealthReport(null);

        try {
            // Add a slight delay to feel like a bootup
            await new Promise(r => setTimeout(r, 800));
            
            const result: SimulationResult | null = await simulateRuntime(fullContext, startCommand, platform);
            
            if (result) {
                // Stream logs line by line for effect
                const logLines = result.logs.split('\n');
                let currentLogs = [...terminalOutput.slice(0, 3)]; // Keep header
                
                for (const line of logLines) {
                   currentLogs.push(line);
                   setTerminalOutput([...currentLogs]);
                   await new Promise(r => setTimeout(r, 50)); // Typing effect
                }
                
                setHealthReport(result.health);
            } else {
                setTerminalOutput(prev => [...prev, '> Error: Simulation failed to generate output.']);
            }
        } catch (e) {
            setTerminalOutput(prev => [...prev, '> Critical Error: Sandbox crashed.']);
        } finally {
            setIsRunning(false);
            setIsSimulating(false);
        }
    };

    const handleStop = () => {
        setIsRunning(false);
        setIsSimulating(false);
        setTerminalOutput(prev => [...prev, '> Process terminated by user.']);
    };

    return (
        <div className="fixed inset-0 z-[100] bg-[#0b1120] flex flex-col font-sans text-slate-200">
            {/* Header */}
            <div className="h-16 border-b border-slate-800 bg-slate-950/80 backdrop-blur flex items-center justify-between px-6">
                <div className="flex items-center gap-4">
                    <div className="p-2 bg-gradient-to-br from-emerald-600 to-teal-600 rounded-lg shadow-lg shadow-emerald-900/30">
                        <Box size={24} className="text-white" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                            Project Sandbox
                            <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase tracking-wider">
                                Virtual Runtime
                            </span>
                        </h1>
                        <p className="text-xs text-slate-500">Isolated Environment for Launching & Debugging</p>
                    </div>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors">
                    Close
                </button>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex overflow-hidden">
                
                {/* Left: Configuration */}
                <div className="w-80 bg-slate-900 border-r border-slate-800 p-6 flex flex-col gap-6">
                    <div>
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <Settings size={14} /> Configuration
                        </h3>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-xs text-slate-500">Target Platform</label>
                                <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm text-slate-300">
                                    <Cpu size={14} className="text-slate-500" />
                                    <input 
                                        type="text" 
                                        value={platform} 
                                        onChange={e => setPlatform(e.target.value)}
                                        className="bg-transparent w-full focus:outline-none"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs text-slate-500">Start Command</label>
                                <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm text-slate-300 font-mono">
                                    <Terminal size={14} className="text-slate-500" />
                                    <input 
                                        type="text" 
                                        value={startCommand} 
                                        onChange={e => setStartCommand(e.target.value)}
                                        className="bg-transparent w-full focus:outline-none"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1"></div>

                    <div className="space-y-3">
                         {!isRunning ? (
                            <button 
                                onClick={handleRun}
                                disabled={!fullContext}
                                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold transition-all shadow-lg shadow-emerald-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Play size={16} fill="currentColor" />
                                Launch Project
                            </button>
                         ) : (
                             <button 
                                onClick={handleStop}
                                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 rounded-lg font-bold transition-all"
                            >
                                <Square size={16} fill="currentColor" />
                                Terminate Process
                            </button>
                         )}
                         <button 
                            onClick={() => setTerminalOutput(['> Sandbox cleared.'])}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-lg text-xs font-medium transition-all"
                         >
                             <RotateCcw size={14} />
                             Reset Console
                         </button>
                    </div>
                </div>

                {/* Center: Terminal */}
                <div className="flex-1 bg-black flex flex-col p-4">
                    <div className="flex items-center justify-between mb-2 px-2">
                         <span className="text-xs text-slate-500 font-mono">user@sandbox:~/project$</span>
                         {isRunning && <span className="text-xs text-emerald-500 animate-pulse">● Running</span>}
                    </div>
                    <div className="flex-1 bg-[#0c0c0c] rounded-lg border border-slate-800 p-4 font-mono text-sm overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700">
                        {terminalOutput.map((line, i) => (
                            <div key={i} className={`${line.toLowerCase().includes('error') ? 'text-red-400' : line.startsWith('>') ? 'text-slate-500' : 'text-slate-300'} mb-1 break-all`}>
                                {line}
                            </div>
                        ))}
                        <div ref={terminalEndRef} />
                    </div>
                </div>

                {/* Right: Diagnostics Report */}
                {healthReport && (
                    <div className="w-80 bg-slate-900 border-l border-slate-800 p-6 overflow-y-auto animate-in slide-in-from-right-10 duration-500">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                            <Activity size={14} /> Health Analysis
                        </h3>

                        {/* Status Badge */}
                        <div className={`p-4 rounded-xl border mb-6 flex items-center gap-3
                            ${healthReport.status === 'healthy' ? 'bg-emerald-900/20 border-emerald-500/30 text-emerald-400' :
                              healthReport.status === 'warning' ? 'bg-amber-900/20 border-amber-500/30 text-amber-400' :
                              'bg-red-900/20 border-red-500/30 text-red-400'}`}>
                            {healthReport.status === 'healthy' ? <CheckCircle2 size={24} /> : <AlertTriangle size={24} />}
                            <div>
                                <h4 className="font-bold text-sm uppercase">{healthReport.status}</h4>
                                <p className="text-[10px] opacity-70">Simulation Complete</p>
                            </div>
                        </div>

                        {/* Metrics */}
                        <div className="grid grid-cols-2 gap-3 mb-6">
                            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                                <span className="text-[10px] text-slate-500 uppercase block mb-1">Boot Time</span>
                                <span className="text-sm font-mono text-slate-200">{healthReport.metrics.startupTime}</span>
                            </div>
                            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                                <span className="text-[10px] text-slate-500 uppercase block mb-1">Memory</span>
                                <span className="text-sm font-mono text-slate-200">{healthReport.metrics.memoryEstimate}</span>
                            </div>
                        </div>

                        {/* Issues List */}
                        <div className="space-y-4">
                            <h4 className="text-xs font-bold text-slate-500 uppercase">Detected Issues ({healthReport.issues.length})</h4>
                            {healthReport.issues.map((issue, idx) => (
                                <div key={idx} className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className={`w-2 h-2 rounded-full ${issue.severity === 'critical' ? 'bg-red-500' : 'bg-amber-500'}`} />
                                        <span className={`text-xs font-bold ${issue.severity === 'critical' ? 'text-red-400' : 'text-amber-400'} uppercase`}>
                                            {issue.severity}
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-300 mb-2">{issue.message}</p>
                                    <div className="bg-slate-900 p-2 rounded text-[10px] text-slate-400 border border-slate-800">
                                        <span className="font-bold text-emerald-500">Fix:</span> {issue.recommendation}
                                    </div>
                                </div>
                            ))}
                            {healthReport.issues.length === 0 && (
                                <div className="text-center py-8 text-slate-600 text-xs italic">
                                    No issues detected. System appears stable.
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProjectSandbox;
