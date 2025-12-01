
import React, { useEffect, useState } from 'react';
import { useSafeMode } from '../contexts/SafeModeContext';
import { SafeModeLevel, ComponentStatus } from '../types';
import { AlertTriangle, Loader2, Ban, RefreshCw } from 'lucide-react';

interface SafeComponentProps {
  id: string;
  name: string;
  category: 'core' | 'ui' | 'data' | 'integration';
  minSafeModeLevel?: SafeModeLevel;
  dependencies?: string[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

const SafeComponent: React.FC<SafeComponentProps> = ({
  id,
  name,
  category,
  minSafeModeLevel = SafeModeLevel.FULL,
  dependencies = [],
  children,
  fallback
}) => {
  const { registerComponent, registry, updateComponentStatus, safeModeLevel, runDiagnostics } = useSafeMode();
  const [hasError, setHasError] = useState(false);

  // Register on mount
  useEffect(() => {
    registerComponent({
      id,
      name,
      category,
      minSafeModeLevel,
      dependencies
    });
  }, [id, name, category, minSafeModeLevel, dependencies, registerComponent]);

  const componentState = registry.get(id);

  // Error Boundary Simulation (in a real app, wrap in a Class component with getDerivedStateFromError)
  useEffect(() => {
      if (hasError) {
          updateComponentStatus(id, 'failed', 'Runtime Error detected in component boundary.');
      }
  }, [hasError, id, updateComponentStatus]);

  if (!componentState) return null; // Not registered yet

  // 1. Check Safe Mode Level
  if (safeModeLevel < minSafeModeLevel) {
    return (
      <div className="border border-slate-800 border-dashed rounded p-4 bg-slate-900/50 flex flex-col items-center justify-center text-slate-500 gap-2 h-full min-h-[100px]">
        <Ban size={24} />
        <span className="text-xs">Disabled by Safe Mode (Level {safeModeLevel})</span>
      </div>
    );
  }

  // 2. Check Explicit Status
  if (componentState.status === 'disabled') {
     return (
        <div className="border border-slate-800 bg-slate-950 rounded p-4 flex flex-col items-center justify-center h-full min-h-[100px] gap-2 opacity-50">
            <span className="text-xs text-slate-500 uppercase tracking-widest">{name} Disabled</span>
        </div>
     );
  }

  if (componentState.status === 'failed') {
      return (
        <div className="border border-red-900/50 bg-red-900/10 rounded p-4 flex flex-col items-center justify-center h-full gap-3">
             <div className="flex items-center gap-2 text-red-400 font-bold">
                 <AlertTriangle size={20} />
                 <span>Component Failure</span>
             </div>
             <p className="text-xs text-red-300/70 text-center max-w-xs">{componentState.lastError}</p>
             <button 
                onClick={() => {
                    setHasError(false);
                    updateComponentStatus(id, 'healthy');
                }}
                className="px-3 py-1 bg-red-900/30 hover:bg-red-900/50 text-red-200 text-xs rounded border border-red-800 transition-colors"
             >
                Attempt Recovery
             </button>
        </div>
      );
  }

  if (componentState.status === 'testing') {
      return (
          <div className="flex flex-col items-center justify-center h-full min-h-[150px] gap-3 bg-slate-900/80 animate-pulse border border-blue-500/30 rounded">
              <Loader2 size={24} className="animate-spin text-blue-400" />
              <span className="text-xs text-blue-300 font-mono">RUNNING DIAGNOSTICS...</span>
          </div>
      );
  }

  // 3. Render Content
  try {
      return <>{children}</>;
  } catch (e) {
      console.error(e);
      setHasError(true);
      return null;
  }
};

export default SafeComponent;
