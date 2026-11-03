import React from 'react';
import {
  Network,
  Users,
  Table as TableIcon,
  BarChart3,
  FileSpreadsheet,
  UserPlus,
  Download,
  RotateCcw,
} from 'lucide-react';
import { ViewMode } from '../types/org';

interface HeaderProps {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  totalEmployees: number;
  totalDepartments: number;
  onOpenGoogleSheets: () => void;
  onOpenAddEmployee: () => void;
  onResetData: () => void;
  onExportCsv: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  viewMode,
  setViewMode,
  totalEmployees,
  totalDepartments,
  onOpenGoogleSheets,
  onOpenAddEmployee,
  onResetData,
  onExportCsv,
}) => {
  return (
    <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur-md sticky top-0 z-40 px-4 lg:px-6 py-3 transition-colors">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Brand & Stats */}
        <div className="flex items-center gap-3.5 w-full md:w-auto">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-sky-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white flex-shrink-0">
            <Network size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold text-white tracking-tight">
                Sơ Đồ Tổ Chức Doanh Nghiệp
              </h1>
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                Live Data
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
              <span>
                <strong className="text-slate-200 font-semibold">{totalEmployees}</strong> Nhân sự
              </span>
              <span className="text-slate-600">•</span>
              <span>
                <strong className="text-slate-200 font-semibold">{totalDepartments}</strong> Phòng ban / Khối
              </span>
            </div>
          </div>
        </div>

        {/* View Mode Switcher Tabs */}
        <div className="flex items-center bg-slate-950/70 p-1 rounded-xl border border-slate-800 text-xs sm:text-sm font-medium w-full sm:w-auto overflow-x-auto">
          <button
            onClick={() => setViewMode('tree')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
              viewMode === 'tree'
                ? 'bg-indigo-600 text-white shadow-sm font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Network size={15} />
            <span>Sơ đồ cây</span>
          </button>
          <button
            onClick={() => setViewMode('departments')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
              viewMode === 'departments'
                ? 'bg-indigo-600 text-white shadow-sm font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Users size={15} />
            <span>Phòng ban</span>
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
              viewMode === 'table'
                ? 'bg-indigo-600 text-white shadow-sm font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <TableIcon size={15} />
            <span>Danh bạ</span>
          </button>
          <button
            onClick={() => setViewMode('analytics')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
              viewMode === 'analytics'
                ? 'bg-indigo-600 text-white shadow-sm font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <BarChart3 size={15} />
            <span>Thống kê</span>
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          {/* Google Sheets Integration Button */}
          <button
            onClick={onOpenGoogleSheets}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-medium bg-emerald-600/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-600/30 transition-all cursor-pointer shadow-sm hover:shadow-emerald-950/40"
            title="Đồng bộ & Xuất file Google Sheets"
          >
            <FileSpreadsheet size={16} className="text-emerald-400" />
            <span className="hidden sm:inline">Google Sheets</span>
          </button>

          {/* Add Employee */}
          <button
            onClick={onOpenAddEmployee}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-medium bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-950/40 transition-all cursor-pointer"
            title="Thêm nhân viên mới"
          >
            <UserPlus size={16} />
            <span>Thêm mới</span>
          </button>

          {/* Export CSV */}
          <button
            onClick={onExportCsv}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-200 bg-slate-800 hover:bg-slate-700 transition-colors cursor-pointer"
            title="Tải về file CSV"
          >
            <Download size={16} />
          </button>

          {/* Reset data */}
          <button
            onClick={onResetData}
            className="p-2 rounded-xl text-slate-400 hover:text-amber-400 bg-slate-800 hover:bg-slate-700 transition-colors cursor-pointer"
            title="Khôi phục dữ liệu mẫu ban đầu"
          >
            <RotateCcw size={16} />
          </button>
        </div>
      </div>
    </header>
  );
};
