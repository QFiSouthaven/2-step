import { ProcessedFile, FileNode } from '../types';

// Common ignore patterns
const IGNORED_DIRS = new Set([
  'node_modules', '.git', '.vscode', '.idea', 'dist', 'build', 'out', 'target', 
  '.next', '.nuxt', 'coverage', 'venv', '__pycache__', '.DS_Store'
]);

const IGNORED_EXTENSIONS = new Set([
  // Images
  '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.webp', '.bmp', '.tiff',
  // Audio/Video
  '.mp3', '.mp4', '.wav', '.avi', '.mov', '.flv',
  // Archives/Executables
  '.zip', '.tar', '.gz', '.rar', '.7z', '.exe', '.dll', '.so', '.dylib', '.bin',
  // Documents
  '.pdf', '.doc', '.docx', '.ppt', '.pptx', '.xls', '.xlsx',
  // Lock files (optional, but usually noise for LLMs)
  '.lock', 'package-lock.json', 'yarn.lock', 'pnpm-lock.yaml'
]);

const MAX_FILE_SIZE = 1024 * 1024; // 1MB limit for text files to avoid freezing

export const isIgnored = (path: string): boolean => {
  const parts = path.split('/');
  
  // Check directories
  for (const part of parts) {
    if (IGNORED_DIRS.has(part)) return true;
  }

  // Check extension
  const filename = parts[parts.length - 1];
  if (filename.startsWith('.')) {
     // Ignore hidden files like .DS_Store, .env (optional, but safe to keep .env usually users want it, so let's check explicit ignore list)
     if (filename === '.DS_Store') return true;
  }
  
  const dotIndex = filename.lastIndexOf('.');
  if (dotIndex !== -1) {
    const ext = filename.substring(dotIndex).toLowerCase();
    if (IGNORED_EXTENSIONS.has(ext)) return true;
  }

  return false;
};

// Converts a user input glob string (e.g. "*.test.ts", "src/temp/") OR Regex (e.g. "/^src\/.*test/") into a RegExp
export const createPatternMatcher = (pattern: string): RegExp => {
    // Check for explicit regex syntax /pattern/flags
    const regexMatch = pattern.match(/^\/(.+)\/([a-z]*)$/);
    if (regexMatch) {
        try {
            return new RegExp(regexMatch[1], regexMatch[2] || 'i');
        } catch (e) {
            console.warn("Invalid regex:", pattern);
            // Fallback to a partial string match if regex fails
            return new RegExp(pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&'), 'i');
        }
    }

    // Escape special regex characters except * and ?
    let regexStr = pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&');
    
    // Handle wildcards
    // * becomes .* (any character sequence)
    regexStr = regexStr.replace(/\*/g, '.*');
    // ? becomes . (single character)
    regexStr = regexStr.replace(/\?/g, '.');

    // If it ends with slash, match directory prefix
    if (pattern.endsWith('/')) {
        // "src/temp/" -> match "src/temp/..." anywhere in path
        return new RegExp(regexStr, 'i');
    }
    
    // Default to partial match but anchoring to word boundaries or path segments is tricky with simple globs.
    // We'll use a loose containment match which is usually what users expect for "test" (matches "test/file.ts" and "file.test.ts")
    // But to be safer, if it looks like an extension (starts with .), anchor to end.
    if (pattern.startsWith('.')) {
        return new RegExp(`${regexStr}$`, 'i');
    }

    return new RegExp(regexStr, 'i');
};

export const readFileContent = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (file.size > MAX_FILE_SIZE) {
      resolve(`[File too large: ${file.size} bytes. Skipped content.]`);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result;
      if (typeof result === 'string') {
        // Basic check for binary content (null bytes)
        if (result.includes('\0')) {
             resolve('[Binary file detected]');
        } else {
            resolve(result);
        }
      } else {
        resolve('[Binary file detected]');
      }
    };
    reader.onerror = () => reject(new Error(`Failed to read ${file.name}`));
    reader.readAsText(file);
  });
};

export const buildFileTree = (files: ProcessedFile[]): FileNode[] => {
  const root: FileNode[] = [];
  
  files.forEach(file => {
    const parts = file.path.split('/');
    let currentLevel = root;
    
    parts.forEach((part, index) => {
      const isFile = index === parts.length - 1;
      const path = parts.slice(0, index + 1).join('/');
      
      let existingNode = currentLevel.find(node => node.path === path);
      
      if (!existingNode) {
        existingNode = {
          name: part,
          path,
          isFile,
          checked: true,
          children: isFile ? undefined : []
        };
        currentLevel.push(existingNode);
      }
      
      if (!isFile && existingNode.children) {
        currentLevel = existingNode.children;
      }
    });
  });

  return root;
};

const getCommentWrapper = (fileName: string): [string, string] => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    
    switch (ext) {
        case 'html':
        case 'xml':
        case 'svg':
        case 'vue': // Vue often uses HTML-like comments in template
            return ['<!--', '-->'];
        case 'css':
        case 'scss':
        case 'less':
            return ['/*', '*/'];
        case 'py':
        case 'rb':
        case 'sh':
        case 'yaml':
        case 'yml':
        case 'dockerfile':
            return ['#', ''];
        case 'js':
        case 'jsx':
        case 'ts':
        case 'tsx':
        case 'java':
        case 'c':
        case 'cpp':
        case 'cs':
        case 'go':
        case 'rs':
        case 'swift':
        case 'php':
            return ['//', ''];
        case 'sql':
            return ['--', ''];
        default:
            return ['#', '']; // Default fallback
    }
};

