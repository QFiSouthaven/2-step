
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { SystemComponent, ComponentStatus, SafeModeLevel, SystemLog } from '../types';

interface SafeModeContextType {
  safeModeLevel: SafeModeLevel;
  setSafeModeLevel: (level: SafeModeLevel) => void;
  registry: Map<string, SystemComponent>;
  registerComponent: (component: Omit<SystemComponent, 'status' | 'metrics'>) => void;
  updateComponentStatus: (id: string, status: ComponentStatus, error?: string) => void;
  toggleComponent: (id: string, enabled: boolean) => void;
  logs: SystemLog[];
  addLog: (level: SystemLog['level'], componentId: string, message: string) => void;
  runDiagnostics: (id?: string) => Promise<void>;
  emergencyStop: () => void;
  restoreDefaults: () => void;
}

const SafeModeContext = createContext<SafeModeContextType | undefined>(undefined);

export const useSafeMode = () => {
  const context = useContext(SafeModeContext);
  if (!context) throw new Error('useSafeMode must be used within a SafeModeProvider');
  return context;
};

export const SafeModeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [safeModeLevel, setSafeModeLevel] = useState<SafeModeLevel>(SafeModeLevel.FULL);
  const [registry, setRegistry] = useState<Map<string, SystemComponent>>(new Map());
  const [logs, setLogs] = useState<SystemLog[]>([]);

  // Logger helper
  const addLog = useCallback((level: SystemLog['level'], componentId: string, message: string) => {
    const newLog: SystemLog = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
      level,
      componentId,
      message,
    };
    setLogs(prev => [newLog, ...prev].slice(0, 1000)); // Keep last 1000 logs
  }, []);

  // Register a component on mount
  const registerComponent = useCallback((comp: Omit<SystemComponent, 'status' | 'metrics'>) => {
    setRegistry(prev => {
      if (prev.has(comp.id)) return prev;
      const newMap = new Map(prev);
      newMap.set(comp.id, {
        ...comp,
        status: 'healthy',
        metrics: { renderTime: 0, memoryUsage: 0, errors: 0 }
      });
      return newMap;
    });
    addLog('INFO', comp.id, `Component registered in registry.`);
  }, [addLog]);

  // Update status (e.g. from error boundary)
  const updateComponentStatus = useCallback((id: string, status: ComponentStatus, error?: string) => {
    setRegistry(prev => {
      const comp = prev.get(id);
      if (!comp) return prev;
      
      const newMap = new Map(prev);
      newMap.set(id, {
        ...comp,
        status,
        lastError: error,
        metrics: {
            ...comp.metrics!,
            errors: status === 'failed' ? (comp.metrics?.errors || 0) + 1 : comp.metrics?.errors || 0
        }
      });
      return newMap;
    });
    
    if (status === 'failed') {
        addLog('ERROR', id, error || 'Component reported failure state.');
    } else {
        addLog('INFO', id, `Status changed to ${status}`);
    }
  }, [addLog]);

  // Manual toggle
  const toggleComponent = useCallback((id: string, enabled: boolean) => {
    updateComponentStatus(id, enabled ? 'healthy' : 'disabled');
    addLog('WARN', id, `Manually ${enabled ? 'enabled' : 'disabled'} by operator.`);
  }, [updateComponentStatus, addLog]);

  // Run "Simulated" Diagnostics
  const runDiagnostics = useCallback(async (id?: string) => {
    const targets = id ? [id] : Array.from(registry.keys());
    
    for (const targetId of targets) {
        const comp = registry.get(targetId);
        if(!comp) continue;

        updateComponentStatus(targetId, 'testing');
        addLog('INFO', targetId, 'Starting diagnostic suite...');

        // Simulate async test
        await new Promise(r => setTimeout(r, 800 + Math.random() * 1000));

        // Randomly fail items if in "chaos" mode (not implemented here) or just pass
        // Calculate mock metrics
        const mockRenderTime = Math.floor(Math.random() * 50) + 10;
        const mockMemory = Math.floor(Math.random() * 10) + 1;

        setRegistry(prev => {
            const c = prev.get(targetId);
            if (!c) return prev;
            const updated = new Map(prev);
            updated.set(targetId, {
                ...c,
                status: 'healthy',
                metrics: {
                    renderTime: mockRenderTime,
                    memoryUsage: mockMemory,
                    errors: c.metrics?.errors || 0
                }
            });
            return updated;
        });
        
        addLog('INFO', targetId, `Diagnostics passed. Render: ${mockRenderTime}ms, Mem: ${mockMemory}MB`);
    }
  }, [registry, updateComponentStatus, addLog]);

  const emergencyStop = useCallback(() => {
      setSafeModeLevel(SafeModeLevel.MINIMAL);
      setRegistry(prev => {
          const newMap = new Map();
          prev.forEach((comp, key) => {
             // Disable non-core components
             if (comp.category !== 'core') {
                 newMap.set(key, { ...comp, status: 'disabled' });
             } else {
                 newMap.set(key, comp);
             }
          });
          return newMap;
      });
      addLog('ERROR', 'SYSTEM', 'EMERGENCY STOP TRIGGERED. Dropping to Safe Mode Level 1.');
  }, [addLog]);

  const restoreDefaults = useCallback(() => {
      setSafeModeLevel(SafeModeLevel.FULL);
      setRegistry(prev => {
          const newMap = new Map();
          prev.forEach((comp, key) => {
             newMap.set(key, { ...comp, status: 'healthy', lastError: undefined });
          });
          return newMap;
      });
      addLog('INFO', 'SYSTEM', 'System restored to default configuration.');
  }, [addLog]);

  return (
    <SafeModeContext.Provider value={{
      safeModeLevel,
      setSafeModeLevel,
      registry,
      registerComponent,
      updateComponentStatus,
      toggleComponent,
      logs,
      addLog,
      runDiagnostics,
      emergencyStop,
      restoreDefaults
    }}>
      {children}
    </SafeModeContext.Provider>
  );
};
