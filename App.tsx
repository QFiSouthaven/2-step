
import React, { useState, useMemo, useEffect, useRef } from 'react';
import DropZone from './components/DropZone';
import FileTree from './components/FileTree';
import OutputPanel from './components/OutputPanel';
import FilterPanel from './components/FilterPanel';
import ProjectSandbox from './components/ProjectSandbox'; // Updated import
import AgentDashboard from './components/AgentDashboard'; 
import ComposeToModularView from './components/ComposeToModularView'; // New Import
import SafeComponent from './components/SafeComponent'; 
import { SafeModeProvider } from './contexts/SafeModeContext'; 
import { ColosseumProvider } from './contexts/ColosseumContext'; 
import { ProcessedFile, FileNode, SummaryFocus, SafeModeLevel } from './types';
import { isIgnored, readFileContent, buildFileTree, generateLLMOutput, createPatternMatcher, generateChunks } from './utils/fileProcessing';
import { summarizeCode } from './services/geminiService';
import { Layers, FileCode2, Github, AlertTriangle, UploadCloud, Play, BrainCircuit, Puzzle } from 'lucide-react';

// Main App Content wrapped in safe mode logic
const AppContent: React.FC = () => {
  const [files, setFiles] = useState<ProcessedFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<string>('');
  
  // Summarization State
  const [isSummarizingFiles, setIsSummarizingFiles] = useState(false);
  const [summarizationProgress, setSummarizationProgress] = useState('');
  const [summaryFocus, setSummaryFocus] = useState<SummaryFocus>('general');
  const [includeSummaries, setIncludeSummaries] = useState(true);

  // Chunking State
  const [tokenLimit, setTokenLimit] = useState<number>(0); 
  const [currentChunkIndex, setCurrentChunkIndex] = useState(0);

  // Navigation State
  const [activeFilePath, setActiveFilePath] = useState<string | null>(null);

  // Sandbox State
  const [showSandbox, setShowSandbox] = useState(false);
  
  // Colosseum State
  const [showColosseum, setShowColosseum] = useState(false);

  // Compose to Modular State
  const [showComposeToModular, setShowComposeToModular] = useState(false);

  const emptyStateInputRef = useRef<HTMLInputElement>(null);

  // Handlers
  const handleFilesSelected = async (rawFiles: File[]) => {
    setLoading(true);
    setProcessingStatus('Scanning files...');
    
    const newProcessedFiles: ProcessedFile[] = [];
    let processedCount = 0;
    const CHUNK_SIZE = 20;
    
    try {
        const sortedFiles = rawFiles.sort((a, b) => {
            const pathA = a.webkitRelativePath || a.name;
            const pathB = b.webkitRelativePath || b.name;
            return pathA.localeCompare(pathB);
        });
        
        for (let i = 0; i < sortedFiles.length; i += CHUNK_SIZE) {
            const chunk = sortedFiles.slice(i, i + CHUNK_SIZE);
            await Promise.all(chunk.map(async (file) => {
                const path = file.webkitRelativePath || file.name;
                if (isIgnored(path)) return;
                const content = await readFileContent(file);
                newProcessedFiles.push({
                    path,
                    name: file.name,
                    size: file.size,
                    type: file.type,
                    content,
                    selected: true,
                    isBinary: content === '[Binary file detected]'
                });
            }));
            processedCount += chunk.length;
            setProcessingStatus(`Processed ${processedCount}/${rawFiles.length} files...`);
            await new Promise(r => setTimeout(r, 0));
        }
    } catch (err) {
        console.error(err);
        setProcessingStatus('Error processing files.');
    } finally {
        setFiles(newProcessedFiles);
        setLoading(false);
        setProcessingStatus('');
    }
  };

  const toggleFile = (path: string, checked: boolean) => {
    setFiles(prev => prev.map(f => {
      if (f.path === path) return { ...f, selected: checked };
      if (f.path.startsWith(path + '/')) return { ...f, selected: checked };
      return f;
    }));
  };

  const handleApplyFilters = (patternsInput: string) => {
    if (!patternsInput.trim()) return;
    const patterns = patternsInput.split('\n').map(p => p.trim()).filter(p => p.length > 0);
    if (patterns.length === 0) return;
    const matchers = patterns.map(createPatternMatcher);
    setFiles(prev => prev.map(f => {
      const shouldExclude = matchers.some(regex => regex.test(f.path));
      if (shouldExclude) {
          return { ...f, selected: false };
      }
      return f;
    }));
  };

  const handleResetFilters = () => {
    setFiles(prev => prev.map(f => ({ ...f, selected: true })));
  };

  const handleGenerateSummaries = async () => {
      if (!process.env.API_KEY) return;
      setIsSummarizingFiles(true);
      setIncludeSummaries(true);
      const filesToSummarize = files.filter(f => f.selected && !f.isBinary && !f.summary);
      const total = filesToSummarize.length;
      let completed = 0;
      const BATCH_SIZE = 2; 
      try {
        for (let i = 0; i < total; i += BATCH_SIZE) {
            const batch = filesToSummarize.slice(i, i + BATCH_SIZE);
            await Promise.all(batch.map(async (file) => {
                const summary = await summarizeCode(file.name, file.content, summaryFocus);
                setFiles(prev => prev.map(f => f.path === file.path ? { ...f, summary } : f));
            }));
            completed += batch.length;
            setSummarizationProgress(`${Math.min(completed, total)}/${total}`);
            if (i + BATCH_SIZE < total) await new Promise(r => setTimeout(r, 4000));
        }
      } catch (e) {
          console.error("Summarization error", e);
      } finally {
          setIsSummarizingFiles(false);
          setSummarizationProgress('');
      }
  };

  const handleFileClick = (path: string) => {
      setActiveFilePath(path);
  };

  // Agent Colosseum Handler for New Files
  const handleNewFilesGenerated = (generatedFiles: any[]) => {
      // In a real implementation, this would parse the AI output to extract file content.
      // For this demo, we assume the AI returns structured file objects or we rely on the simulation in Context.
      // We will merge mock generated files or real ones if implemented.
      console.log("New files generated by swarm:", generatedFiles);
  };

  const fileTree = useMemo(() => buildFileTree(files), [files]);
  const fullOutput = useMemo(() => generateLLMOutput(files, { includeSummaries }), [files, includeSummaries]);
  const chunks = useMemo(() => {
    if (tokenLimit === 0) return [fullOutput];
    return generateChunks(files, tokenLimit, { includeSummaries });
  }, [files, tokenLimit, fullOutput, includeSummaries]);

  useEffect(() => {
    if (currentChunkIndex >= chunks.length) {
      setCurrentChunkIndex(Math.max(0, chunks.length - 1));
    }
  }, [chunks.length, currentChunkIndex]);

  const displayedContent = chunks[currentChunkIndex] || "";

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200 font-sans selection:bg-blue-500/30">
      
      {/* Project Sandbox Modal */}
      {showSandbox && <ProjectSandbox onClose={() => setShowSandbox(false)} fullContext={fullOutput} files={files} />}
      
      {/* Agent Colosseum Modal */}
      {showColosseum && (
        <AgentDashboard 
            onClose={() => setShowColosseum(false)} 
            fullContext={fullOutput} 
        />
      )}

      {/* Compose To Modular Modal */}
      {showComposeToModular && (
          <ComposeToModularView
            onClose={() => setShowComposeToModular(false)}
            fullContext={fullOutput}
            files={files}
          />
      )}

      {/* Navbar */}
      <nav className="border-b border-slate-800 bg-slate-950/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg shadow-lg shadow-blue-900/20">
              <Layers size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-white">CodeContext.ai</h1>
              <p className="text-[10px] text-slate-400 font-medium tracking-wide uppercase">LLM Context Generator</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">

             {/* Compose to Modular Trigger */}
             <button
                onClick={() => setShowComposeToModular(true)}
                disabled={files.length === 0}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium transition-colors
                    ${files.length === 0 
                        ? 'bg-slate-800/50 border-slate-800 text-slate-600 cursor-not-allowed' 
                        : 'bg-indigo-900/20 hover:bg-indigo-900/40 border-indigo-500/30 text-indigo-400'}`}
                title="Compose to Modular Refactoring Assistant"
             >
                 <Puzzle size={14} />
                 <span>Compose to Modular</span>
             </button>
             
             {/* Colosseum Trigger */}
             <button 
                onClick={() => setShowColosseum(true)}
                disabled={files.length === 0}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium transition-colors
                    ${files.length === 0 
                        ? 'bg-slate-800/50 border-slate-800 text-slate-600 cursor-not-allowed' 
                        : 'bg-purple-900/20 hover:bg-purple-900/40 border-purple-500/30 text-purple-300'}`}
                title="Open Agent Colosseum Swarm Orchestrator"
             >
                 <BrainCircuit size={14} />
                 <span>Agent Colosseum</span>
             </button>

             {/* Project Sandbox Trigger */}
             <button 
                onClick={() => setShowSandbox(true)}
                disabled={files.length === 0}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium transition-colors
                    ${files.length === 0 
                        ? 'bg-slate-800/50 border-slate-800 text-slate-600 cursor-not-allowed' 
                        : 'bg-emerald-900/20 hover:bg-emerald-900/40 border-emerald-500/30 text-emerald-400'}`}
                title="Open Project Runtime Sandbox"
             >
                 <Play size={14} />
                 <span>Project Sandbox</span>
             </button>

             {process.env.API_KEY ? (
                 <span className="text-xs px-2 py-1 rounded-full bg-green-500/10 text-green-400 border border-green-500/20">Gemini Active</span>
             ) : (
                 <span className="text-xs px-2 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1">
                     <AlertTriangle size={10} />
                     Gemini Disabled
                 </span>
             )}
             <a href="https://github.com" target="_blank" rel="noreferrer" className="text-slate-400 hover:text-white transition-colors">
               <Github size={20} />
             </a>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 h-[calc(100vh-64px)]">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">
          
          <div className="lg:col-span-4 flex flex-col gap-6 h-full overflow-hidden">
            <div className="flex-shrink-0 space-y-4">
              <SafeComponent id="comp-dropzone" name="File Uploader" category="ui" minSafeModeLevel={SafeModeLevel.ESSENTIAL}>
                <DropZone onFilesSelected={handleFilesSelected} isLoading={loading} />
              </SafeComponent>
              
              {loading ? (
                  <div className="text-xs text-center text-blue-400 animate-pulse font-mono">{processingStatus}</div>
              ) : (
                  files.length > 0 && (
                      <SafeComponent id="comp-filter" name="Filter Panel" category="ui" minSafeModeLevel={SafeModeLevel.STANDARD} dependencies={['comp-dropzone']}>
                        <FilterPanel onApplyFilters={handleApplyFilters} onResetFilters={handleResetFilters} />
                      </SafeComponent>
                  )
              )}
            </div>

            <div className="flex-1 min-h-0 bg-slate-900 border border-slate-800 rounded-xl flex flex-col overflow-hidden shadow-lg">
              <div className="p-3 border-b border-slate-800 bg-slate-950/50 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <FileCode2 size={14} />
                    Project Structure
                </span>
                <span className="text-xs text-slate-500">{files.filter(f => f.selected).length} selected</span>
              </div>
              <div className="flex-1 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                <SafeComponent id="comp-filetree" name="File Explorer" category="ui" minSafeModeLevel={SafeModeLevel.ESSENTIAL}>
                    <FileTree nodes={fileTree} onToggle={toggleFile} activePath={activeFilePath || undefined} />
                </SafeComponent>
              </div>
            </div>
          </div>

          <div className="lg:col-span-8 h-full min-h-[500px]">
            {files.length > 0 ? (
                <SafeComponent id="comp-output" name="Output Panel" category="core" minSafeModeLevel={SafeModeLevel.MINIMAL}>
                    <OutputPanel 
                        content={displayedContent} 
                        fullContext={fullOutput}
                        onGenerateSummaries={handleGenerateSummaries}
                        isSummarizingFiles={isSummarizingFiles}
                        summarizationProgress={summarizationProgress}
                        summaryFocus={summaryFocus}
                        setSummaryFocus={setSummaryFocus}
                        includeSummaries={includeSummaries}
                        setIncludeSummaries={setIncludeSummaries}
                        tokenLimit={tokenLimit}
                        setTokenLimit={setTokenLimit}
                        currentChunkIndex={currentChunkIndex}
                        totalChunks={chunks.length}
                        onNextChunk={() => setCurrentChunkIndex(prev => Math.min(prev + 1, chunks.length - 1))}
                        onPrevChunk={() => setCurrentChunkIndex(prev => Math.max(prev - 1, 0))}
                        onFileClick={handleFileClick}
                        allFilePaths={files.map(f => f.path)}
                    />
                </SafeComponent>
            ) : (
                <SafeComponent id="comp-emptystate" name="Empty State" category="ui">
                    <div className="h-full flex flex-col items-center justify-center border border-slate-800 border-dashed rounded-xl bg-slate-900/30 text-slate-500 gap-4">
                        <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center mb-2">
                            <FileCode2 size={32} className="opacity-50" />
                        </div>
                        <h3 className="text-lg font-medium text-slate-300">Upload a project to get started</h3>
                        <p className="text-slate-500 max-w-sm text-center mb-4">Select a folder to analyze, summarize, and convert into LLM-ready context.</p>
                        
                        <button 
                            onClick={() => emptyStateInputRef.current?.click()}
                            className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium transition-all shadow-lg shadow-blue-900/20 flex items-center gap-2 group border border-blue-500/50"
                        >
                            <UploadCloud size={20} className="group-hover:scale-105 transition-transform" />
                            Select Project Folder
                        </button>
                        <input
                            type="file"
                            ref={emptyStateInputRef}
                            className="hidden"
                            multiple
                            onChange={(e) => {
                                if (e.target.files && e.target.files.length > 0) {
                                    handleFilesSelected(Array.from(e.target.files));
                                }
                            }}
                            {...({ webkitdirectory: "", directory: "" } as any)}
                        />
                    </div>
                </SafeComponent>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

// Root App wrapping with Provider
const App: React.FC = () => {
    return (
        <SafeModeProvider>
            <ColosseumProvider>
                <AppContent />
            </ColosseumProvider>
        </SafeModeProvider>
    );
}

export default App;
