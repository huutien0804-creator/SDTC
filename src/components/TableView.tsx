import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  ArrowUpDown,
  Crown,
  Eye,
  Trash2,
  Edit,
  Download,
  Building,
  ShieldAlert,
} from 'lucide-react';
import { Employee, HierarchyNode } from '../types/org';
import { getDepartmentColor } from '../utils/orgHierarchy';

interface TableViewProps {
  employees: Employee[];
  onSelectEmployee: (emp: HierarchyNode) => void;
  onEditEmployee: (emp: Employee) => void;
  onDeleteEmployee: (emp: Employee) => void;
  departments: string[];
}

type SortField = 'id' | 'fullName' | 'team' | 'part' | 'positionTitle' | 'level' | 'employmentType';
type SortOrder = 'asc' | 'desc';

export const TableView: React.FC<TableViewProps> = ({
  employees,
  onSelectEmployee,
  onEditEmployee,
  onDeleteEmployee,
  departments,
}) => {
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('all');
  const [hazardFilter, setHazardFilter] = useState('all');
  const [leaderOnly, setLeaderOnly] = useState(false);
  const [sortField, setSortField] = useState<SortField>('id');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 25;

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const filteredEmployees = useMemo(() => {
    return employees
      .filter((emp) => {
        if (deptFilter !== 'all' && emp.team !== deptFilter) return false;
        if (hazardFilter !== 'all' && emp.hazardousPosition !== hazardFilter) return false;
        if (leaderOnly && !emp.isLeader) return false;
        if (search.trim()) {
          const q = search.toLowerCase();
          const matchId = emp.id.includes(q);
          const matchName = emp.fullName?.toLowerCase().includes(q);
          const matchPos = emp.positionTitle.toLowerCase().includes(q);
          const matchTeam = emp.team.toLowerCase().includes(q);
          const matchPart = emp.part.toLowerCase().includes(q);
          if (!matchId && !matchName && !matchPos && !matchTeam && !matchPart) return false;
        }
        return true;
      })
      .sort((a, b) => {
        let valA: string | number = '';
        let valB: string | number = '';

        if (sortField === 'id') {
          valA = parseInt(a.id, 10) || 0;
          valB = parseInt(b.id, 10) || 0;
        } else if (sortField === 'fullName') {
          valA = a.fullName || '';
          valB = b.fullName || '';
        } else if (sortField === 'team') {
          valA = a.team || '';
          valB = b.team || '';
        } else if (sortField === 'part') {
          valA = a.part || '';
          valB = b.part || '';
        } else if (sortField === 'positionTitle') {
          valA = a.positionTitle || '';
          valB = b.positionTitle || '';
        } else if (sortField === 'level') {
          valA = a.level || '';
          valB = b.level || '';
        } else if (sortField === 'employmentType') {
          valA = a.employmentType || '';
          valB = b.employmentType || '';
        }

        if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
        if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
  }, [employees, deptFilter, hazardFilter, leaderOnly, search, sortField, sortOrder]);

  const totalPages = Math.ceil(filteredEmployees.length / pageSize) || 1;
  const paginatedList = filteredEmployees.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-6 py-6 space-y-4">
      {/* Search and Filters Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Tìm theo Tên, ID, Chức vụ..."
            className="w-full bg-slate-950 border border-slate-800 text-xs sm:text-sm text-white rounded-xl pl-9 pr-3 py-2 placeholder-slate-500 focus:outline-hidden focus:border-indigo-500"
          />
        </div>

        {/* Dropdowns */}
        <div className="flex items-center gap-2 flex-wrap w-full md:w-auto">
          {/* Department */}
          <select
            value={deptFilter}
            onChange={(e) => {
              setDeptFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="bg-slate-800 text-slate-200 text-xs rounded-xl px-3 py-2 border border-slate-700 focus:outline-hidden focus:border-indigo-500"
          >
            <option value="all">Tất cả phòng ban</option>
            {departments.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>

          {/* Workplace */}
          <select
            value={hazardFilter}
            onChange={(e) => {
              setHazardFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="bg-slate-800 text-slate-200 text-xs rounded-xl px-3 py-2 border border-slate-700 focus:outline-hidden focus:border-indigo-500"
          >
            <option value="all">Tất cả khu vực</option>
            <option value="Office">Văn phòng (Office)</option>
            <option value="Production">Nhà máy SX (Production)</option>
          </select>

          {/* Leaders only */}
          <button
            onClick={() => {
              setLeaderOnly(!leaderOnly);
              setCurrentPage(1);
            }}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
              leaderOnly
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
            }`}
          >
            <Crown size={13} className={leaderOnly ? 'text-amber-400' : ''} />
            <span>Cán bộ Lãnh đạo</span>
          </button>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/70 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                <th
                  onClick={() => handleSort('id')}
                  className="py-3.5 px-4 cursor-pointer hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>ID</span>
                    <ArrowUpDown size={12} />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('fullName')}
                  className="py-3.5 px-4 cursor-pointer hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>Nhân Sự</span>
                    <ArrowUpDown size={12} />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('team')}
                  className="py-3.5 px-4 cursor-pointer hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>Phòng Ban / Khối</span>
                    <ArrowUpDown size={12} />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('part')}
                  className="py-3.5 px-4 cursor-pointer hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>Bộ phận trực thuộc</span>
                    <ArrowUpDown size={12} />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('positionTitle')}
                  className="py-3.5 px-4 cursor-pointer hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>Chức danh</span>
                    <ArrowUpDown size={12} />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('level')}
                  className="py-3.5 px-4 cursor-pointer hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>Cấp bậc</span>
                    <ArrowUpDown size={12} />
                  </div>
                </th>
                <th className="py-3.5 px-4">Khu vực</th>
                <th className="py-3.5 px-4">Quản lý trực tiếp</th>
                <th className="py-3.5 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {paginatedList.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500">
                    Không tìm thấy nhân sự phù hợp với bộ lọc.
                  </td>
                </tr>
              ) : (
                paginatedList.map((emp) => {
                  const deptColor = getDepartmentColor(emp.team);
                  return (
                    <tr
                      key={emp.id}
                      className="hover:bg-slate-800/40 transition-colors group"
                    >
                      {/* ID */}
                      <td className="py-3 px-4 font-mono font-semibold text-slate-300">
                        #{emp.id}
                      </td>

                      {/* Name & Avatar */}
                      <td className="py-3 px-4">
                        <div
                          onClick={() => onSelectEmployee(emp as unknown as HierarchyNode)}
                          className="flex items-center gap-2.5 cursor-pointer"
                        >
                          <img
                            src={emp.photoUrl}
                            alt={emp.id}
                            className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex-shrink-0"
                          />
                          <div>
                            <p className="font-bold text-white group-hover:text-indigo-400 transition-colors">
                              {emp.fullName || `Nhân sự #${emp.id}`}
                            </p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              {emp.isLeader && (
                                <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-amber-400">
                                  <Crown size={10} />
                                  Leader
                                </span>
                              )}
                              <span className="text-[10px] text-slate-500">
                                {emp.employmentType}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Team */}
                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-md text-xs font-medium border ${deptColor.bg} ${deptColor.text} ${deptColor.border}`}
                        >
                          {emp.team}
                        </span>
                      </td>

                      {/* Part */}
                      <td className="py-3 px-4 text-slate-300">
                        {emp.part || <span className="text-slate-600">—</span>}
                      </td>

                      {/* Position Title */}
                      <td className="py-3 px-4 font-medium text-slate-200">
                        {emp.positionTitle}
                      </td>

                      {/* Level */}
                      <td className="py-3 px-4 text-slate-400 font-mono text-xs">
                        {emp.level}
                      </td>

                      {/* Workplace Hazard */}
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold ${
                            emp.hazardousPosition === 'Production'
                              ? 'bg-amber-500/15 text-amber-400 border border-amber-500/20'
                              : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                          }`}
                        >
                          {emp.hazardousPosition === 'Production' ? (
                            <ShieldAlert size={11} />
                          ) : (
                            <Building size={11} />
                          )}
                          {emp.hazardousPosition}
                        </span>
                      </td>

                      {/* Manager */}
                      <td className="py-3 px-4 text-slate-400 text-xs">
                        {emp.managerId ? (
                          <span className="font-mono text-indigo-400">
                            #{emp.managerId}
                          </span>
                        ) : (
                          <span className="text-amber-400 font-medium">HĐ Quản trị</span>
                        )}
                      </td>

                      {/* Action buttons */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onSelectEmployee(emp as unknown as HierarchyNode)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-300 hover:bg-slate-800 transition-colors"
                            title="Xem chi tiết"
                          >
                            <Eye size={15} />
                          </button>
                          <button
                            onClick={() => onEditEmployee(emp)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-amber-300 hover:bg-slate-800 transition-colors"
                            title="Chỉnh sửa thông tin"
                          >
                            <Edit size={15} />
                          </button>
                          <button
                            onClick={() => onDeleteEmployee(emp)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors"
                            title="Xóa nhân sự"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <div>
            Hiển thị{' '}
            <strong className="text-white font-semibold">
              {filteredEmployees.length === 0
                ? 0
                : (currentPage - 1) * pageSize + 1}
              -
              {Math.min(currentPage * pageSize, filteredEmployees.length)}
            </strong>{' '}
            trên tổng số{' '}
            <strong className="text-white font-semibold">
              {filteredEmployees.length}
            </strong>{' '}
            nhân sự
          </div>

          <div className="flex items-center gap-1.5">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              className="px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-750 transition-colors"
            >
              Trang trước
            </button>
            <span className="px-2 font-mono text-slate-300">
              {currentPage} / {totalPages}
            </span>
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              className="px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-750 transition-colors"
            >
              Trang sau
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
