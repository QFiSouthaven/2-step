
import React, { useState } from 'react';
import { ProcessedFile, ProjectAnalysis, RefactoringPlan, ModularizationStrategyType, ModuleDefinition } from '../types';
import { analyzeProjectStructure, generateModularArchitecture } from '../services/geminiService';
import { Puzzle, RefreshCw, Eye, Download, Layers, Box, Settings, ArrowRight, CheckCircle2, AlertTriangle, FileText, Folder } from 'lucide-react';

interface ComposeToModularViewProps {
    onClose: () => void;
    fullContext: string;
    files: ProcessedFile[];
}

const ComposeToModularView: React.FC<ComposeToModularViewProps> = ({ onClose, fullContext, files }) => {
    const [step, setStep] = useState<'source' | 'analysis' | 'strategy' | 'preview'>('source');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysis, setAnalysis] = useState<ProjectAnalysis | null>(null);
    const [strategy, setStrategy] = useState<ModularizationStrategyType>('balanced');
    const [isGenerating, setIsGenerating] = useState(false);
    const [plan, setPlan] = useState<RefactoringPlan | null>(null);

    const handleAnalyze = async () => {
        setIsAnalyzing(true);
        try {
            const result = await analyzeProjectStructure(fullContext);
            if (result) {
                setAnalysis(result);
                setStep('analysis');
            }
        } catch (e) {
            console.error("Analysis failed", e);
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleGenerate = async () => {
        if (!analysis) return;
        setIsGenerating(true);
        try {
            const result = await generateModularArchitecture(fullContext, analysis, strategy);
            if (result) {
                setPlan(result);
                setStep('preview');
            }
        } catch (e) {
            console.error("Generation failed", e);
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] bg-[#0b1120] text-slate-200 flex flex-col font-sans animate-in fade-in duration-300">
            {/* Header */}
            <div className="h-16 border-b border-slate-800 bg-slate-950/80 backdrop-blur flex items-center justify-between px-6">
                <div className="flex items-center gap-4">
                    <div className="p-2 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-lg shadow-lg shadow-indigo-900/30">
                        <Puzzle size={24} className="text-white" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                            Compose to Modular
                            <span className="px-2 py-0.5 rounded text-[10px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 uppercase tracking-wider">
                                Refactoring Assistant
                            </span>
                        </h1>
                        <p className="text-xs text-slate-500">Intelligent Monolith Decomposition</p>
                    </div>
                </div>

                {/* Stepper */}
                <div className="flex items-center gap-2 text-xs font-medium">
                    <StepIndicator active={step === 'source'} completed={step !== 'source'} label="1. Source" />
                    <div className="w-4 h-px bg-slate-800" />
                    <StepIndicator active={step === 'analysis'} completed={step !== 'source' && step !== 'analysis'} label="2. Analyze" />
                    <div className="w-4 h-px bg-slate-800" />
                    <StepIndicator active={step === 'strategy'} completed={step === 'preview'} label="3. Strategy" />
                    <div className="w-4 h-px bg-slate-800" />
                    <StepIndicator active={step === 'preview'} completed={false} label="4. Preview" />
                </div>

                <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors">
                    Close
                </button>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-hidden flex flex-col">
                
                {/* Step 1: Source */}
                {step === 'source' && (
                    <div className="flex-1 flex flex-col items-center justify-center p-8 gap-6 animate-in slide-in-from-right-8 fade-in duration-300">
                        <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-xl p-8">
                            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                                <Folder size={20} className="text-indigo-400" />
                                Project Source
                            </h2>
                            <div className="space-y-4 mb-8">
                                <div className="p-4 bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-slate-300">Current Project Context</p>
                                        <p className="text-xs text-slate-500 mt-1">{files.length} files loaded</p>
                                    </div>
                                    <CheckCircle2 size={20} className="text-green-500" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 bg-slate-950/50 rounded-lg border border-slate-800">
                                        <span className="text-[10px] text-slate-500 uppercase">Total Size</span>
                                        <p className="text-lg font-mono text-slate-200">{(fullContext.length / 1024).toFixed(1)} KB</p>
                                    </div>
                                    <div className="p-4 bg-slate-950/50 rounded-lg border border-slate-800">
                                        <span className="text-[10px] text-slate-500 uppercase">File Types</span>
                                        <p className="text-lg font-mono text-slate-200">{Array.from(new Set(files.map(f => f.name.split('.').pop()))).slice(0, 3).join(', ')}...</p>
                                    </div>
                                </div>
                            </div>
                            <button 
                                onClick={handleAnalyze}
                                disabled={isAnalyzing}
                                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold shadow-lg shadow-indigo-900/20 transition-all flex items-center justify-center gap-2"
                            >
                                {isAnalyzing ? <RefreshCw size={18} className="animate-spin" /> : <Layers size={18} />}
                                {isAnalyzing ? 'Analyzing Codebase...' : 'Analyze Structure'}
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 2 & 3: Analysis & Strategy */}
                {(step === 'analysis' || step === 'strategy') && analysis && (
                     <div className="flex-1 flex overflow-hidden animate-in slide-in-from-right-8 fade-in duration-300">
                         {/* Left: Analysis Results */}
                         <div className="w-1/3 bg-slate-900 border-r border-slate-800 p-6 overflow-y-auto">
                            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Project Metrics</h3>
                            <div className="grid grid-cols-2 gap-3 mb-6">
                                <MetricCard label="LOC" value={analysis.metrics.loc} />
                                <MetricCard label="Complexity" value={analysis.metrics.complexity} max={10} />
                                <MetricCard label="Maintainability" value={analysis.metrics.maintainability} />
                                <MetricCard label="Files" value={analysis.metrics.fileCount} />
                            </div>

                            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Detected Modules</h3>
                            <div className="space-y-3">
                                {analysis.detectedModules.map((mod, idx) => (
                                    <div key={idx} className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-sm font-bold text-slate-200">{mod.name}</span>
                                            <span className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-400">{mod.files.length} files</span>
                                        </div>
                                        <p className="text-xs text-slate-500">{mod.description}</p>
                                    </div>
                                ))}
                            </div>
                         </div>

                         {/* Right: Strategy Selection */}
                         <div className="flex-1 bg-slate-950 p-8 flex flex-col">
                            <h2 className="text-2xl font-bold text-white mb-2">Choose Modularization Strategy</h2>
                            <p className="text-slate-400 mb-8">Select how aggressively you want to restructure the project.</p>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                                <StrategyCard 
                                    type="conservative" 
                                    active={strategy === 'conservative'} 
                                    onClick={() => setStrategy('conservative')}
                                    title="Conservative"
                                    desc="Minimal changes. Only split clear boundaries. Preserves file structure mostly."
                                />
                                <StrategyCard 
                                    type="balanced" 
                                    active={strategy === 'balanced'} 
                                    onClick={() => setStrategy('balanced')}
                                    title="Balanced"
                                    desc="Recommended. Creates logical modules with documentation. Moderate restructuring."
                                />
                                <StrategyCard 
                                    type="aggressive" 
                                    active={strategy === 'aggressive'} 
                                    onClick={() => setStrategy('aggressive')}
                                    title="Aggressive"
                                    desc="Full re-architecture. Domain Driven Design. Strict separation of concerns."
                                />
                            </div>

                            <div className="flex-1"></div>

                            <button 
                                onClick={handleGenerate}
                                disabled={isGenerating}
                                className="self-end px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold shadow-lg shadow-indigo-900/20 transition-all flex items-center gap-2"
                            >
                                {isGenerating ? <RefreshCw size={18} className="animate-spin" /> : <Box size={18} />}
                                {isGenerating ? 'Generating Plan...' : 'Generate Modular Structure'}
                            </button>
                         </div>
                     </div>
                )}

                {/* Step 4: Preview */}
                {step === 'preview' && plan && (
                    <div className="flex-1 flex overflow-hidden animate-in slide-in-from-right-8 fade-in duration-300">
                         {/* Left: New Structure */}
                         <div className="w-80 bg-slate-900 border-r border-slate-800 flex flex-col">
                            <div className="p-4 border-b border-slate-800">
                                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                                    <Folder size={16} className="text-indigo-400" />
                                    Proposed Structure
                                </h3>
                            </div>
                            <div className="flex-1 overflow-y-auto p-4 font-mono text-xs text-slate-300 space-y-1">
                                {plan.newStructure.map((item, idx) => (
                                    <div key={idx} className="flex items-center gap-2">
                                        {item.type === 'dir' ? <Folder size={12} className="text-blue-400" /> : <FileText size={12} className="text-slate-500" />}
                                        <span>{item.path}</span>
                                    </div>
                                ))}
                            </div>
                         </div>

                         {/* Center: Documentation */}
                         <div className="flex-1 bg-slate-950 p-8 overflow-y-auto">
                            <div className="max-w-3xl mx-auto">
                                <h1 className="text-2xl font-bold text-white mb-6">Refactoring Plan</h1>
                                <div className="prose prose-invert prose-sm max-w-none">
                                    <pre className="whitespace-pre-wrap font-sans text-slate-300">{plan.docs}</pre>
                                </div>
                            </div>
                         </div>

                         {/* Right: Actions */}
                         <div className="w-64 bg-slate-900 border-l border-slate-800 p-6 flex flex-col gap-4">
                             <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Actions</h3>
                             <button className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded font-medium text-xs flex items-center justify-center gap-2">
                                 <Download size={14} /> Export Files
                             </button>
                             <button className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded font-medium text-xs flex items-center justify-center gap-2">
                                 <Eye size={14} /> View Diffs
                             </button>
                         </div>
                    </div>
                )}

            </div>
        </div>
    );
};

// UI Helpers

const StepIndicator: React.FC<{ active: boolean; completed: boolean; label: string }> = ({ active, completed, label }) => (
    <div className={`flex items-center gap-2 ${active ? 'text-indigo-400 font-bold' : completed ? 'text-green-400' : 'text-slate-600'}`}>
        <div className={`w-2 h-2 rounded-full ${active ? 'bg-indigo-400 animate-pulse' : completed ? 'bg-green-400' : 'bg-slate-700'}`} />
        <span>{label}</span>
    </div>
);

const MetricCard: React.FC<{ label: string; value: string | number; max?: number }> = ({ label, value, max }) => (
    <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
        <span className="text-[10px] text-slate-500 uppercase block mb-1">{label}</span>
        <div className="flex items-end gap-1">
            <span className="text-lg font-mono text-white leading-none">{value}</span>
            {max && <span className="text-xs text-slate-600 mb-0.5">/ {max}</span>}
        </div>
    </div>
);

const StrategyCard: React.FC<{ type: string; active: boolean; onClick: () => void; title: string; desc: string }> = ({ type, active, onClick, title, desc }) => (
    <div 
        onClick={onClick}
        className={`p-6 rounded-xl border cursor-pointer transition-all relative overflow-hidden group
            ${active 
                ? 'bg-indigo-600/10 border-indigo-500 ring-1 ring-indigo-500/50' 
                : 'bg-slate-900 border-slate-800 hover:border-slate-600 hover:bg-slate-800'}`}
    >
        <div className="flex items-center justify-between mb-3">
            <h3 className={`text-lg font-bold ${active ? 'text-indigo-400' : 'text-slate-200'}`}>{title}</h3>
            {active && <CheckCircle2 size={20} className="text-indigo-500" />}
        </div>
        <p className="text-sm text-slate-400 leading-relaxed">{desc}</p>
        
        {/* Visual Decoration */}
        <div className={`absolute -right-4 -bottom-4 w-24 h-24 rounded-full blur-2xl transition-opacity
            ${active ? 'bg-indigo-600/20 opacity-100' : 'bg-slate-700/10 opacity-0 group-hover:opacity-100'}`} />
    </div>
);

export default ComposeToModularView;
