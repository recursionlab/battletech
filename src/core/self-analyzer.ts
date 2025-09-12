/**
 * SelfAnalyzer Implementation
 * 
 * Gives the codebase a voice to understand its own structure
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { 
  SelfAnalyzer, 
  ArchitecturalGraph, 
  ArchitecturalNode, 
  ArchitecturalReport 
} from './meta-architecture';

export class CodebaseSelfAnalyzer implements SelfAnalyzer {
  private readonly rootPath: string;

  constructor(rootPath: string = process.cwd()) {
    this.rootPath = rootPath;
  }

  async scanArchitecture(): Promise<ArchitecturalGraph> {
    const nodes = new Map<string, ArchitecturalNode>();
    const edges = new Map<string, string[]>();
    
    // Scan TypeScript files
    const tsFiles = await this.findTypeScriptFiles();
    
    for (const filePath of tsFiles) {
      const node = await this.analyzeFile(filePath);
      nodes.set(node.id, node);
      
      // Extract dependencies from imports
      const dependencies = await this.extractDependencies(filePath);
      edges.set(node.id, dependencies);
    }

    // Detect circular dependencies
    const cyclicalDependencies = this.detectCycles(edges);
    
    // Calculate depth levels
    const depthLevels = this.calculateDepthLevels(edges);

    return {
      nodes,
      edges,
      cyclicalDependencies,
      depthLevels
    };
  }

  async detectAntiPatterns(): Promise<string[]> {
    const antiPatterns: string[] = [];
    const graph = await this.scanArchitecture();

    // Check for God classes (files with too many responsibilities)
    for (const [id, node] of graph.nodes) {
      if (node.complexity > 50) {
        antiPatterns.push(`God class detected: ${id} (complexity: ${node.complexity})`);
      }
    }

    // Check for circular dependencies
    if (graph.cyclicalDependencies.length > 0) {
      antiPatterns.push(`Circular dependencies found: ${graph.cyclicalDependencies.length} cycles`);
    }

    // Check for excessive coupling
    for (const [id, dependencies] of graph.edges) {
      if (dependencies.length > 10) {
        antiPatterns.push(`High coupling detected: ${id} depends on ${dependencies.length} modules`);
      }
    }

    return antiPatterns;
  }

  async measureComplexity(): Promise<number> {
    const graph = await this.scanArchitecture();
    let totalComplexity = 0;
    
    for (const node of graph.nodes.values()) {
      totalComplexity += node.complexity;
    }

    // Normalize by node count
    return graph.nodes.size > 0 ? totalComplexity / graph.nodes.size : 0;
  }

  async generateReport(): Promise<ArchitecturalReport> {
    const graph = await this.scanArchitecture();
    const antiPatterns = await this.detectAntiPatterns();
    const avgComplexity = await this.measureComplexity();

    const suggestions = this.generateSuggestions(graph, antiPatterns, avgComplexity);
    const riskAssessment = this.assessRisk(antiPatterns, avgComplexity);

    return {
      graph,
      antiPatterns,
      suggestions,
      riskAssessment,
      timestamp: new Date()
    };
  }

  private async findTypeScriptFiles(): Promise<string[]> {
    const files: string[] = [];
    
    const scanDir = async (dir: string): Promise<void> => {
      try {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          
          if (entry.isDirectory() && !this.shouldSkipDirectory(entry.name)) {
            await scanDir(fullPath);
          } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))) {
            files.push(fullPath);
          }
        }
      } catch (error) {
        // Skip directories we can't read
      }
    };

    await scanDir(path.join(this.rootPath, 'src'));
    return files;
  }

  private shouldSkipDirectory(name: string): boolean {
    return ['node_modules', '.git', 'dist', 'coverage', '.next'].includes(name);
  }

  private async analyzeFile(filePath: string): Promise<ArchitecturalNode> {
    const content = await fs.readFile(filePath, 'utf-8');
    const relativePath = path.relative(this.rootPath, filePath);
    const stats = await fs.stat(filePath);

    // Determine node type based on path
    const type = this.determineNodeType(relativePath);
    
    // Extract interfaces (exported classes, functions, types)
    const interfaces = this.extractInterfaces(content);
    
    // Calculate complexity (simple heuristic)
    const complexity = this.calculateFileComplexity(content);

    return {
      id: relativePath.replace(/\\/g, '/'),
      type,
      dependencies: [], // Will be filled by extractDependencies
      interfaces,
      complexity,
      lastModified: stats.mtime
    };
  }

  private determineNodeType(filePath: string): 'core' | 'module' | 'service' | 'util' {
    if (filePath.includes('/core/')) return 'core';
    if (filePath.includes('/modules/')) return 'module';
    if (filePath.includes('/services/')) return 'service';
    return 'util';
  }

  private extractInterfaces(content: string): string[] {
    const interfaces: string[] = [];
    
    // Match exported classes, interfaces, functions, types
    const exportRegex = /export\s+(?:class|interface|function|const|type)\s+(\w+)/g;
    let match;
    
    while ((match = exportRegex.exec(content)) !== null) {
      interfaces.push(match[1]);
    }

    return interfaces;
  }

  private calculateFileComplexity(content: string): number {
    // Simple complexity heuristic
    const lines = content.split('\n').length;
    const functions = (content.match(/function|=>/g) || []).length;
    const conditionals = (content.match(/if|switch|while|for/g) || []).length;
    const classes = (content.match(/class\s+\w+/g) || []).length;
    
    return Math.round(lines * 0.1 + functions * 2 + conditionals * 1.5 + classes * 3);
  }

  private async extractDependencies(filePath: string): Promise<string[]> {
    const content = await fs.readFile(filePath, 'utf-8');
    const dependencies: string[] = [];
    
    // Match relative imports
    const importRegex = /import.*from\s+['"`](\.[^'"`]+)['"`]/g;
    let match;
    
    while ((match = importRegex.exec(content)) !== null) {
      const relativeDep = match[1];
      const resolvedPath = this.resolveImportPath(filePath, relativeDep);
      if (resolvedPath) {
        dependencies.push(resolvedPath);
      }
    }

    return dependencies;
  }

  private resolveImportPath(fromFile: string, importPath: string): string | null {
    try {
      const fromDir = path.dirname(fromFile);
      const resolved = path.resolve(fromDir, importPath);
      return path.relative(this.rootPath, resolved).replace(/\\/g, '/');
    } catch {
      return null;
    }
  }

  private detectCycles(edges: Map<string, string[]>): string[][] {
    const visited = new Set<string>();
    const recStack = new Set<string>();
    const cycles: string[][] = [];

    const dfs = (node: string, path: string[]): void => {
      visited.add(node);
      recStack.add(node);
      path.push(node);

      const dependencies = edges.get(node) || [];
      for (const dep of dependencies) {
        if (!visited.has(dep)) {
          dfs(dep, [...path]);
        } else if (recStack.has(dep)) {
          const cycleStart = path.indexOf(dep);
          if (cycleStart !== -1) {
            cycles.push(path.slice(cycleStart));
          }
        }
      }

      recStack.delete(node);
    };

    for (const node of edges.keys()) {
      if (!visited.has(node)) {
        dfs(node, []);
      }
    }

    return cycles;
  }

  private calculateDepthLevels(edges: Map<string, string[]>): Map<string, number> {
    const depths = new Map<string, number>();
    const visited = new Set<string>();

    const calculateDepth = (node: string): number => {
      if (depths.has(node)) return depths.get(node)!;
      if (visited.has(node)) return 0; // Cycle protection

      visited.add(node);
      const dependencies = edges.get(node) || [];
      
      const maxDepth = dependencies.length === 0 ? 0 : 
        Math.max(...dependencies.map(dep => calculateDepth(dep) + 1));
      
      depths.set(node, maxDepth);
      visited.delete(node);
      return maxDepth;
    };

    for (const node of edges.keys()) {
      calculateDepth(node);
    }

    return depths;
  }

  private generateSuggestions(graph: ArchitecturalGraph, antiPatterns: string[], avgComplexity: number): string[] {
    const suggestions: string[] = [];

    if (avgComplexity > 30) {
      suggestions.push("Consider breaking down complex files into smaller modules");
    }

    if (graph.cyclicalDependencies.length > 0) {
      suggestions.push("Resolve circular dependencies using dependency inversion");
    }

    if (graph.nodes.size < 5) {
      suggestions.push("Codebase is small - consider organic growth over premature abstraction");
    }

    const coreNodes = Array.from(graph.nodes.values()).filter(n => n.type === 'core');
    if (coreNodes.length === 0) {
      suggestions.push("Consider establishing core domain logic separate from infrastructure");
    }

    return suggestions;
  }

  private assessRisk(antiPatterns: string[], avgComplexity: number): 'low' | 'medium' | 'high' {
    if (antiPatterns.length > 5 || avgComplexity > 50) return 'high';
    if (antiPatterns.length > 2 || avgComplexity > 25) return 'medium';
    return 'low';
  }
}