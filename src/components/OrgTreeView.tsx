import React, { useState, useRef, useEffect } from 'react';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  Search,
  Filter,
  Layers,
  Crown,
  ChevronDown,
} from 'lucide-react';
import { HierarchyNode, Employee, FilterOptions } from '../types/org';
import { OrgTreeNode } from './OrgTreeNode';
import { findPathToRoot, findAllSubordinates } from '../utils/orgHierarchy';

interface OrgTreeViewProps {
  rootNode: HierarchyNode | null;
  employees: Employee[];
  selectedEmployee: HierarchyNode | null;
  onSelectEmployee: (emp: HierarchyNode | null) => void;
  departments: string[];
}

export const OrgTreeView: React.FC<OrgTreeViewProps> = ({
  rootNode,
  employees,
  selectedEmployee,
  onSelectEmployee,
  departments,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Pan and Zoom states
  const [scale, setScale] = useState<number>(0.85);
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 0, y: 30 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Expansion state: set of node IDs that are expanded
  // By default, expand Director (#190) and immediate level (Team Leaders)
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(() => {
    const initial = new Set<string>();
    if (rootNode) {
      initial.add(rootNode.id);
      rootNode.children.forEach((c) => {
        initial.add(c.id);
        // Also expand Part Leaders initially for great overview
        c.children.forEach((sub) => {
          if (sub.isLeader) initial.add(sub.id);
        });
      });
    }
    return initial;
  });

  // Search & Filter state inside tree
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [leadersOnly, setLeadersOnly] = useState<boolean>(false);

  // Calculate highlighted reporting paths when an employee is selected
  const pathToRoot = selectedEmployee
    ? findPathToRoot(selectedEmployee.id, employees)
    : [];
  const subordinateIds = selectedEmployee
    ? findAllSubordinates(selectedEmployee.id, employees)
    : [];

  const pathToRootSet = new Set(pathToRoot);
  const subordinateSet = new Set(subordinateIds);

  // Toggle expand/collapse of a node
  const toggleExpand = (nodeId: string) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  };

  // Expand all nodes
  const expandAll = () => {
    const all = new Set<string>();
    employees.forEach((e) => all.add(e.id));
    setExpandedNodes(all);
  };

  // Collapse all except top level
  const collapseAll = () => {
    const min = new Set<string>();
    if (rootNode) min.add(rootNode.id);
    setExpandedNodes(min);
  };

  // Center & fit root
  const resetView = () => {
    setScale(0.85);
    if (containerRef.current) {
      const width = containerRef.current.clientWidth;
      setPosition({ x: width / 2 - 144, y: 50 });
    } else {
      setPosition({ x: 0, y: 30 });
    }
  };

  useEffect(() => {
    resetView();
  }, [rootNode]);

  // Mouse pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only left click
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = 0.0015;
    const newScale = Math.min(Math.max(scale - e.deltaY * zoomFactor, 0.25), 2.0);
    setScale(newScale);
  };

  // Jump to searched employee
  const handleJumpToEmployee = (empId: string) => {
    const emp = employees.find((e) => e.id === empId);
    if (!emp) return;

    // Expand all ancestors so it's visible in tree
    const ancestors = findPathToRoot(empId, employees);
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      ancestors.forEach((a) => next.add(a));
      return next;
    });

    onSelectEmployee(emp as unknown as HierarchyNode);
  };

  // Matching employees for search input dropdown
  const filteredSearchList = searchQuery.trim()
    ? employees
        .filter((e) => {
          const q = searchQuery.toLowerCase();
          return (
            e.id.includes(q) ||
            (e.fullName && e.fullName.toLowerCase().includes(q)) ||
            e.positionTitle.toLowerCase().includes(q) ||
            e.team.toLowerCase().includes(q) ||
            e.part.toLowerCase().includes(q)
          );
        })
        .slice(0, 8)
    : [];

  // Recursive tree rendering component
  const renderTreeNode = (node: HierarchyNode) => {
    const isExpanded = expandedNodes.has(node.id);
    const hasChildren = node.children && node.children.length > 0;

    // Filter children based on active filters if any
    let childrenToRender = node.children;
    if (departmentFilter !== 'all') {
      childrenToRender = childrenToRender.filter((c) =>
        c.team === departmentFilter || c.subordinatesCount > 0
      );
    }
    if (leadersOnly) {
      childrenToRender = childrenToRender.filter((c) => c.isLeader || c.subordinatesCount > 0);
    }

    return (
      <div key={node.id} className="flex flex-col items-center">
        {/* The Node Card */}
        <OrgTreeNode
          node={node}
          isExpanded={isExpanded}
          onToggleExpand={toggleExpand}
          onSelectEmployee={(n) => onSelectEmployee(n)}
          isSelected={selectedEmployee?.id === node.id}
          isInPathToRoot={pathToRootSet.has(node.id) && selectedEmployee?.id !== node.id}
          isInSubordinateChain={subordinateSet.has(node.id)}
        />

        {/* Children Sub-tree with connecting line */}
        {hasChildren && isExpanded && childrenToRender.length > 0 && (
          <div className="relative pt-8 flex flex-col items-center">
            {/* Vertical connector line from parent to horizontal bar */}
            <div className="absolute top-0 w-0.5 h-8 bg-slate-700 -translate-x-1/2 left-1/2" />

            {/* Children container */}
            <div className="flex items-start justify-center gap-6 relative">
              {childrenToRender.length > 1 && (
                /* Horizontal connector bar */
                <div
                  className="absolute top-0 h-0.5 bg-slate-700"
                  style={{
                    left: '144px', // Half of card width 288px (w-72)
                    right: '144px',
                  }}
                />
              )}

              {childrenToRender.map((child) => (
                <div key={child.id} className="relative flex flex-col items-center">
                  {/* Vertical connector from horizontal bar to child */}
                  <div className="w-0.5 h-8 bg-slate-700 -mt-8" />
                  {renderTreeNode(child)}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="relative w-full h-[calc(100vh-130px)] overflow-hidden bg-slate-950 custom-grid-bg flex flex-col">
      {/* Top Floating Control Bar: Search & Quick Filters */}
      <div className="absolute top-4 left-4 right-4 z-20 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
        {/* Left: Quick Search with Live Suggestions */}
        <div className="pointer-events-auto relative w-72 sm:w-80">
          <div className="relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo Tên, ID, Chức danh..."
              className="w-full bg-slate-900/90 border border-slate-700 text-xs sm:text-sm text-white rounded-xl pl-9 pr-8 py-2 placeholder-slate-400 backdrop-blur-md focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 shadow-xl"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs px-1"
              >
                ✕
              </button>
            )}
          </div>

          {/* Search suggestions dropdown */}
          {filteredSearchList.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-1.5 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden divide-y divide-slate-800 z-50 max-h-64 overflow-y-auto">
              {filteredSearchList.map((emp) => (
                <div
                  key={emp.id}
                  onClick={() => {
                    handleJumpToEmployee(emp.id);
                    setSearchQuery('');
                  }}
                  className="p-2.5 hover:bg-slate-800/80 cursor-pointer flex items-center justify-between gap-2 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <img
                      src={emp.photoUrl}
                      alt={emp.id}
                      className="w-7 h-7 rounded-lg bg-slate-800"
                    />
                    <div>
                      <p className="font-semibold text-slate-200">
                        {emp.fullName || `Nhân sự #${emp.id}`}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {emp.positionTitle} • {emp.team}
                      </p>
                    </div>
                  </div>
                  <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                    #{emp.id}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Center / Right: Department Filter & Leader Filter */}
        <div className="pointer-events-auto flex items-center gap-2 bg-slate-900/90 border border-slate-800 rounded-xl p-1 backdrop-blur-md shadow-xl text-xs">
          <div className="flex items-center gap-1.5 px-2 text-slate-400">
            <Filter size={13} />
            <span className="hidden sm:inline">Lọc khối:</span>
          </div>
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="bg-slate-800 text-slate-200 rounded-lg px-2 py-1 border border-slate-700 focus:outline-hidden focus:border-indigo-500 cursor-pointer"
          >
            <option value="all">Tất cả phòng ban</option>
            {departments.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>

          <button
            onClick={() => setLeadersOnly(!leadersOnly)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
              leadersOnly
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Crown size={12} className={leadersOnly ? 'text-amber-400' : ''} />
            <span className="hidden sm:inline">Chỉ lãnh đạo</span>
          </button>
        </div>
      </div>

      {/* Floating Canvas Controls (Bottom Right) */}
      <div className="absolute bottom-5 right-5 z-20 flex flex-col gap-2">
        <div className="flex flex-col bg-slate-900/90 border border-slate-800 rounded-xl p-1 shadow-2xl backdrop-blur-md">
          <button
            onClick={() => setScale((s) => Math.min(s + 0.15, 2.0))}
            className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            title="Phóng to (Zoom In)"
          >
            <ZoomIn size={18} />
          </button>
          <div className="text-center text-[10px] font-mono font-bold text-slate-400 py-1 border-y border-slate-800">
            {Math.round(scale * 100)}%
          </div>
          <button
            onClick={() => setScale((s) => Math.max(s - 0.15, 0.25))}
            className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            title="Thu nhỏ (Zoom Out)"
          >
            <ZoomOut size={18} />
          </button>
          <button
            onClick={resetView}
            className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            title="Căn giữa & Khôi phục khung nhìn"
          >
            <Maximize2 size={18} />
          </button>
        </div>

        {/* Expand / Collapse All buttons */}
        <div className="flex flex-col bg-slate-900/90 border border-slate-800 rounded-xl p-1 shadow-2xl backdrop-blur-md">
          <button
            onClick={expandAll}
            className="p-2 text-slate-300 hover:text-indigo-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            title="Mở rộng toàn bộ cây"
          >
            <Layers size={18} />
          </button>
          <button
            onClick={collapseAll}
            className="p-2 text-slate-300 hover:text-amber-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            title="Thu gọn về cấp lãnh đạo chính"
          >
            <Minimize2 size={18} />
          </button>
        </div>
      </div>

      {/* Reporting Chain Legend (Bottom Left) */}
      {selectedEmployee && (
        <div className="absolute bottom-5 left-5 z-20 bg-slate-900/90 border border-slate-800 rounded-xl p-3 shadow-2xl backdrop-blur-md text-xs max-w-xs">
          <div className="flex items-center justify-between gap-2 mb-2 pb-1.5 border-b border-slate-800">
            <span className="font-bold text-white">Tuyến báo cáo đang chọn</span>
            <button
              onClick={() => onSelectEmployee(null)}
              className="text-slate-400 hover:text-white text-[11px]"
            >
              Bỏ chọn
            </button>
          </div>
          <div className="space-y-1.5 text-[11px]">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-indigo-500 shadow-xs" />
              <span className="text-slate-200">
                <strong>#{selectedEmployee.id}</strong>: {selectedEmployee.positionTitle}
              </span>
            </div>
            {pathToRoot.length > 1 && (
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-amber-400 shadow-xs" />
                <span className="text-amber-300">
                  Tuyến quản lý cấp trên ({pathToRoot.length - 1} cấp)
                </span>
              </div>
            )}
            {subordinateIds.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-sky-400 shadow-xs" />
                <span className="text-sky-300">
                  Tất cả nhân sự cấp dưới ({subordinateIds.length} người)
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Interactive Draggable / Zoomable Canvas Area */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        className={`w-full h-full cursor-grab active:cursor-grabbing overflow-hidden ${
          isDragging ? 'select-none' : ''
        }`}
      >
        <div
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
            transformOrigin: 'top left',
            transition: isDragging ? 'none' : 'transform 0.1s ease-out',
          }}
          className="inline-block p-16"
        >
          {rootNode ? (
            renderTreeNode(rootNode)
          ) : (
            <div className="text-center py-20 text-slate-400">
              Không tìm thấy sơ đồ cây tổ chức hợp lệ.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
