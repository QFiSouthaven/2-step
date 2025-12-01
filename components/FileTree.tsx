import React, { useState, useEffect } from 'react';
import { FileNode } from '../types';
import { ChevronRight, ChevronDown, Folder, FileText, Check } from 'lucide-react';

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

  const handleCheck = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggle(node.path, !node.checked);
  };

  return (
    <div className="select-none">
      <div 
        id={isActive ? "active-file-node" : undefined}
        className={`flex items-center gap-2 py-1 px-2 rounded cursor-pointer group border transition-all duration-200
          ${!node.checked ? 'opacity-50' : ''}
          ${isActive 
            ? 'bg-blue-600/20 border-blue-500/50 text-blue-100' 
            : 'border-transparent hover:bg-slate-800'
          }`}
        onClick={() => !node.isFile && setIsOpen(!isOpen)}
      >
        <button 
          onClick={handleCheck}
          className={`w-4 h-4 rounded border flex items-center justify-center transition-colors
            ${node.checked 
              ? 'bg-blue-600 border-blue-600 text-white' 
              : 'border-slate-600 hover:border-slate-400 bg-transparent'}`}
        >
          {node.checked && <Check size={10} strokeWidth={4} />}
        </button>

        <span className="text-slate-500 w-4 flex justify-center">
          {!node.isFile && (
            isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />
          )}
        </span>

        {node.isFile ? <FileText size={14} className={isActive ? "text-blue-300" : "text-slate-400"} /> : <Folder size={14} className="text-blue-400" />}
        
        <span className={`text-sm truncate ${node.checked ? (isActive ? 'text-blue-100' : 'text-slate-300') : 'text-slate-500 line-through'}`}>
          {node.name}
        </span>
      </div>

      {isOpen && node.children && (
        <div className="ml-6 border-l border-slate-800 pl-1">
          {node.children.map((child) => (
            <FileTreeNode key={child.path} node={child} onToggle={onToggle} activePath={activePath} />
          ))}
        </div>
      )}
    </div>
  );
};

const FileTree: React.FC<FileTreeProps> = ({ nodes, onToggle, activePath }) => {
  if (nodes.length === 0) return <div className="text-slate-500 text-sm p-4 italic">No files selected</div>;

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
    <div className="space-y-0.5 overflow-x-hidden">
      {nodes.map((node) => (
        <FileTreeNode key={node.path} node={node} onToggle={onToggle} activePath={activePath} />
      ))}
    </div>
  );
};

export default FileTree;