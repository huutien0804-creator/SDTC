import { Employee, HierarchyNode } from '../types/org';

export const DEPARTMENT_COLORS: Record<string, { bg: string; text: string; border: string; glow: string; bar: string }> = {
  'Executive Board': {
    bg: 'bg-amber-500/15',
    text: 'text-amber-300',
    border: 'border-amber-500/40',
    glow: 'rgba(245, 158, 11, 0.25)',
    bar: 'bg-amber-500',
  },
  'Business Support': {
    bg: 'bg-sky-500/15',
    text: 'text-sky-300',
    border: 'border-sky-500/40',
    glow: 'rgba(14, 165, 233, 0.25)',
    bar: 'bg-sky-500',
  },
  'Compound Production': {
    bg: 'bg-emerald-500/15',
    text: 'text-emerald-300',
    border: 'border-emerald-500/40',
    glow: 'rgba(16, 185, 129, 0.25)',
    bar: 'bg-emerald-500',
  },
  'Compound T&S': {
    bg: 'bg-teal-500/15',
    text: 'text-teal-300',
    border: 'border-teal-500/40',
    glow: 'rgba(20, 184, 166, 0.25)',
    bar: 'bg-teal-500',
  },
  'CS': {
    bg: 'bg-indigo-500/15',
    text: 'text-indigo-300',
    border: 'border-indigo-500/40',
    glow: 'rgba(99, 102, 241, 0.25)',
    bar: 'bg-indigo-500',
  },
  'PU Production': {
    bg: 'bg-purple-500/15',
    text: 'text-purple-300',
    border: 'border-purple-500/40',
    glow: 'rgba(168, 85, 247, 0.25)',
    bar: 'bg-purple-500',
  },
  'PU1': {
    bg: 'bg-violet-500/15',
    text: 'text-violet-300',
    border: 'border-violet-500/40',
    glow: 'rgba(139, 92, 246, 0.25)',
    bar: 'bg-violet-500',
  },
  'PU2': {
    bg: 'bg-fuchsia-500/15',
    text: 'text-fuchsia-300',
    border: 'border-fuchsia-500/40',
    glow: 'rgba(217, 70, 239, 0.25)',
    bar: 'bg-fuchsia-500',
  },
  'Strategic Business': {
    bg: 'bg-rose-500/15',
    text: 'text-rose-300',
    border: 'border-rose-500/40',
    glow: 'rgba(244, 63, 94, 0.25)',
    bar: 'bg-rose-500',
  },
  'T/S Center': {
    bg: 'bg-orange-500/15',
    text: 'text-orange-300',
    border: 'border-orange-500/40',
    glow: 'rgba(249, 115, 22, 0.25)',
    bar: 'bg-orange-500',
  },
};

export function getDepartmentColor(team: string) {
  return (
    DEPARTMENT_COLORS[team] || {
      bg: 'bg-slate-700/30',
      text: 'text-slate-300',
      border: 'border-slate-600',
      glow: 'rgba(100, 116, 139, 0.2)',
      bar: 'bg-slate-500',
    }
  );
}

export function buildHierarchyTree(employees: Employee[]): HierarchyNode | null {
  if (!employees.length) return null;

  const nodeMap = new Map<string, HierarchyNode>();

  // Initialize node instances
  employees.forEach((emp) => {
    nodeMap.set(emp.id, {
      ...emp,
      children: [],
      subordinatesCount: 0,
      directReportsCount: 0,
      depth: 0,
    });
  });

  // Identify root candidate
  let rootNode: HierarchyNode | null = null;
  const rootCandidate = nodeMap.get('190'); // 190 is the top Director
  if (rootCandidate) {
    rootNode = rootCandidate;
  } else {
    // Fallback: find node with no manager or pointing to itself
    const foundRoot = Array.from(nodeMap.values()).find(
      (n) => !n.managerId || n.managerId === n.id || !nodeMap.has(n.managerId)
    );
    rootNode = foundRoot || nodeMap.values().next().value || null;
  }

  if (!rootNode) return null;

  // Build parent-child relationships avoiding cycles
  nodeMap.forEach((node) => {
    if (node.id === rootNode!.id) return;

    let parentId = node.managerId;
    if (!parentId || !nodeMap.has(parentId)) {
      parentId = rootNode!.id; // Default orphaned nodes directly under root
    }

    if (parentId !== node.id) {
      const parent = nodeMap.get(parentId);
      if (parent) {
        parent.children.push(node);
      }
    }
  });

  // Calculate depths and counts recursively
  function calculateMetrics(node: HierarchyNode, currentDepth: number): number {
    node.depth = currentDepth;
    node.directReportsCount = node.children.length;

    // Sort children: Leaders first, then by Part and ID
    node.children.sort((a, b) => {
      if (a.isLeader && !b.isLeader) return -1;
      if (!a.isLeader && b.isLeader) return 1;
      const partCompare = (a.part || '').localeCompare(b.part || '');
      if (partCompare !== 0) return partCompare;
      return parseInt(a.id, 10) - parseInt(b.id, 10);
    });

    let count = 0;
    node.children.forEach((child) => {
      count += 1 + calculateMetrics(child, currentDepth + 1);
    });

    node.subordinatesCount = count;
    return count;
  }

  calculateMetrics(rootNode, 0);
  return rootNode;
}

export function findPathToRoot(targetId: string, employees: Employee[]): string[] {
  const empMap = new Map(employees.map((e) => [e.id, e]));
  const path: string[] = [];
  const visited = new Set<string>();

  let currentId: string | undefined = targetId;
  while (currentId && empMap.has(currentId) && !visited.has(currentId)) {
    path.push(currentId);
    visited.add(currentId);
    const emp = empMap.get(currentId);
    currentId = emp?.managerId && emp.managerId !== currentId ? emp.managerId : undefined;
  }

  return path;
}

export function findAllSubordinates(targetId: string, employees: Employee[]): string[] {
  const subordinates: string[] = [];
  const childrenMap = new Map<string, string[]>();

  employees.forEach((emp) => {
    if (emp.managerId && emp.managerId !== emp.id) {
      const existing = childrenMap.get(emp.managerId) || [];
      existing.push(emp.id);
      childrenMap.set(emp.managerId, existing);
    }
  });

  function collect(id: string) {
    const direct = childrenMap.get(id) || [];
    direct.forEach((childId) => {
      subordinates.push(childId);
      collect(childId);
    });
  }

  collect(targetId);
  return subordinates;
}
