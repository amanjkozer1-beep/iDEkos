/**
 * Task Dependency Graph (DAG) for K.O.S Autonomous Agent
 * Supports task prerequisite dependencies, cycle detection, and topological execution order.
 */

export interface GraphNode<T> {
  id: string;
  data: T;
  dependencies: string[]; // Task IDs that must finish BEFORE this node
  dependents: string[];   // Task IDs that wait for this node
  status: 'pending' | 'running' | 'completed' | 'failed';
}

export class TaskDependencyGraph<T = any> {
  private nodes: Map<string, GraphNode<T>> = new Map();

  public addTask(id: string, data: T, dependencies: string[] = []): void {
    const node: GraphNode<T> = {
      id,
      data,
      dependencies: [...dependencies],
      dependents: [],
      status: 'pending',
    };

    this.nodes.set(id, node);

    // Register this node as dependent on its prerequisites
    for (const depId of dependencies) {
      const depNode = this.nodes.get(depId);
      if (depNode) {
        if (!depNode.dependents.includes(id)) {
          depNode.dependents.push(id);
        }
      }
    }
  }

  public getTask(id: string): GraphNode<T> | undefined {
    return this.nodes.get(id);
  }

  public getAllTasks(): GraphNode<T>[] {
    return Array.from(this.nodes.values());
  }

  public markStatus(id: string, status: 'pending' | 'running' | 'completed' | 'failed'): void {
    const node = this.nodes.get(id);
    if (node) {
      node.status = status;
    }
  }

  /**
   * Returns tasks ready to execute (all dependencies completed, node is pending)
   */
  public getExecutableTasks(): GraphNode<T>[] {
    const executable: GraphNode<T>[] = [];

    for (const node of this.nodes.values()) {
      if (node.status !== 'pending') continue;

      const allDepsCompleted = node.dependencies.every((depId) => {
        const depNode = this.nodes.get(depId);
        return depNode?.status === 'completed';
      });

      if (allDepsCompleted) {
        executable.push(node);
      }
    }

    return executable;
  }

  /**
   * Detects cycles in the dependency graph using depth-first search
   */
  public detectCycles(): boolean {
    const visited = new Set<string>();
    const recStack = new Set<string>();

    const hasCycle = (nodeId: string): boolean => {
      visited.add(nodeId);
      recStack.add(nodeId);

      const node = this.nodes.get(nodeId);
      if (node) {
        for (const depId of node.dependencies) {
          if (!visited.has(depId)) {
            if (hasCycle(depId)) return true;
          } else if (recStack.has(depId)) {
            return true;
          }
        }
      }

      recStack.delete(nodeId);
      return false;
    };

    for (const nodeId of this.nodes.keys()) {
      if (!visited.has(nodeId)) {
        if (hasCycle(nodeId)) return true;
      }
    }

    return false;
  }

  /**
   * Returns topological order of execution (prerequisites first)
   */
  public getTopologicalOrder(): string[] {
    if (this.detectCycles()) {
      throw new Error('Cyclic dependency detected in task graph; cannot compute topological order.');
    }

    const order: string[] = [];
    const visited = new Set<string>();

    const dfs = (nodeId: string) => {
      visited.add(nodeId);
      const node = this.nodes.get(nodeId);
      if (node) {
        for (const depId of node.dependencies) {
          if (!visited.has(depId)) {
            dfs(depId);
          }
        }
      }
      order.push(nodeId);
    };

    for (const nodeId of this.nodes.keys()) {
      if (!visited.has(nodeId)) {
        dfs(nodeId);
      }
    }

    return order;
  }
}
