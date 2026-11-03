import React from 'react';
import {
  Crown,
  ChevronDown,
  ChevronRight,
  ShieldAlert,
  Building,
  Briefcase,
  Eye,
} from 'lucide-react';
import { HierarchyNode } from '../types/org';
import { getDepartmentColor } from '../utils/orgHierarchy';

interface OrgTreeNodeProps {
  node: HierarchyNode;
  isExpanded: boolean;
  onToggleExpand: (nodeId: string) => void;
  onSelectEmployee: (node: HierarchyNode) => void;
  isSelected: boolean;
  isInPathToRoot: boolean;
  isInSubordinateChain: boolean;
}

export const OrgTreeNode: React.FC<OrgTreeNodeProps> = ({
  node,
  isExpanded,
  onToggleExpand,
  onSelectEmployee,
  isSelected,
  isInPathToRoot,
  isInSubordinateChain,
}) => {
  const deptColor = getDepartmentColor(node.team);
  const hasChildren = node.children && node.children.length > 0;

  // Determine border and shadow classes
  let borderClasses = 'border-slate-800 hover:border-slate-600 bg-slate-900/95';
  let ringClasses = '';

  if (isSelected) {
    borderClasses = 'border-indigo-500 bg-slate-900 ring-2 ring-indigo-500/50 shadow-xl shadow-indigo-500/20';
  } else if (isInPathToRoot) {
    borderClasses = 'border-amber-400/90 bg-slate-900/95 ring-2 ring-amber-400/30 shadow-lg shadow-amber-500/15';
  } else if (isInSubordinateChain) {
    borderClasses = 'border-sky-400/80 bg-slate-900/95 ring-1 ring-sky-400/30';
  }

  // Level badge styling
  const isExecutive = node.level === 'Director';
  const isTeamLeader = node.level === 'Team Leader';
  const isPartLeader = node.level === 'Part Leader';

  return (
    <div className="relative flex flex-col items-center group select-none">
      {/* Node Card */}
      <div
        onClick={() => onSelectEmployee(node)}
        className={`w-72 rounded-2xl border transition-all duration-200 cursor-pointer p-3.5 relative overflow-hidden backdrop-blur-md ${borderClasses} ${ringClasses}`}
      >
        {/* Department Accent Top Bar */}
        <div className={`absolute top-0 left-0 right-0 h-1.5 ${deptColor.bar}`} />

        {/* Header row: ID + Badges */}
        <div className="flex items-center justify-between gap-1.5 mb-2 mt-0.5">
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
              #{node.id}
            </span>
            {node.isLeader && (
              <span
                className="flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30"
                title="Lãnh đạo / Leader"
              >
                <Crown size={11} className="text-amber-400" />
                <span>LEADER</span>
              </span>
            )}
          </div>

          {/* Employment Type Tag */}
          <div className="flex items-center gap-1">
            {node.employmentType === 'Expat' && (
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-purple-500/15 text-purple-300 border border-purple-500/30">
                EXPAT
              </span>
            )}
            {node.employmentType === 'LKS' && (
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-300 border border-blue-500/30">
                LKS
              </span>
            )}
            <span
              className={`text-[10px] font-semibold px-1.5 py-0.5 rounded flex items-center gap-0.5 ${
                node.hazardousPosition === 'Production'
                  ? 'bg-amber-500/15 text-amber-400 border border-amber-500/20'
                  : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
              }`}
              title={`Nơi làm việc: ${node.hazardousPosition}`}
            >
              {node.hazardousPosition === 'Production' ? (
                <ShieldAlert size={10} />
              ) : (
                <Building size={10} />
              )}
              {node.hazardousPosition}
            </span>
          </div>
        </div>

        {/* Profile info: Avatar + Names */}
        <div className="flex items-center gap-3">
          <div className="relative flex-shrink-0">
            <img
              src={node.photoUrl}
              alt={node.fullName || node.id}
              className="w-12 h-12 rounded-xl object-cover bg-slate-800 border border-slate-700/80 shadow-inner"
              onError={(e) => {
                // fallback to dicebear
                (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${node.id}`;
              }}
            />
            {isExecutive && (
              <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center text-slate-950 shadow">
                <Crown size={12} className="stroke-[2.5]" />
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <h4 className="text-sm font-bold text-white tracking-tight truncate group-hover:text-indigo-300 transition-colors">
              {node.fullName || `Nhân sự #${node.id}`}
            </h4>
            <div className="flex items-center gap-1 text-xs text-indigo-400 font-semibold mt-0.5 truncate">
              <Briefcase size={12} className="flex-shrink-0 text-slate-400" />
              <span className="truncate">{node.positionTitle}</span>
            </div>
          </div>
        </div>

        {/* Department & Part Footnote */}
        <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-1 text-[11px]">
          <span
            className={`px-2 py-0.5 rounded-md font-medium truncate max-w-[140px] border ${deptColor.bg} ${deptColor.text} ${deptColor.border}`}
            title={`Phòng ban: ${node.team}`}
          >
            {node.team}
          </span>
          {node.part && (
            <span
              className="px-2 py-0.5 rounded-md font-medium text-slate-400 bg-slate-800/80 border border-slate-700/60 truncate max-w-[110px]"
              title={`Bộ phận: ${node.part}`}
            >
              {node.part}
            </span>
          )}
        </div>

        {/* View Profile Action on Hover */}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSelectEmployee(node);
            }}
            className="p-1 rounded-md bg-slate-800 hover:bg-indigo-600 text-slate-300 hover:text-white transition-colors"
            title="Xem hồ sơ chi tiết"
          >
            <Eye size={13} />
          </button>
        </div>
      </div>

      {/* Expand/Collapse Button (Bottom Center) */}
      {hasChildren && (
        <div className="mt-2 relative z-10">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleExpand(node.id);
            }}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all shadow-md cursor-pointer ${
              isExpanded
                ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white border-indigo-400 shadow-indigo-950/60 ring-2 ring-indigo-500/30 animate-pulse'
            }`}
          >
            {isExpanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
            <span>
              {isExpanded ? 'Thu gọn' : `+${node.subordinatesCount} cấp dưới`}
            </span>
          </button>
        </div>
      )}
    </div>
  );
};
