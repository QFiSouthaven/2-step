import React, { useState, useEffect } from 'react';
import { FileNode } from '../types';
import { ChevronRight, ChevronDown, Folder, FileText, Check, Sparkles } from 'lucide-react';

interface FileTreeProps {
  nodes: FileNode[];
  onToggle: (path: string, checked: boolean) => void;
  activePath?: string;
}

const FileTreeNode: React.FC<{ node: FileNode; onToggle: (path: string, checked: boolean) => void; activePath?: string }> = ({ node, onToggle, activePath }) => {
  const [isOpen, setIsOpen] = useState(true);

  // Auto-expand if a child is likely to be the active one (simple path containment check)
  useEffect(() => {
    if (activePath && activePath.startsWith(node.path + '/')) {
      setIsOpen(true);
    }
  }, [activePath, node.path]);

  const isActive = activePath === node.path;
  const isNew = node.isNew;
  const isChecked = node.checked !== false; // Handle optional undefined as true

  const handleCheck = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggle(node.path, !isChecked);
  };

  // Determine Styles based on state
  let containerClasses = "border-transparent hover:bg-slate-800";
  let textClasses = "text-slate-300";
  let iconColorClass = "text-slate-400";
  let folderColorClass = "text-blue-400";

  if (!isChecked) {
      containerClasses = "opacity-50 border-transparent hover:bg-slate-800/50";
      textClasses = "text-slate-500 line-through";
      iconColorClass = "text-slate-600";
      folderColorClass = "text-slate-600";
  } else if (isActive) {
      containerClasses = "bg-blue-600/20 border-blue-500/50 shadow-sm shadow-blue-900/20";
      textClasses = "text-blue-100 font-medium";
      iconColorClass = "text-blue-300";
      folderColorClass = "text-blue-300";
  } else if (isNew) {
      containerClasses = "bg-emerald-900/10 border-emerald-500/20 hover:bg-emerald-900/20";
      textClasses = "text-emerald-400";
      iconColorClass = "text-emerald-500";
      folderColorClass = "text-emerald-500";
  }

  return (
    <div className="select-none">
      <div 
        id={isActive ? "active-file-node" : undefined}
        className={`flex items-center gap-2 py-1.5 px-2 rounded-md cursor-pointer group border transition-all duration-200 mb-0.5 ${containerClasses}`}
        onClick={() => !node.isFile && setIsOpen(!isOpen)}
      >
        <button 
          onClick={handleCheck}
          className={`w-4 h-4 min-w-[1rem] rounded border flex items-center justify-center transition-colors
            ${isChecked 
              ? (isNew && !isActive ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-blue-600 border-blue-600 text-white') 
              : 'border-slate-600 hover:border-slate-400 bg-transparent'}`}
        >
          {isChecked && <Check size={10} strokeWidth={4} />}
        </button>

        <span className="text-slate-500 w-4 flex justify-center shrink-0">
          {!node.isFile && (
            isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />
          )}
        </span>

        {node.isFile ? (
            <FileText size={14} className={`shrink-0 ${iconColorClass}`} />
        ) : (
            <Folder size={14} className={`shrink-0 ${folderColorClass}`} />
        )}
        
        <span className={`text-sm truncate flex-1 ${textClasses}`}>
          {node.name}
        </span>

        {/* New Badge */}
        {isNew && isChecked && (
            <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider shrink-0
                ${isActive ? 'bg-blue-500 text-white' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'}`}>
                New
            </span>
        )}
      </div>

      {isOpen && node.children && (
        <div className="ml-6 border-l border-slate-800/50 pl-1">
          {node.children.map((child) => (
            <FileTreeNode key={child.path} node={child} onToggle={onToggle} activePath={activePath} />
          ))}
        </div>
      )}
    </div>
  );
};

const FileTree: React.FC<FileTreeProps> = ({ nodes, onToggle, activePath }) => {
  if (nodes.length === 0) return <div className="text-slate-500 text-sm p-4 italic text-center">No files selected</div>;

  // Scroll active node into view when it changes
  useEffect(() => {
      if (activePath) {
          const el = document.getElementById("active-file-node");
          if (el) {
              el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
      }
  }, [activePath]);

  return (
    <div className="space-y-0.5 overflow-x-hidden pr-2">
      {nodes.map((node) => (
        <FileTreeNode key={node.path} node={node} onToggle={onToggle} activePath={activePath} />
      ))}
    </div>
  );
};

export default FileTree;