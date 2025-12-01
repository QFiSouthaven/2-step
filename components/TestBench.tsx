
import React, { useState, useMemo } from 'react';
import { useSafeMode } from '../contexts/SafeModeContext';
import { SafeModeLevel, ComponentStatus, SystemComponent } from '../types';
import { 
    Activity, Shield, Power, Play, RotateCcw, AlertOctagon, 
    Search, Terminal, Database, Layout, Globe, Cpu, 
    CheckCircle2, XCircle, AlertTriangle, PauseCircle, Download
} from 'lucide-react';

const StatusIcon = ({ status }: { status: ComponentStatus }) => {
    switch(status) {
        case 'healthy': return <CheckCircle2 size={14} className="text-green-500" />;
        case 'degraded': return <AlertTriangle size={14} className="text-yellow-500" />;
        case 'failed': return <XCircle size={14} className="text-red-500" />;
        case 'disabled': return <PauseCircle size={14} className="text-slate-600" />;
        case 'testing': return <Activity size={14} className="text-blue-500 animate-spin" />;
        default: return <div className="w-3 h-3 rounded-full bg-slate-700" />;
    }
};

const TestBench: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { 
      registry, 
      logs, 
      safeModeLevel, 
      setSafeModeLevel, 
      runDiagnostics, 
      toggleComponent,
      emergencyStop,
      restoreDefaults
  } = useSafeMode();

  const [selectedComponentId, setSelectedComponentId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const components = useMemo(() => Array.from(registry.values()), [registry]);

  const filteredComponents = components.filter(c => 
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      c.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedComponent = selectedComponentId ? registry.get(selectedComponentId) : null;

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950 flex flex-col font-sans text-slate-200">
      
      {/* 1. Quick Actions Toolbar */}
      <div className="h-16 border-b border-slate-800 bg-slate-900 px-6 flex items-center justify-between shadow-lg">
         <div className="flex items-center gap-4">
             <div className="p-2 bg-blue-600/20 rounded-lg border border-blue-500/30">
                 <Shield className="text-blue-400" size={24} />
             </div>
             <div>
                 <h2 className="text-lg font-bold tracking-tight text-white">System Diagnostics</h2>
                 <p className="text-[10px] text-slate-400 uppercase tracking-widest font-mono">
                     Safe Mode Level: {SafeModeLevel[safeModeLevel]} ({safeModeLevel})
                 </p>
             </div>
         </div>

         <div className="flex items-center gap-3">
             {/* Safe Mode Selector */}
             <div className="flex bg-slate-950 rounded border border-slate-800 p-1">
                 {[1, 2, 3, 4].map(level => (
                     <button
                        key={level}
                        onClick={() => setSafeModeLevel(level)}
                        className={`px-3 py-1.5 text-xs font-mono rounded transition-all ${safeModeLevel === level ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-300'}`}
                     >
                         L{level}
                     </button>
                 ))}
             </div>

             <div className="h-6 w-px bg-slate-800 mx-2"></div>

             <button 
                onClick={() => runDiagnostics()}
                className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded text-xs font-medium transition-colors"
             >
                 <Activity size={14} />
                 Run Full Scan
             </button>
             
             <button 
                onClick={restoreDefaults}
                className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded text-xs font-medium transition-colors"
             >
                 <RotateCcw size={14} />
                 Restore Defaults
             </button>

             <button 
                onClick={emergencyStop}
                className="flex items-center gap-2 px-4 py-2 bg-red-900/20 hover:bg-red-900/40 border border-red-900/50 text-red-400 rounded text-xs font-medium transition-colors"
             >
                 <AlertOctagon size={14} />
                 EMERGENCY STOP
             </button>

             <button onClick={onClose} className="ml-4 p-2 hover:bg-slate-800 rounded-full">
                 <Power size={20} className="text-slate-400 hover:text-white" />
             </button>
         </div>
      </div>

      {/* Main Content Grid */}
      <div className="flex-1 flex overflow-hidden">
          
          {/* 2. Component Explorer (Left Sidebar) */}
          <div className="w-80 border-r border-slate-800 bg-slate-900/50 flex flex-col">
              <div className="p-4 border-b border-slate-800">
                  <div className="relative">
                      <Search size={14} className="absolute left-3 top-2.5 text-slate-500" />
                      <input 
                        type="text" 
                        placeholder="Filter components..." 
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none text-slate-300 placeholder:text-slate-600"
                      />
                  </div>
              </div>
              <div className="flex-1 overflow-y-auto">
                  {['core', 'ui', 'data', 'integration'].map(category => {
                      const cats = filteredComponents.filter(c => c.category === category);
                      if (cats.length === 0) return null;
                      return (
                          <div key={category} className="mb-2">
                              <div className="px-4 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-slate-900/30 flex items-center gap-2">
                                  {category === 'core' && <Cpu size={12}/>}
                                  {category === 'ui' && <Layout size={12}/>}
                                  {category === 'data' && <Database size={12}/>}
                                  {category === 'integration' && <Globe size={12}/>}
                                  {category}
                              </div>
                              {cats.map(comp => (
                                  <div 
                                    key={comp.id}
                                    onClick={() => setSelectedComponentId(comp.id)}
                                    className={`px-4 py-3 flex items-center justify-between cursor-pointer border-l-2 transition-colors
                                        ${selectedComponentId === comp.id 
                                            ? 'bg-blue-600/10 border-blue-500 text-white' 
                                            : 'border-transparent hover:bg-slate-800 text-slate-400'}`}
                                  >
                                      <div className="flex items-center gap-3">
                                          <StatusIcon status={comp.status} />
                                          <span className="text-sm font-medium">{comp.name}</span>
                                      </div>
                                      {comp.status === 'failed' && <span className="text-[10px] text-red-500 font-mono">ERR</span>}
                                  </div>
                              ))}
                          </div>
                      );
                  })}
              </div>
          </div>

          {/* 3. Control Matrix & Detail View (Center) */}
          <div className="flex-1 flex flex-col bg-slate-950">
              {selectedComponent ? (
                  <div className="flex-1 p-8 overflow-y-auto">
                      <div className="flex items-start justify-between mb-8">
                          <div>
                              <h1 className="text-2xl font-bold text-white mb-2 flex items-center gap-3">
                                  {selectedComponent.name}
                                  <span className={`text-xs px-2 py-0.5 rounded-full border uppercase tracking-wide
                                      ${selectedComponent.status === 'healthy' ? 'bg-green-500/10 border-green-500/20 text-green-400' : 
                                        selectedComponent.status === 'failed' ? 'bg-red-500/10 border-red-500/20 text-red-400' :
                                        'bg-slate-800 border-slate-700 text-slate-400'}`}>
                                      {selectedComponent.status}
                                  </span>
                              </h1>
                              <p className="text-slate-400 font-mono text-sm">ID: {selectedComponent.id} • Category: {selectedComponent.category}</p>
                          </div>
                          <div className="flex gap-2">
                                <button 
                                    onClick={() => toggleComponent(selectedComponent.id, selectedComponent.status !== 'healthy')}
                                    className={`px-4 py-2 rounded font-medium text-xs transition-colors border
                                        ${selectedComponent.status === 'disabled' || selectedComponent.status === 'failed'
                                            ? 'bg-green-600 text-white border-green-500 hover:bg-green-500'
                                            : 'bg-slate-800 text-red-400 border-slate-700 hover:bg-slate-700'}`}
                                >
                                    {selectedComponent.status === 'disabled' || selectedComponent.status === 'failed' ? 'Enable Component' : 'Disable Component'}
                                </button>
                                <button 
                                    onClick={() => runDiagnostics(selectedComponent.id)}
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded font-medium text-xs transition-colors flex items-center gap-2 shadow-lg shadow-blue-900/20"
                                >
                                    <Play size={14} />
                                    Run Diagnostics
                                </button>
                          </div>
                      </div>

                      {/* Metrics Grid */}
                      <div className="grid grid-cols-3 gap-4 mb-8">
                          <div className="p-4 bg-slate-900 rounded-xl border border-slate-800">
                              <p className="text-slate-500 text-xs uppercase mb-1">Render Time</p>
                              <p className="text-2xl font-mono text-white">{selectedComponent.metrics?.renderTime}ms</p>
                          </div>
                          <div className="p-4 bg-slate-900 rounded-xl border border-slate-800">
                              <p className="text-slate-500 text-xs uppercase mb-1">Memory Usage (Est.)</p>
                              <p className="text-2xl font-mono text-white">{selectedComponent.metrics?.memoryUsage} MB</p>
                          </div>
                          <div className="p-4 bg-slate-900 rounded-xl border border-slate-800">
                              <p className="text-slate-500 text-xs uppercase mb-1">Error Count</p>
                              <p className={`text-2xl font-mono ${selectedComponent.metrics?.errors || 0 > 0 ? 'text-red-400' : 'text-green-400'}`}>
                                  {selectedComponent.metrics?.errors}
                              </p>
                          </div>
                      </div>

                      {/* Dependencies */}
                      <div className="mb-8">
                          <h3 className="text-sm font-bold text-slate-300 mb-3 uppercase tracking-widest">Dependencies</h3>
                          <div className="flex flex-wrap gap-2">
                              {selectedComponent.dependencies.length > 0 ? selectedComponent.dependencies.map(dep => (
                                  <div key={dep} className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded text-xs text-slate-400">
                                      {dep}
                                  </div>
                              )) : (
                                  <span className="text-slate-600 italic text-sm">No external dependencies</span>
                              )}
                          </div>
                      </div>

                      {/* Error Log for Component */}
                      {selectedComponent.lastError && (
                          <div className="p-4 bg-red-900/10 border border-red-900/30 rounded-lg text-red-200 text-sm font-mono">
                              <p className="font-bold mb-1">Last Critical Error:</p>
                              {selectedComponent.lastError}
                          </div>
                      )}

                  </div>
              ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-slate-600">
                      <Activity size={48} className="mb-4 opacity-20" />
                      <p>Select a component to inspect details</p>
                  </div>
              )}

              {/* 4. Diagnostic Console (Bottom) */}
              <div className="h-48 border-t border-slate-800 bg-slate-900 flex flex-col">
                  <div className="px-4 py-2 border-b border-slate-800 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase">
                          <Terminal size={12} />
                          System Log Stream
                      </div>
                      <div className="flex gap-2">
                          <button className="p-1 hover:text-white text-slate-500"><Download size={12}/></button>
                      </div>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 font-mono text-xs space-y-1">
                      {logs.map(log => (
                          <div key={log.id} className="flex gap-3 hover:bg-slate-800/50 p-0.5 rounded">
                              <span className="text-slate-600">{log.timestamp.split('T')[1].split('.')[0]}</span>
                              <span className={`w-12 font-bold ${
                                  log.level === 'INFO' ? 'text-blue-400' :
                                  log.level === 'WARN' ? 'text-yellow-400' :
                                  log.level === 'ERROR' ? 'text-red-500' : 'text-slate-400'
                              }`}>[{log.level}]</span>
                              <span className="text-slate-500 w-24 truncate" title={log.componentId}>{log.componentId}</span>
                              <span className="text-slate-300">{log.message}</span>
                          </div>
                      ))}
                  </div>
              </div>
          </div>
      </div>
    </div>
  );
};

export default TestBench;
