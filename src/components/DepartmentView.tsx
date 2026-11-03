import React, { useState, useMemo } from 'react';
import {
  Users,
  Crown,
  Search,
  Building,
  ShieldAlert,
  ChevronRight,
  Filter,
} from 'lucide-react';
import { Employee, HierarchyNode } from '../types/org';
import { getDepartmentColor } from '../utils/orgHierarchy';

interface DepartmentViewProps {
  employees: Employee[];
  onSelectEmployee: (emp: HierarchyNode) => void;
}

export const DepartmentView: React.FC<DepartmentViewProps> = ({
  employees,
  onSelectEmployee,
}) => {
  const [selectedDept, setSelectedDept] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedPart, setSelectedPart] = useState<string>('all');

  // Group employees by Team, then by Part
  const departmentGroups = useMemo(() => {
    const groups: Record<
      string,
      {
        teamName: string;
        teamLeaders: Employee[];
        parts: Record<string, Employee[]>;
        total: number;
        officeCount: number;
        productionCount: number;
      }
    > = {};

    employees.forEach((emp) => {
      const team = emp.team || 'Chưa phân khối';
      if (!groups[team]) {
        groups[team] = {
          teamName: team,
          teamLeaders: [],
          parts: {},
          total: 0,
          officeCount: 0,
          productionCount: 0,
        };
      }

      groups[team].total += 1;
      if (emp.hazardousPosition === 'Production') {
        groups[team].productionCount += 1;
      } else {
        groups[team].officeCount += 1;
      }

      // Check if team leader or executive
      if (
        emp.level === 'Team Leader' ||
        emp.level === 'Director' ||
        (!emp.part && emp.isLeader)
      ) {
        groups[team].teamLeaders.push(emp);
      } else {
        const part = emp.part || 'Chung / Trực tiếp';
        if (!groups[team].parts[part]) {
          groups[team].parts[part] = [];
        }
        groups[team].parts[part].push(emp);
      }
    });

    return groups;
  }, [employees]);

  const allDepts = Object.keys(departmentGroups).sort();

  // Filtered list
  const filteredDepts = useMemo(() => {
    return allDepts.filter((deptName) => {
      if (selectedDept !== 'all' && deptName !== selectedDept) return false;
      return true;
    });
  }, [allDepts, selectedDept]);

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-6 py-6 space-y-6">
      {/* Top Filter & Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Lọc nhân sự trong phòng ban..."
            className="w-full bg-slate-950 border border-slate-800 text-xs sm:text-sm text-white rounded-xl pl-9 pr-3 py-2 placeholder-slate-500 focus:outline-hidden focus:border-indigo-500"
          />
        </div>

        {/* Department Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          <button
            onClick={() => setSelectedDept('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
              selectedDept === 'all'
                ? 'bg-indigo-600 text-white shadow'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-750 hover:text-white'
            }`}
          >
            Tất cả ({employees.length})
          </button>
          {allDepts.map((d) => (
            <button
              key={d}
              onClick={() => setSelectedDept(d)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                selectedDept === d
                  ? 'bg-indigo-600 text-white shadow'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-750 hover:text-white'
              }`}
            >
              {d} ({departmentGroups[d].total})
            </button>
          ))}
        </div>
      </div>

      {/* Departments Grid */}
      <div className="space-y-8">
        {filteredDepts.map((deptName) => {
          const group = departmentGroups[deptName];
          const color = getDepartmentColor(deptName);
          const partNames = Object.keys(group.parts).sort();

          return (
            <div
              key={deptName}
              className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl transition-all"
            >
              {/* Department Header */}
              <div className="p-5 sm:p-6 border-b border-slate-800/80 bg-slate-900/60 relative">
                <div className={`absolute top-0 left-0 right-0 h-1.5 ${color.bar}`} />
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center border font-bold text-lg ${color.bg} ${color.text} ${color.border}`}
                    >
                      <Users size={24} />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                        {deptName}
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Bao gồm {partNames.length} bộ phận/tổ trực thuộc
                      </p>
                    </div>
                  </div>

                  {/* Department Stats */}
                  <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
                    <div className="bg-slate-950/70 border border-slate-800 px-3 py-1.5 rounded-xl text-xs">
                      <span className="text-slate-400">Tổng nhân sự: </span>
                      <strong className="text-white font-bold">{group.total}</strong>
                    </div>
                    <div className="bg-slate-950/70 border border-slate-800 px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 text-emerald-400">
                      <Building size={13} />
                      <span>{group.officeCount} Văn phòng</span>
                    </div>
                    <div className="bg-slate-950/70 border border-slate-800 px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 text-amber-400">
                      <ShieldAlert size={13} />
                      <span>{group.productionCount} Nhà máy/SX</span>
                    </div>
                  </div>
                </div>

                {/* Team Leaders Section (if any) */}
                {group.teamLeaders.length > 0 && (
                  <div className="mt-5 pt-4 border-t border-slate-800/60">
                    <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                      <Crown size={14} />
                      Ban Lãnh Đạo Khối / Trưởng Bộ Phận
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {group.teamLeaders.map((leader) => (
                        <div
                          key={leader.id}
                          onClick={() => onSelectEmployee(leader as unknown as HierarchyNode)}
                          className="flex items-center justify-between p-3 rounded-2xl bg-amber-500/5 hover:bg-amber-500/10 border border-amber-500/30 cursor-pointer transition-all group"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <img
                              src={leader.photoUrl}
                              alt={leader.id}
                              className="w-10 h-10 rounded-xl bg-slate-800 border border-amber-500/40"
                            />
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-white group-hover:text-amber-300 truncate">
                                {leader.fullName || `Nhân sự #${leader.id}`}
                              </p>
                              <p className="text-[11px] text-amber-400/90 font-medium truncate">
                                {leader.positionTitle}
                              </p>
                              <span className="text-[10px] text-slate-400 font-mono">
                                ID: #{leader.id}
                              </span>
                            </div>
                          </div>
                          <ChevronRight
                            size={16}
                            className="text-amber-400 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all flex-shrink-0"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Sub-departments (Parts) */}
              <div className="p-5 sm:p-6 space-y-6">
                {partNames.length === 0 ? (
                  <div className="text-xs text-slate-500 italic py-2">
                    Không có phân nhóm phụ.
                  </div>
                ) : (
                  partNames.map((partName) => {
                    const allMembers = group.parts[partName];
                    const filteredMembers = searchQuery.trim()
                      ? allMembers.filter((m) => {
                          const q = searchQuery.toLowerCase();
                          return (
                            m.id.includes(q) ||
                            (m.fullName && m.fullName.toLowerCase().includes(q)) ||
                            m.positionTitle.toLowerCase().includes(q)
                          );
                        })
                      : allMembers;

                    if (searchQuery.trim() && filteredMembers.length === 0) return null;

                    return (
                      <div
                        key={partName}
                        className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4 sm:p-5"
                      >
                        {/* Part Header */}
                        <div className="flex items-center justify-between gap-3 mb-3 pb-2 border-b border-slate-800">
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                            <h5 className="text-sm font-bold text-slate-200">
                              Bộ phận: {partName}
                            </h5>
                          </div>
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                            {filteredMembers.length} nhân sự
                          </span>
                        </div>

                        {/* Employee Cards inside Part */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                          {filteredMembers.map((emp) => (
                            <div
                              key={emp.id}
                              onClick={() => onSelectEmployee(emp as unknown as HierarchyNode)}
                              className="p-3 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800/80 hover:border-slate-700 cursor-pointer transition-all group flex items-start gap-2.5"
                            >
                              <img
                                src={emp.photoUrl}
                                alt={emp.id}
                                className="w-9 h-9 rounded-xl bg-slate-800 flex-shrink-0"
                              />
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between gap-1">
                                  <span className="font-mono text-[10px] text-slate-400">
                                    #{emp.id}
                                  </span>
                                  {emp.isLeader && (
                                    <Crown size={11} className="text-amber-400" />
                                  )}
                                </div>
                                <p className="text-xs font-semibold text-slate-200 truncate group-hover:text-indigo-400">
                                  {emp.fullName || `Nhân sự #${emp.id}`}
                                </p>
                                <p className="text-[11px] text-slate-400 truncate">
                                  {emp.positionTitle}
                                </p>
                                <div className="flex items-center gap-1.5 mt-1 text-[10px]">
                                  <span
                                    className={`px-1.5 py-0.2 rounded ${
                                      emp.hazardousPosition === 'Production'
                                        ? 'bg-amber-500/10 text-amber-400'
                                        : 'bg-emerald-500/10 text-emerald-400'
                                    }`}
                                  >
                                    {emp.hazardousPosition}
                                  </span>
                                  <span className="text-slate-500">
                                    {emp.employmentType}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