export const estimateTokens = (text: string): number => {
  // Rough approximation: 1 token ~= 4 chars for English code
  return Math.ceil(text.length / 4);
};

export interface OutputOptions {
    includeSummaries?: boolean;
}

export const generateLLMOutput = (files: ProcessedFile[], options: OutputOptions = { includeSummaries: true }): string => {
  return files
    .filter(f => f.selected)
    .map(f => {
      let content = f.content;
      
      if (f.summary && options.includeSummaries) {
          const [prefix, suffix] = getCommentWrapper(f.name);
          // Ensure space between comment syntax and text
          const start = prefix ? `${prefix} SUMMARY: ` : 'SUMMARY: ';
          const end = suffix ? ` ${suffix}` : '';
          content = `${start}${f.summary.trim()}${end}\n${content}`;
      }

      return `\n\n--- FILE START: ${f.path} ---\n${content}\n--- FILE END: ${f.path} ---`;
    })
    .join('');
};

/**
 * Intelligent Chunking Strategy:
 * 1. Groups files by directory.
 * 2. Prioritizes Root directory files (e.g. README, package.json) to appear first for context.
 * 3. Sorts directories naturally to ensure tree-traversal order (coherence).
 * 4. Atomic packing: tries to fit whole directory groups.
 * 5. Overflow handling: splits directories if needed.
 */
export const generateChunks = (files: ProcessedFile[], tokenLimit: number, options: OutputOptions = { includeSummaries: true }): string[] => {
    const chunks: string[] = [];
    
    // Helper to format a file string
    const formatFile = (f: ProcessedFile) => {
        let content = f.content;
        if (f.summary && options.includeSummaries) {
             const [prefix, suffix] = getCommentWrapper(f.name);
             const start = prefix ? `${prefix} SUMMARY: ` : 'SUMMARY: ';
             const end = suffix ? ` ${suffix}` : '';
             content = `${start}${f.summary.trim()}${end}\n${content}`;
        }
        return `\n\n--- FILE START: ${f.path} ---\n${content}\n--- FILE END: ${f.path} ---`;
    };

    const selectedFiles = files.filter(f => f.selected);
    if (selectedFiles.length === 0) return [];

    // Group by Directory
    // Map<DirectoryPath, ProcessedFile[]>
    const dirGroups = new Map<string, ProcessedFile[]>();
    
    selectedFiles.forEach(f => {
        const lastSlash = f.path.lastIndexOf('/');
        const dir = lastSlash === -1 ? '.' : f.path.substring(0, lastSlash);
        if (!dirGroups.has(dir)) {
            dirGroups.set(dir, []);
        }
        dirGroups.get(dir)!.push(f);
    });

    // Sort directories.
    // We want '.' (root) to come first.
    // Then alphabetical case-insensitive sort for the rest.
    const sortedDirs = Array.from(dirGroups.keys()).sort((a, b) => {
        if (a === '.') return -1;
        if (b === '.') return 1;
        return a.toLowerCase().localeCompare(b.toLowerCase());
    });

    let currentChunk = "";
    let currentTokens = 0;

    // Iterate through sorted directories
    for (const dir of sortedDirs) {
        const groupFiles = dirGroups.get(dir)!;
        if (groupFiles.length === 0) continue;
        
        // Calculate total size of this group
        const groupStrings = groupFiles.map(formatFile);
        const groupTotalTokens = groupStrings.reduce((acc, str) => acc + estimateTokens(str), 0);
        
        // Scenario 1: Whole directory fits in remaining space of current chunk
        if (currentTokens + groupTotalTokens <= tokenLimit) {
            currentChunk += groupStrings.join('');
            currentTokens += groupTotalTokens;
            continue;
        }

        // Scenario 2: Directory is bigger than remaining space.
        // If current chunk has meaningful data, close it and start fresh.
        if (currentChunk.length > 0) {
            chunks.push(currentChunk);
            currentChunk = "";
            currentTokens = 0;
        }

        // Scenario 3: Check if whole directory fits in a FRESH chunk
        if (groupTotalTokens <= tokenLimit) {
             currentChunk += groupStrings.join('');
             currentTokens += groupTotalTokens;
             continue;
        }

        // Scenario 4: Directory is huge. Even a fresh chunk can't hold it all.
        // We must split the directory file by file.
        for (const fileStr of groupStrings) {
            const fileTokens = estimateTokens(fileStr);

            if (currentTokens + fileTokens > tokenLimit) {
                // If current chunk has content, push it
                if (currentChunk.length > 0) {
                    chunks.push(currentChunk);
                    currentChunk = "";
                    currentTokens = 0;
                }
            }
            
            currentChunk += fileStr;
            currentTokens += fileTokens;
        }
    }

    if (currentChunk.length > 0) {
        chunks.push(currentChunk);
    }

    return chunks;
};