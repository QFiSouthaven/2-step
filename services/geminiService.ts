
import { GoogleGenAI } from "@google/genai";
import { SummaryFocus, AgentTask, AgentRole, SimulationResult, ProjectAnalysis, RefactoringPlan, ModularizationStrategyType } from "../types";

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper to handle API calls with retry logic for 429 (Rate Limit) errors
const callWithRetry = async <T>(fn: () => Promise<T>, retries = 5, initialDelay = 2000): Promise<T | null> => {
    let attempt = 0;
    while (attempt < retries) {
        try {
            return await fn();
        } catch (error: any) {
            // Check for 429 (Resource Exhausted) or 503 (Service Unavailable)
            const isRateLimit = error.status === 429 || error.code === 429 || 
                                (error.message && error.message.includes('429'));
            const isServerOverload = error.status === 503 || error.code === 503;

            if (isRateLimit || isServerOverload) {
                attempt++;
                const delay = initialDelay * Math.pow(2, attempt - 1); // Exponential backoff: 2s, 4s, 8s...
                console.warn(`API Rate limit hit. Retrying in ${delay}ms... (Attempt ${attempt}/${retries})`);
                await sleep(delay);
                continue;
            }
            
            // For other errors, throw immediately
            throw error;
        }
    }
    throw new Error("Max retries exceeded");
};

