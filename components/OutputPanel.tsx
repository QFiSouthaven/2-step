import React, { useState, useMemo } from 'react';
import { Copy, Download, Bot, Sparkles, AlertCircle, Wand2, Network, ChevronDown, ChevronUp, X, ShieldAlert, FileText, ArrowLeft, ArrowRight, Book, Eye, EyeOff, Trash2 } from 'lucide-react';
import { estimateTokens } from '../utils/fileProcessing';
import { analyzeCodebase } from '../services/geminiService';
import { SummaryFocus } from '../types';

interface OutputPanelProps {
  content: string;
  fullContext: string; // The full codebase string for AI operations
  onGenerateSummaries: () => void;
  isSummarizingFiles: boolean;
  summarizationProgress: string;
  summaryFocus: SummaryFocus;
  setSummaryFocus: (focus: SummaryFocus) => void;
  includeSummaries: boolean;
  setIncludeSummaries: (include: boolean) => void;
  
  // Chunking Props
  tokenLimit: number;
  setTokenLimit: (limit: number) => void;
  currentChunkIndex: number;
  totalChunks: number;
  onNextChunk: () => void;
  onPrevChunk: () => void;
  
  // Navigation
  onFileClick?: (path: string) => void;
  allFilePaths?: string[];
}

const OutputPanel: React.FC<OutputPanelProps> = ({ 
  content, 
  fullContext,
  onGenerateSummaries, 
  isSummarizingFiles,
  summarizationProgress,
  summaryFocus,
  setSummaryFocus,
  includeSummaries,
  setIncludeSummaries,
  tokenLimit,
  setTokenLimit,
  currentChunkIndex,
  totalChunks,
  onNextChunk,
  onPrevChunk,
  onFileClick,
  allFilePaths = []
}) => {
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [isResultCollapsed, setIsResultCollapsed] = useState(false);
  const [activeAnalysisType, setActiveAnalysisType] = useState<string>('');
  
  // View Mode: 'raw' | 'interactive'
  const [viewMode, setViewMode] = useState<'raw' | 'interactive'>('interactive');
  
  const tokenCount = estimateTokens(content);
  const sizeKB = (new Blob([content]).size / 1024).toFixed(1);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 2000);
  };

  const handleDownload = () => {
    const element = document.createElement("a");
    const file = new Blob([content], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = totalChunks > 1 ? `codebase_context_part_${currentChunkIndex + 1}.txt` : "codebase_context.txt";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const runAnalysis = async (type: 'summary' | 'audit' | 'readme' | 'architecture' | 'manifest' | 'redundancy') => {
    setIsAnalyzing(true);
    setAnalysisError(null);
    setAnalysisResult(null);
    setActiveAnalysisType(type);
    setIsResultCollapsed(false);
    
    try {
        // Always analyze the FULL context, not just the current chunk
        const result = await analyzeCodebase(fullContext, type);
        setAnalysisResult(result || "No response generated.");
    } catch (e) {
        setAnalysisError("Failed to analyze. Ensure API key is set or context is not too large.");
    } finally {
        setIsAnalyzing(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-4 py-3 bg-slate-950 border-b border-slate-800 gap-3">
        
        {/* Left Side: Stats and Chunk Select */}
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
             <span className="text-sm font-semibold text-slate-300">Generated Output</span>
             <select 
                value={tokenLimit}
                onChange={(e) => setTokenLimit(Number(e.target.value))}
                className="bg-slate-900 text-[10px] text-slate-400 border border-slate-800 rounded px-2 py-1 focus:ring-1 focus:ring-blue-500 focus:outline-none cursor-pointer"
                title="Limit output size for specific LLM models"
             >
                <option value={0}>No Limit (Single File)</option>
                <option value={100000}>100k Tokens (Claude/GPT-4)</option>
                <option value={30000}>30k Tokens (Standard Chat)</option>
                <option value={8000}>8k Tokens (Small)</option>
             </select>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-900 px-2 py-1 rounded border border-slate-800">
            <span>{tokenCount.toLocaleString()} est. tokens</span>
            <span className="w-px h-3 bg-slate-700"></span>
            <span>{sizeKB} KB</span>
          </div>
        </div>
        
        {/* Right Side: Tools */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
             {/* View Toggle */}
             <div className="flex bg-slate-900 rounded p-0.5 border border-slate-800">
                <button
                    onClick={() => setViewMode('interactive')}
                    className={`px-2 py-1 text-[10px] rounded transition-all ${viewMode === 'interactive' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-300'}`}
                    title="Interactive Mode (Click filenames to navigate)"
                >
                    Interactive
                </button>
                <button
                    onClick={() => setViewMode('raw')}
                    className={`px-2 py-1 text-[10px] rounded transition-all ${viewMode === 'raw' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-300'}`}
                    title="Raw Text Mode (Better for copy-pasting)"
                >
                    Raw Text
                </button>
             </div>

            {process.env.API_KEY && (
              <div className="flex items-center bg-slate-900 rounded border border-slate-800 p-0.5">
                <select 
                  value={summaryFocus}
                  onChange={(e) => setSummaryFocus(e.target.value as SummaryFocus)}
                  className="bg-transparent text-xs text-slate-400 border-none focus:ring-0 focus:outline-none py-1 pl-2 pr-1 cursor-pointer hover:text-slate-300"
                  disabled={isSummarizingFiles}
                  title="Summary Focus Area"
                >
                   <option value="general">General</option>
                   <option value="security">Security</option>
                   <option value="performance">Performance</option>
                   <option value="core">Core Logic</option>
                </select>
                <div className="w-px h-4 bg-slate-700 mx-1"></div>
                <button
                  onClick={onGenerateSummaries}
                  disabled={isSummarizingFiles}
                  className={`
                      flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded transition-all duration-200
                      ${isSummarizingFiles
                          ? 'bg-purple-900/20 text-purple-300 cursor-not-allowed'
                          : 'bg-transparent text-purple-400 hover:text-purple-300 hover:bg-purple-900/20'
                      }
                  `}
                  title="Generate AI summaries for each file"
                >
                  {isSummarizingFiles ? (
                      <div className="animate-spin h-3 w-3 border-2 border-purple-500 border-t-transparent rounded-full" />
                  ) : (
                      <Wand2 size={14} />
                  )}
                  {isSummarizingFiles ? summarizationProgress : 'Enrich'}
                </button>
                
                {/* Clean Context Toggle */}
                <div className="w-px h-4 bg-slate-700 mx-1"></div>
                <button
                    onClick={() => setIncludeSummaries(!includeSummaries)}
                    className={`p-1.5 rounded transition-colors ${includeSummaries ? 'text-blue-400 hover:text-blue-300' : 'text-slate-500 hover:text-slate-400'}`}
                    title={includeSummaries ? "AI Summaries included in output" : "AI Summaries hidden from output"}
                >
                    {includeSummaries ? <Eye size={14} /> : <EyeOff size={14} />}
                </button>
               </div>
            )}
           <button
            onClick={handleDownload}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
            title="Download .txt"
          >
            <Download size={18} />
          </button>
          <button
            onClick={handleCopy}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded transition-all duration-200
              ${copyFeedback 
                ? 'bg-green-500/10 text-green-400 border border-green-500/20' 
                : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/20'}`}
          >
            {copyFeedback ? <CheckIcon /> : <Copy size={14} />}
            {copyFeedback ? 'Copied!' : 'Copy'}
          </button>
        </div>
      </div>

      {/* Pagination Bar */}
      {tokenLimit > 0 && totalChunks > 1 && (
          <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-800 text-xs">
              <span className="text-slate-400">
                  Viewing Part <span className="text-white font-mono">{currentChunkIndex + 1}</span> of <span className="text-white font-mono">{totalChunks}</span>
              </span>
              <div className="flex items-center gap-2">
                  <button 
                    onClick={onPrevChunk} 
                    disabled={currentChunkIndex === 0}
                    className="p-1 hover:bg-slate-800 rounded text-slate-400 disabled:opacity-30 transition-colors"
                  >
                      <ArrowLeft size={14} />
                  </button>
                   <button 
                    onClick={onNextChunk} 
                    disabled={currentChunkIndex === totalChunks - 1}
                    className="p-1 hover:bg-slate-800 rounded text-slate-400 disabled:opacity-30 transition-colors"
                  >
                      <ArrowRight size={14} />
                  </button>
              </div>
          </div>
      )}

      {/* Editor/Preview Area */}
      <div className="flex-1 relative group bg-slate-900 overflow-hidden">
        {viewMode === 'raw' ? (
             <textarea 
                className="w-full h-full bg-slate-900 p-4 text-xs font-mono text-slate-300 resize-none focus:outline-none scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent leading-relaxed"
                value={content}
                readOnly
                spellCheck={false}
            />
        ) : (
            <InteractiveView content={content} onFileClick={onFileClick} allFilePaths={allFilePaths} />
        )}
      </div>

      {/* AI Analysis Bar */}
      <div className="p-4 bg-slate-950 border-t border-slate-800 flex flex-col gap-4">
        
        {/* Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-slate-400">
                <Sparkles size={16} className="text-purple-400" />
                <span className="text-sm">Analyze with Gemini 3 Pro</span>
            </div>
            
            <div className="flex gap-2 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0">
                <button 
                    disabled={isAnalyzing || !fullContext}
                    onClick={() => runAnalysis('summary')}
                    className={`px-3 py-1.5 text-xs rounded border transition-colors whitespace-nowrap
                        ${activeAnalysisType === 'summary' && analysisResult 
                            ? 'bg-purple-900/30 border-purple-500/50 text-purple-200' 
                            : 'bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-300 border-slate-700'}`}
                >
                    {isAnalyzing && activeAnalysisType === 'summary' ? 'Thinking...' : 'Summarize'}
                </button>
                 <button 
                    disabled={isAnalyzing || !fullContext}
                    onClick={() => runAnalysis('architecture')}
                    className={`px-3 py-1.5 text-xs rounded border transition-colors flex items-center gap-1.5 whitespace-nowrap
                        ${activeAnalysisType === 'architecture' && analysisResult 
                            ? 'bg-purple-900/30 border-purple-500/50 text-purple-200' 
                            : 'bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-300 border-slate-700'}`}
                >
                    <Network size={12} />
                    Architecture
                </button>
                 <button 
                    disabled={isAnalyzing || !fullContext}
                    onClick={() => runAnalysis('manifest')}
                    className={`px-3 py-1.5 text-xs rounded border transition-colors flex items-center gap-1.5 whitespace-nowrap
                        ${activeAnalysisType === 'manifest' && analysisResult 
                            ? 'bg-purple-900/30 border-purple-500/50 text-purple-200' 
                            : 'bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-300 border-slate-700'}`}
                >
                    <Book size={12} />
                    Manifest
                </button>
                <button 
                    disabled={isAnalyzing || !fullContext}
                    onClick={() => runAnalysis('audit')}
                    className={`px-3 py-1.5 text-xs rounded border transition-colors flex items-center gap-1.5 whitespace-nowrap
                         ${activeAnalysisType === 'audit' && analysisResult 
                            ? 'bg-purple-900/30 border-purple-500/50 text-purple-200' 
                            : 'bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-300 border-slate-700'}`}
                >
                     <ShieldAlert size={12} />
                    Audit
                </button>
                <button 
                    disabled={isAnalyzing || !fullContext}
                    onClick={() => runAnalysis('redundancy')}
                    className={`px-3 py-1.5 text-xs rounded border transition-colors flex items-center gap-1.5 whitespace-nowrap
                         ${activeAnalysisType === 'redundancy' && analysisResult 
                            ? 'bg-purple-900/30 border-purple-500/50 text-purple-200' 
                            : 'bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-300 border-slate-700'}`}
                >
                     <Trash2 size={12} />
                    Create Redundant List
                </button>
                 <button 
                    disabled={isAnalyzing || !fullContext}
                    onClick={() => runAnalysis('readme')}
                    className={`px-3 py-1.5 text-xs rounded border transition-colors whitespace-nowrap
                        ${activeAnalysisType === 'readme' && analysisResult 
                            ? 'bg-purple-900/30 border-purple-500/50 text-purple-200' 
                            : 'bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-300 border-slate-700'}`}
                >
                    Generate README
                </button>
            </div>
        </div>

        {/* Loading State */}
        {isAnalyzing && !analysisResult && (
            <div className="flex items-center gap-3 text-sm text-slate-400 animate-pulse px-2">
                <Bot size={18} />
                <span>Reading codebase...</span>
            </div>
        )}

        {/* Error State */}
        {analysisError && (
             <div className="flex items-center justify-between p-3 bg-red-900/20 border border-red-900/50 rounded text-red-400 text-sm">
                <div className="flex items-center gap-2">
                    <AlertCircle size={16} />
                    <span>{analysisError}</span>
                </div>
                <button onClick={() => setAnalysisError(null)} className="text-xs hover:underline">Dismiss</button>
             </div>
        )}

        {/* Results Section (Collapsible) */}
        {analysisResult && (
            <div className="border border-slate-800 rounded-lg overflow-hidden bg-slate-900 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div 
                  className="flex items-center justify-between px-4 py-2.5 bg-slate-800/50 cursor-pointer hover:bg-slate-800 transition-colors select-none"
                  onClick={() => setIsResultCollapsed(!isResultCollapsed)}
                >
                   <div className="flex items-center gap-2">
                       <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">
                         {activeAnalysisType.replace('_', ' ').charAt(0).toUpperCase() + activeAnalysisType.replace('_', ' ').slice(1)} Result
                       </span>
                   </div>
                   <div className="flex items-center gap-2 text-slate-400">
                     {isResultCollapsed ? <ChevronDown size={16}/> : <ChevronUp size={16}/>}
                     <button 
                        onClick={(e) => { e.stopPropagation(); setAnalysisResult(null); setActiveAnalysisType(''); }} 
                        className="hover:text-white ml-2"
                        title="Close result"
                     >
                        <X size={16}/>
                     </button>
                   </div>
                </div>
                
                {!isResultCollapsed && (
                  <div className="max-h-80 overflow-y-auto p-4 text-sm text-slate-300 border-t border-slate-800 scrollbar-thin scrollbar-thumb-slate-700">
                    <div className="prose prose-invert prose-sm max-w-none prose-p:leading-relaxed prose-headings:text-slate-200 prose-code:bg-slate-800 prose-code:px-1 prose-code:rounded prose-code:before:content-none prose-code:after:content-none">
                        <pre className="font-sans whitespace-pre-wrap">{analysisResult}</pre>
                    </div>
                  </div>
                )}
            </div>
        )}
      </div>
    </div>
  );
};

// Component to parse the string and make filenames clickable
const InteractiveView: React.FC<{ content: string; onFileClick?: (path: string) => void; allFilePaths: string[] }> = ({ content, onFileClick, allFilePaths }) => {
    // We split by the separator lines we generated
    const lines = content.split('\n');
    const rendered: React.ReactNode[] = [];
    
    // Create a set of filenames for quick lookup to enable deep linking inside code
    const fileNameMap = useMemo(() => {
        const map = new Map<string, string>(); // Token -> FullPath
        allFilePaths.forEach(path => {
            const name = path.split('/').pop();
            if (name) {
                map.set(name, path); // Exact match (e.g. App.tsx)
                
                // Also map basename without extension for imports like "import X from './X'"
                const lastDot = name.lastIndexOf('.');
                if (lastDot > 0) {
                    const noExt = name.substring(0, lastDot);
                    if (noExt !== 'index') { // Avoid ambiguous 'index' matches
                        map.set(noExt, path);
                    }
                }
            }
        });
        return map;
    }, [allFilePaths]);

    // Simple regex to find words that might be filenames or paths
    const renderLineWithLinks = (line: string, lineIndex: number) => {
        if (!onFileClick || allFilePaths.length === 0) return line;

        // Split by separators but keep delimiters to reconstruct, or just split by token-like boundaries
        // We use a capture group to keep the delimiters in the output array so we can reconstruct exact spacing
        // Enhanced regex to split by more code-like symbols to isolate filenames better
        const tokens = line.split(/([ \t\n\r"';,(){}<>\[\]=\/:])/);
        
        return tokens.map((token, i) => {
            // Clean token for checking
            let clean = token.trim();
            // Remove quotes if they attached (regex split usually isolates quotes, but just in case)
            clean = clean.replace(/^['"]|['"]$/g, '');
            
            // Handle directory prefixes (e.g., ./components/Button -> Button)
            // We just look at the last segment
            const basename = clean.split('/').pop();

            if (basename && fileNameMap.has(basename)) {
                const fullPath = fileNameMap.get(basename)!;
                return (
                    <span 
                        key={`${lineIndex}-${i}`}
                        onClick={(e) => { e.stopPropagation(); onFileClick(fullPath); }}
                        className="text-blue-300 hover:text-blue-200 underline decoration-blue-500/30 cursor-pointer"
                        title={`Go to ${fullPath}`}
                    >
                        {token}
                    </span>
                );
            }
            return token;
        });
    };
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const fileStartMatch = line.match(/^--- FILE START: (.+) ---$/);
        
        if (fileStartMatch && fileStartMatch[1]) {
            const path = fileStartMatch[1];
            rendered.push(
                <div 
                    key={`header-${i}`} 
                    className="text-blue-400 font-bold py-2 mt-4 cursor-pointer hover:underline flex items-center gap-2 bg-slate-900/80 sticky top-0 backdrop-blur-sm"
                    onClick={() => onFileClick?.(path)}
                    title="Click to locate in file tree"
                >
                    <FileText size={14} />
                    {line}
                </div>
            );
        } else if (line.match(/^--- FILE END: (.+) ---$/)) {
             rendered.push(
                <div key={`footer-${i}`} className="text-slate-600 italic py-2 mb-2">
                    {line}
                </div>
            );
        } else {
            // Check if this line is part of a code block (simple heuristic: indented or inside markers)
            // For now, apply linking to all non-marker lines
            rendered.push(
                <div key={`line-${i}`} className="whitespace-pre min-h-[1.25em]">
                    {renderLineWithLinks(line, i)}
                </div>
            );
        }
    }

    return (
        <div className="w-full h-full overflow-y-auto p-4 text-xs font-mono text-slate-300 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent leading-relaxed">
            {rendered}
        </div>
    );
}

const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"></polyline>
  </svg>
)

export default OutputPanel;