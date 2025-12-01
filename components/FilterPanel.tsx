import React, { useState } from 'react';
import { Filter, Ban, RefreshCw, ChevronDown, ChevronUp, Plus, X, Trash2 } from 'lucide-react';

interface FilterPanelProps {
  onApplyFilters: (patterns: string) => void;
  onResetFilters: () => void;
}

const FilterPanel: React.FC<FilterPanelProps> = ({ onApplyFilters, onResetFilters }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [activePatterns, setActivePatterns] = useState<string[]>([]);

  const handleAddPattern = () => {
    const trimmed = inputValue.trim();
    if (!trimmed) return;
    
    if (!activePatterns.includes(trimmed)) {
      setActivePatterns([...activePatterns, trimmed]);
    }
    setInputValue('');
  };

  const handleRemovePattern = (pattern: string) => {
    setActivePatterns(activePatterns.filter(p => p !== pattern));
  };

  const handleApply = () => {
    onApplyFilters(activePatterns.join('\n'));
  };

  const handleReset = () => {
    setActivePatterns([]);
    setInputValue('');
    onResetFilters();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddPattern();
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-md">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 flex items-center justify-between bg-slate-950/50 hover:bg-slate-950 transition-colors"
      >
        <div className="flex items-center gap-2 text-sm font-medium text-slate-300">
          <Filter size={16} className="text-blue-400" />
          <span>Filters & Exclusions</span>
          {activePatterns.length > 0 && (
            <span className="bg-blue-600 text-white text-[10px] px-1.5 py-0.5 rounded-full ml-1">
              {activePatterns.length}
            </span>
          )}
        </div>
        {isOpen ? <ChevronUp size={16} className="text-slate-500" /> : <ChevronDown size={16} className="text-slate-500" />}
      </button>

      {isOpen && (
        <div className="p-4 space-y-4 border-t border-slate-800">
          
          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-400 block">
              Add Exclusion Pattern
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-300 focus:outline-none focus:border-blue-500/50 placeholder:text-slate-600"
                placeholder="e.g. *.test.ts or /regex/"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                spellCheck={false}
              />
              <button
                onClick={handleAddPattern}
                disabled={!inputValue.trim()}
                className="px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 hover:border-slate-600 disabled:opacity-50 transition-colors"
              >
                <Plus size={16} />
              </button>
            </div>
            <p className="text-[10px] text-slate-500">
              Use Glob patterns (<span className="font-mono text-slate-400">*.test.ts</span>, <span className="font-mono text-slate-400">dist/</span>) or Regex (<span className="font-mono text-slate-400">/^src\/.*\.spec\.ts$/</span>).
            </p>
          </div>

          {/* Active Tags */}
          {activePatterns.length > 0 && (
            <div className="flex flex-wrap gap-2 p-2 bg-slate-950 rounded-lg border border-slate-800 min-h-[40px]">
              {activePatterns.map((pattern, idx) => (
                <div key={idx} className="flex items-center gap-1 bg-slate-800 text-slate-200 text-xs px-2 py-1 rounded border border-slate-700 group">
                  <span className="font-mono">{pattern}</span>
                  <button 
                    onClick={() => handleRemovePattern(pattern)}
                    className="text-slate-500 hover:text-red-400 ml-1 transition-colors"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-2 pt-2 border-t border-slate-800/50">
            <button
              onClick={handleApply}
              className="flex-1 flex items-center justify-center gap-2 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 hover:text-blue-300 text-xs py-2 rounded transition-colors border border-blue-600/20 hover:border-blue-500/30"
            >
              <Ban size={14} />
              Apply {activePatterns.length} Exclusions
            </button>
            <button
              onClick={handleReset}
              className="px-3 bg-slate-800 hover:bg-red-900/20 text-slate-400 hover:text-red-400 text-xs py-2 rounded transition-colors border border-slate-700 hover:border-red-900/30"
              title="Clear Filters"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FilterPanel;