export const analyzeCodebase = async (context: string, promptType: 'summary' | 'audit' | 'readme' | 'architecture' | 'manifest' | 'redundancy' | 'consistency' | 'test_plan') => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    // Select model based on task complexity
    let modelName = 'gemini-2.5-flash';
    if (['audit', 'architecture', 'redundancy', 'consistency', 'test_plan'].includes(promptType)) {
        modelName = 'gemini-3-pro-preview';
    }

    let prompt = "";
    if (promptType === 'summary') {
        prompt = "Provide a high-level architectural summary of this codebase. Identify key technologies, patterns, and the main purpose of the application.";
    } else if (promptType === 'audit') {
        prompt = `
        Perform a Deep Technical Audit as a Principal Security Researcher.
        
        Analyze the codebase for:
        1. 🛡️ **Security & Integrity**: OWASP vulnerabilities, secret leaks, unsafe data handling, hallucinated dependencies.
        2. ⚡ **Performance & Scalability**: Render cycles, memory leaks, algorithmic inefficiencies.
        3. 🏗️ **Architecture & Quality**: Pattern violations, tight coupling, code bloat/over-engineering.
        4. 🧹 **Modernization**: Deprecated features, legacy patterns.

        Output a strict Markdown report:
        - Use emojis for severity (🔴 Critical, 🟠 High, 🟡 Medium).
        - Limit to the top 3 most impactful findings.
        - For each finding, provide: **Title**, **Severity**, **Description**, and **Actionable Recommendation**.
        `;
    } else if (promptType === 'readme') {
        prompt = "Generate a professional README.md file for this project based on the code.";
    } else if (promptType === 'architecture') {
        prompt = `
        Analyze this codebase to provide a comprehensive architectural overview. 
        Focus on:
        1. High-Level Design: Identify the architectural style (Monolithic, Microservices, Event-driven, etc.).
        2. Component Analysis: Break down the system into core modules and explain their responsibilities.
        3. Data Flow: Trace how data moves through the application, including API interactions and state management.
        4. Infrastructure & Configuration: Analyze how the application is configured and deployed (Docker, env vars, etc.).
        5. Platform Capabilities: If this is a framework or no-code platform, analyze its extensibility, component registry, and execution engine.
        
        Produce a structured Markdown report.
        `;
    } else if (promptType === 'manifest') {
        prompt = `
        Create a structural Project Manifest for the provided codebase.
        This manifest should act as a map for an LLM to understand the project without reading every line of code.
        
        Include the following sections in Markdown:
        1. **Project Overview**: A 1-2 sentence description of what the project does.
        2. **Directory Structure**: A tree-like or grouped list of significant folders.
        3. **Key Modules**: List the most important files (entry points, core logic, configs) and a 1-sentence description of their responsibility.
        4. **Build & Run Commands**: Infer how to build, test, and run the project (e.g., npm scripts, makefiles).
        5. **Known Issues / Context**: Briefly note any missing configuration files or potential setup requirements visible in the code.
        `;
    } else if (promptType === 'redundancy') {
        prompt = `
        Analyze the provided codebase to identify redundancy, inefficiency, and technical debt.
        
        Generate a list of actionable items. Look for:
        1. **Duplicate Logic**: Identical or highly similar functions/components repeated across files.
        2. **Redundant Files**: Files that serve no clear purpose or are effectively duplicates of others.
        3. **Dead Code**: Unused variables, imports, or file artifacts that should be removed.
        4. **Legacy Patterns**: Instances where deprecated patterns are mixed with modern ones (e.g., mixing React Class components with Hooks unnecessarily).

        Format the output as a Markdown checklist titled "Redundancy & Cleanup Report".
        `;
    } else if (promptType === 'consistency') {
        prompt = `
        Perform a Consistency Check on the codebase.
        Look for "Drift" in:
        1. **Patterns**: e.g., Mixed usage of Fetch vs Axios, Redux vs Context, Promises vs Async/Await.
        2. **Naming Conventions**: Inconsistent variable naming (snake_case vs camelCase).
        3. **UI/UX**: Logic leaking into UI components vs separated services.
        
        Report the top 3 inconsistencies that could lead to technical debt.
        `;
    } else if (promptType === 'test_plan') {
        prompt = `
        Generate a robust **Test Strategy Plan** for this project.
        1. Identify the 3 most critical business logic flows that require testing.
        2. Generate skeleton code for a Unit Test (e.g., Jest/Vitest) for the most complex logic found.
        3. Suggest 3 Edge Cases that AI-generated code might have missed.
        `;
    }

    try {
        const result = await callWithRetry(async () => {
            const response = await ai.models.generateContent({
                model: modelName,
                contents: `Here is a codebase export:\n\n${context.substring(0, 100000)}\n\n---\n\nTask: ${prompt}`,
                config: {
                    systemInstruction: "You are a world-class senior software engineer and systems architect. You are analyzing a codebase provided in a flat text format.",
                    temperature: 0.2,
                    thinkingConfig: modelName === 'gemini-3-pro-preview' ? { thinkingBudget: 4096 } : undefined
                }
            });
            return response.text;
        });

        return result;
    } catch (error) {
        console.error("Gemini Analysis Error:", error);
        throw error;
    }
};

export const summarizeCode = async (fileName: string, content: string, focus: SummaryFocus = 'general'): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    let systemInstruction = "You are a helpful coding assistant. Provide a single-sentence summary of the architectural role and functionality of the provided code file.";
    
    switch (focus) {
        case 'security':
            systemInstruction = "You are a security expert. Provide a single-sentence summary focusing on security mechanisms, authentication, potential vulnerabilities, or sensitive data handling in this file. If none, state its basic purpose.";
            break;
        case 'performance':
            systemInstruction = "You are a performance optimization expert. Provide a single-sentence summary focusing on computational complexity, resource usage, efficiency, or potential bottlenecks in this file. If none, state its basic purpose.";
            break;
        case 'core':
            systemInstruction = "You are a systems architect. Provide a single-sentence summary focusing exclusively on the core business logic, algorithms, or essential data structures implemented in this file, ignoring boilerplate.";
            break;
        case 'general':
        default:
            systemInstruction = "You are a helpful coding assistant. Provide a single-sentence summary of the architectural role and functionality of the provided code file.";
            break;
    }

    try {
        const result = await callWithRetry(async () => {
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: `File Name: ${fileName}\n\nCode Content:\n${content.slice(0, 30000)}`,
                config: {
                    systemInstruction: `${systemInstruction} Start with 'This file...'. Do not include markdown formatting or extra text.`,
                    temperature: 0.1,
                    maxOutputTokens: 100,
                }
            });
            return response.text;
        });

        return result || "";
    } catch (error) {
        console.error(`Error summarizing ${fileName}:`, error);
        return "";
    }
};

