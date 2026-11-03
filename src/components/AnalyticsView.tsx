import React, { useMemo } from 'react';
import {
  Users,
  Building,
  ShieldAlert,
  Crown,
  Briefcase,
  PieChart,
  TrendingUp,
} from 'lucide-react';
import { Employee } from '../types/org';
import { getDepartmentColor } from '../utils/orgHierarchy';

interface AnalyticsViewProps {
  employees: Employee[];
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ employees }) => {
  const stats = useMemo(() => {
    const total = employees.length;
    let leadersCount = 0;
    let officeCount = 0;
    let productionCount = 0;
    let expatCount = 0;
    let localCount = 0;
    let lksCount = 0;

    const deptCounts: Record<string, number> = {};
    const levelCounts: Record<string, number> = {};
    const managerReportsCount: Record<string, number> = {};

    employees.forEach((emp) => {
      if (emp.isLeader) leadersCount++;
      if (emp.hazardousPosition === 'Production') productionCount++;
      else officeCount++;

      if (emp.employmentType === 'Expat') expatCount++;
      else if (emp.employmentType === 'LKS') lksCount++;
      else localCount++;

      const team = emp.team || 'Unassigned';
      deptCounts[team] = (deptCounts[team] || 0) + 1;

      const lvl = emp.level || 'Staff';
      levelCounts[lvl] = (levelCounts[lvl] || 0) + 1;

      if (emp.managerId) {
        managerReportsCount[emp.managerId] = (managerReportsCount[emp.managerId] || 0) + 1;
      }
    });

    const managerIds = Object.keys(managerReportsCount);
    const avgSpanOfControl =
      managerIds.length > 0
        ? (managerIds.reduce((sum, id) => sum + managerReportsCount[id], 0) / managerIds.length).toFixed(1)
        : '0';

    return {
      total,
      leadersCount,
      staffCount: total - leadersCount,
      leaderRatio: total > 0 ? Math.round((leadersCount / total) * 100) : 0,
      officeCount,
      productionCount,
      officePercent: total > 0 ? Math.round((officeCount / total) * 100) : 0,
      productionPercent: total > 0 ? Math.round((productionCount / total) * 100) : 0,
      expatCount,
      localCount,
      lksCount,
      deptCounts,
      levelCounts,
      avgSpanOfControl,
    };
  }, [employees]);

  const sortedDepts = Object.entries(stats.deptCounts).sort((a, b) => b[1] - a[1]);

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-6 py-6 space-y-6">
      {/* Top 4 Key Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Workforce */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Tổng Quy Mô Nhân Sự
            </span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Users size={18} />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-white tracking-tight">
            {stats.total}
          </p>
          <div className="flex items-center gap-2 mt-2 text-xs text-slate-400">
            <span className="text-emerald-400 font-semibold">100%</span>
            <span>Đã đồng bộ vào cơ sở dữ liệu</span>
          </div>
        </div>

        {/* Leaders & Management Ratio */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Cán Bộ Quản Lý & Điều Hành
            </span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Crown size={18} />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-white tracking-tight">
            {stats.leadersCount}
          </p>
          <div className="flex items-center gap-2 mt-2 text-xs text-slate-400">
            <span className="text-amber-400 font-semibold">{stats.leaderRatio}%</span>
            <span>Tỷ trọng nhân sự lãnh đạo / tổng số</span>
          </div>
        </div>

        {/* Workplace Distribution */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Phân Bổ Sản Xuất vs Văn Phòng
            </span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <ShieldAlert size={18} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-extrabold text-amber-400">
              {stats.productionCount}
            </p>
            <span className="text-xs text-slate-400">SX</span>
            <span className="text-slate-600">/</span>
            <p className="text-2xl font-extrabold text-emerald-400">
              {stats.officeCount}
            </p>
            <span className="text-xs text-slate-400">VP</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-2 mt-3 overflow-hidden flex">
            <div
              style={{ width: `${stats.productionPercent}%` }}
              className="bg-amber-500 h-full"
              title={`Nhà máy / Sản xuất: ${stats.productionPercent}%`}
            />
            <div
              style={{ width: `${stats.officePercent}%` }}
              className="bg-emerald-500 h-full"
              title={`Văn phòng: ${stats.officePercent}%`}
            />
          </div>
        </div>

        {/* Span of Control */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Quy Mô Quản Lý Trung Bình
            </span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <TrendingUp size={18} />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-white tracking-tight">
            1 : {stats.avgSpanOfControl}
          </p>
          <div className="flex items-center gap-2 mt-2 text-xs text-slate-400">
            <span>Tỷ lệ nhân viên trung bình / 1 quản lý</span>
          </div>
        </div>
      </div>

      {/* Department Breakdown & Employment Demographics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Department Headcount Ranking */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                Quy Mô Nhân Sự Từng Phòng Ban / Khối
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Xếp hạng theo tổng số lượng nhân sự
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-slate-400 bg-slate-800 px-2.5 py-1 rounded-lg">
              {sortedDepts.length} Khối
            </span>
          </div>

          <div className="space-y-3.5 pt-2">
            {sortedDepts.map(([dept, count]) => {
              const color = getDepartmentColor(dept);
              const percent = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
              return (
                <div key={dept} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-200">{dept}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white font-mono">{count} người</span>
                      <span className="text-slate-400 text-[11px] w-10 text-right">({percent}%)</span>
                    </div>
                  </div>
                  <div className="w-full bg-slate-950 rounded-full h-2.5 overflow-hidden border border-slate-800/80">
                    <div
                      style={{ width: `${percent}%` }}
                      className={`h-full rounded-full transition-all duration-500 ${color.bar}`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Col: Employment Types & Role Levels */}
        <div className="space-y-6">
          {/* Employment Type Demographics */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-white tracking-tight pb-3 border-b border-slate-800">
              Cơ Cấu Hợp Đồng & Nhân Sự
            </h3>
            <div className="space-y-3">
              <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-400">Nhân sự nội địa (Local)</p>
                  <p className="text-lg font-bold text-white">{stats.localCount}</p>
                </div>
                <span className="text-xs font-bold px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {Math.round((stats.localCount / stats.total) * 100)}%
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-400">Chuyên gia nước ngoài (Expat)</p>
                  <p className="text-lg font-bold text-purple-300">{stats.expatCount}</p>
                </div>
                <span className="text-xs font-bold px-2 py-1 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
                  {Math.round((stats.expatCount / stats.total) * 100)}%
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-400">Nhân sự biệt phái (LKS)</p>
                  <p className="text-lg font-bold text-blue-300">{stats.lksCount}</p>
                </div>
                <span className="text-xs font-bold px-2 py-1 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  {Math.round((stats.lksCount / stats.total) * 100)}%
                </span>
              </div>
            </div>
          </div>

          {/* Level Hierarchy breakdown */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-white tracking-tight pb-3 border-b border-slate-800">
              Phân Tầng Cấp Bậc (Levels)
            </h3>
            <div className="space-y-2">
              {Object.entries(stats.levelCounts).map(([lvl, count]) => (
                <div
                  key={lvl}
                  className="flex items-center justify-between text-xs py-1.5 border-b border-slate-800/50 last:border-0"
                >
                  <span className="text-slate-300 font-medium">{lvl}</span>
                  <span className="font-mono font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-md border border-indigo-500/20">
                    {count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