// --- Agent Colosseum Services ---

export const decomposeProject = async (context: string): Promise<Partial<AgentTask>[]> => {
     const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
     
     const prompt = `
     You are the "Architect Agent" of the Agent Colosseum.
     Analyze this codebase and decompose the work needed to "Rejuvenate" or "Complete" it into a list of specific, actionable tasks.
     
     Focus on:
     1. Missing components or files.
     2. Incomplete logic (TODOs).
     3. Architectural improvements.
     
     Return ONLY a JSON array of task objects. No markdown formatting.
     Format: [{ "title": string, "description": string, "type": "feature"|"bug"|"refactor", "priority": "high"|"medium"|"low", "role": "developer"|"qa"|"security" }]
     `;

     try {
        const result = await callWithRetry(async () => {
            const response = await ai.models.generateContent({
                model: 'gemini-3-pro-preview',
                contents: `Codebase Context:\n${context.substring(0, 50000)}\n\n${prompt}`,
                config: {
                    responseMimeType: 'application/json',
                    temperature: 0.3,
                }
            });
            return response.text;
        });
        
        if (!result) return [];
        return JSON.parse(result);
     } catch (e) {
         console.error("Decomposition Failed", e);
         return [];
     }
};

export const executeAgentTask = async (agentRole: AgentRole, task: AgentTask, context: string): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const systemPrompt = `You are a specialized AI Agent with the role: ${agentRole.toUpperCase()}. 
    Your goal is to execute the assigned task with high precision.
    Use the provided codebase context to generate the solution.
    Return the result (Code, Report, or Analysis) in Markdown.
    `;

    try {
        const result = await callWithRetry(async () => {
            const response = await ai.models.generateContent({
                model: 'gemini-3-pro-preview',
                contents: `Codebase Context:\n${context.substring(0, 30000)}\n\nTask Title: ${task.title}\nTask Description: ${task.description}`,
                config: {
                    systemInstruction: systemPrompt,
                    temperature: 0.4,
                    thinkingConfig: { thinkingBudget: 2048 }
                }
            });
            return response.text;
        });
        return result || "Task completed with no output.";
    } catch (e) {
        console.error(`Agent Execution Failed (${agentRole})`, e);
        throw e;
    }
};

// --- Runtime Simulation Service ---

export const simulateRuntime = async (context: string, command: string, platform: string): Promise<SimulationResult | null> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const prompt = `
    ACT AS A VIRTUAL RUNTIME ENVIRONMENT.
    Context: A software project codebase.
    Platform: ${platform}
    Command Executed: "${command}"

    Your Goal: Simulate the execution of this project startup sequence.
    1. Analyze the 'package.json', 'requirements.txt', 'Dockerfile', or entry points in the code.
    2. SIMULATE the console output logs that would appear in a terminal.
    3. If there are likely errors (missing dependencies, syntax errors in key files, missing env vars), SHOW THEM IN THE LOGS.
    4. If it would likely start successfully, show the startup logs (e.g. "Server listening on port 3000").
    
    Also, generate a structured Health Report JSON object.

    OUTPUT FORMAT:
    Return a JSON object with this EXACT structure:
    {
      "logs": "string containing the multi-line terminal output",
      "health": {
         "status": "healthy" | "warning" | "critical",
         "issues": [ { "severity": "critical"|"warning", "message": "string", "recommendation": "string" } ],
         "metrics": {
            "startupTime": "string (e.g. 2.4s)",
            "memoryEstimate": "string (e.g. 45MB)",
            "compatibilityScore": number (0-100)
         }
      }
    }
    `;

    try {
        const result = await callWithRetry(async () => {
            const response = await ai.models.generateContent({
                model: 'gemini-3-pro-preview',
                contents: `Codebase Context:\n${context.substring(0, 60000)}\n\n${prompt}`,
                config: {
                    responseMimeType: 'application/json',
                    temperature: 0.2, // Low temp for realistic simulation
                    thinkingConfig: { thinkingBudget: 4096 } // Give it thought to trace dependencies
                }
            });
            return response.text;
        });
        
        if (!result) return null;
        return JSON.parse(result);
    } catch (e) {
        console.error("Simulation Failed", e);
        return null;
    }
};

// --- Compose to Modular Services ---

export const analyzeProjectStructure = async (context: string): Promise<ProjectAnalysis | null> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const prompt = `
    ACT AS A SENIOR SYSTEM ARCHITECT.
    Goal: Analyze this monolithic codebase to prepare it for refactoring into a modular architecture.
    
    Tasks:
    1. Calculate metrics (LOC, file count, estimated complexity 1-10, maintainability score A-F).
    2. Detect logical "Seams" where the code can be split. Look for Functional boundaries, Data flow, and Namespace clustering.
    3. Identify suggested Modules based on these seams.

    Return JSON with this structure:
    {
      "metrics": { "loc": number, "fileCount": number, "complexity": number, "maintainability": "string" },
      "seams": [ { "id": "string", "name": "string", "type": "functional"|"dependency", "confidence": number, "rationale": "string", "files": ["string"] } ],
      "detectedModules": [ { "name": "string", "description": "string", "files": ["string"], "dependencies": ["string"] } ]
    }
    `;

    try {
        const result = await callWithRetry(async () => {
            const response = await ai.models.generateContent({
                model: 'gemini-3-pro-preview',
                contents: `Codebase Context:\n${context.substring(0, 60000)}\n\n${prompt}`,
                config: {
                    responseMimeType: 'application/json',
                    temperature: 0.3,
                    thinkingConfig: { thinkingBudget: 4096 }
                }
            });
            return response.text;
        });
        
        if (!result) return null;
        return JSON.parse(result);
    } catch (e) {
        console.error("Project Analysis Failed", e);
        return null;
    }
};

export const generateModularArchitecture = async (context: string, analysis: ProjectAnalysis, strategy: ModularizationStrategyType): Promise<RefactoringPlan | null> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const prompt = `
    ACT AS A CODE REFACTORING EXPERT.
    Strategy: ${strategy.toUpperCase()}
    
    Goal: Generate a concrete plan to restructure this project into modules.
    
    Strategies Guide:
    - CONSERVATIVE: Minimize changes, only split clear boundaries.
    - BALANCED: Create logical modules, add basic documentation.
    - AGGRESSIVE: Full re-architecture, Domain Driven Design, separate folders for everything.

    Return JSON:
    {
      "strategy": "${strategy}",
      "modules": [ { "name": "string", "description": "string", "files": ["string"], "dependencies": ["string"] } ],
      "newStructure": [ { "path": "string", "type": "file"|"dir" } ],
      "docs": "Markdown explanation of the changes and migration guide."
    }
    `;

    try {
         const result = await callWithRetry(async () => {
            const response = await ai.models.generateContent({
                model: 'gemini-3-pro-preview',
                contents: `Codebase Context:\n${context.substring(0, 60000)}\n\nAnalysis Data:\n${JSON.stringify(analysis)}\n\n${prompt}`,
                config: {
                    responseMimeType: 'application/json',
                    temperature: 0.4,
                    thinkingConfig: { thinkingBudget: 4096 }
                }
            });
            return response.text;
        });
        
        if (!result) return null;
        return JSON.parse(result);
    } catch (e) {
        console.error("Modular Generation Failed", e);
        return null;
    }
};
