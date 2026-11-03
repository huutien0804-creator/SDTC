import React, { useState } from 'react';
import {
  X,
  Crown,
  Building,
  ShieldAlert,
  Mail,
  Phone,
  Briefcase,
  Users,
  ChevronRight,
  Edit2,
  Trash2,
  Check,
  UserCheck,
} from 'lucide-react';
import { Employee, HierarchyNode } from '../types/org';
import { getDepartmentColor } from '../utils/orgHierarchy';

interface EmployeeModalProps {
  employee: HierarchyNode | null;
  employees: Employee[];
  onClose: () => void;
  onSelectEmployee: (emp: HierarchyNode) => void;
  onUpdateEmployee: (updated: Employee) => void;
  onDeleteEmployee: (emp: Employee) => void;
}

export const EmployeeModal: React.FC<EmployeeModalProps> = ({
  employee,
  employees,
  onClose,
  onSelectEmployee,
  onUpdateEmployee,
  onDeleteEmployee,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Employee | null>(null);

  if (!employee) return null;

  const current = isEditing && editForm ? editForm : employee;
  const deptColor = getDepartmentColor(current.team);

  // Find reporting manager
  const manager = employees.find((e) => e.id === current.managerId);

  // Find direct subordinates
  const directSubordinates = employees.filter((e) => e.managerId === current.id);

  const startEdit = () => {
    setEditForm({ ...employee });
    setIsEditing(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editForm) return;
    onUpdateEmployee(editForm);
    setIsEditing(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Accent Top Bar */}
        <div className={`h-2 w-full ${deptColor.bar}`} />

        {/* Modal Header */}
        <div className="p-6 border-b border-slate-800 flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <img
                src={current.photoUrl}
                alt={current.id}
                className="w-16 h-16 rounded-2xl bg-slate-800 border-2 border-slate-700 object-cover shadow-lg"
              />
              {current.isLeader && (
                <div className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center text-slate-950 shadow-md">
                  <Crown size={14} className="stroke-[2.5]" />
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                  ID: #{current.id}
                </span>
                <span
                  className={`text-xs font-semibold px-2 py-0.5 rounded-md border ${deptColor.bg} ${deptColor.text} ${deptColor.border}`}
                >
                  {current.team}
                </span>
                {current.isLeader && (
                  <span className="text-xs font-bold text-amber-400 flex items-center gap-1">
                    <Crown size={12} />
                    Lãnh đạo
                  </span>
                )}
              </div>

              <h2 className="text-xl font-bold text-white mt-1">
                {current.fullName || `Nhân sự #${current.id}`}
              </h2>
              <p className="text-sm text-indigo-400 font-semibold">
                {current.positionTitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isEditing && (
              <>
                <button
                  onClick={startEdit}
                  className="p-2 rounded-xl text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors"
                  title="Chỉnh sửa thông tin"
                >
                  <Edit2 size={16} />
                </button>
                <button
                  onClick={() => onDeleteEmployee(employee)}
                  className="p-2 rounded-xl text-slate-400 hover:text-red-400 bg-slate-800 hover:bg-slate-700 transition-colors"
                  title="Xóa nhân viên"
                >
                  <Trash2 size={16} />
                </button>
              </>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {isEditing && editForm ? (
            /* Edit Form */
            <form onSubmit={handleSave} className="space-y-4 text-xs sm:text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 text-xs font-medium mb-1">
                    Họ và tên
                  </label>
                  <input
                    type="text"
                    value={editForm.fullName || ''}
                    onChange={(e) =>
                      setEditForm({ ...editForm, fullName: e.target.value })
                    }
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 text-xs font-medium mb-1">
                    Chức danh (Position Title)
                  </label>
                  <input
                    type="text"
                    value={editForm.positionTitle}
                    onChange={(e) =>
                      setEditForm({ ...editForm, positionTitle: e.target.value })
                    }
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 text-xs font-medium mb-1">
                    Phòng ban / Khối (Team)
                  </label>
                  <input
                    type="text"
                    value={editForm.team}
                    onChange={(e) =>
                      setEditForm({ ...editForm, team: e.target.value })
                    }
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 text-xs font-medium mb-1">
                    Bộ phận trực thuộc (Part)
                  </label>
                  <input
                    type="text"
                    value={editForm.part}
                    onChange={(e) =>
                      setEditForm({ ...editForm, part: e.target.value })
                    }
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 text-xs font-medium mb-1">
                    Cấp bậc (z Level)
                  </label>
                  <select
                    value={editForm.level}
                    onChange={(e) =>
                      setEditForm({ ...editForm, level: e.target.value })
                    }
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  >
                    <option value="Director">Director</option>
                    <option value="Team Leader">Team Leader</option>
                    <option value="Part Leader">Part Leader</option>
                    <option value="Staff">Staff</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 text-xs font-medium mb-1">
                    Cán bộ quản lý trực tiếp (Manager ID)
                  </label>
                  <select
                    value={editForm.managerId || ''}
                    onChange={(e) =>
                      setEditForm({ ...editForm, managerId: e.target.value })
                    }
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  >
                    <option value="">Không có (Hội đồng / Giám đốc cấp cao nhất)</option>
                    {employees
                      .filter((e) => e.id !== current.id)
                      .map((m) => (
                        <option key={m.id} value={m.id}>
                          #{m.id} - {m.fullName || m.positionTitle} ({m.team})
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 text-xs font-medium mb-1">
                    Loại hình nhân sự
                  </label>
                  <select
                    value={editForm.employmentType}
                    onChange={(e) =>
                      setEditForm({ ...editForm, employmentType: e.target.value })
                    }
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  >
                    <option value="Local">Local (Nội địa)</option>
                    <option value="Expat">Expat (Chuyên gia nước ngoài)</option>
                    <option value="LKS">LKS (Biệt phái)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 text-xs font-medium mb-1">
                    Nơi làm việc
                  </label>
                  <select
                    value={editForm.hazardousPosition}
                    onChange={(e) =>
                      setEditForm({ ...editForm, hazardousPosition: e.target.value })
                    }
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  >
                    <option value="Office">Office (Văn phòng)</option>
                    <option value="Production">Production (Nhà máy / Sản xuất)</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold flex items-center gap-1.5 shadow-lg"
                >
                  <Check size={16} />
                  <span>Lưu thay đổi</span>
                </button>
              </div>
            </form>
          ) : (
            /* View Mode */
            <>
              {/* Personnel Attributes Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800">
                  <span className="text-[11px] text-slate-400 uppercase font-semibold">
                    Bộ phận trực thuộc
                  </span>
                  <p className="text-sm font-bold text-white mt-0.5">
                    {current.part || 'Chung'}
                  </p>
                </div>
                <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800">
                  <span className="text-[11px] text-slate-400 uppercase font-semibold">
                    Cấp bậc
                  </span>
                  <p className="text-sm font-bold text-indigo-400 mt-0.5">
                    {current.level}
                  </p>
                </div>
                <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800">
                  <span className="text-[11px] text-slate-400 uppercase font-semibold">
                    Loại hợp đồng
                  </span>
                  <p className="text-sm font-bold text-slate-200 mt-0.5">
                    {current.employmentType}
                  </p>
                </div>
                <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800">
                  <span className="text-[11px] text-slate-400 uppercase font-semibold">
                    Nơi làm việc
                  </span>
                  <p
                    className={`text-sm font-bold mt-0.5 flex items-center gap-1 ${
                      current.hazardousPosition === 'Production'
                        ? 'text-amber-400'
                        : 'text-emerald-400'
                    }`}
                  >
                    {current.hazardousPosition === 'Production' ? (
                      <ShieldAlert size={14} />
                    ) : (
                      <Building size={14} />
                    )}
                    {current.hazardousPosition}
                  </p>
                </div>
              </div>

              {/* Direct Reporting Manager Card */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <UserCheck size={14} className="text-amber-400" />
                  Báo cáo trực tiếp cho (Direct Manager)
                </h4>
                {manager ? (
                  <div
                    onClick={() => onSelectEmployee(manager as unknown as HierarchyNode)}
                    className="p-3.5 rounded-2xl bg-slate-950/80 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-700 cursor-pointer transition-all flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={manager.photoUrl}
                        alt={manager.id}
                        className="w-11 h-11 rounded-xl bg-slate-800 border border-slate-700"
                      />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-xs font-semibold text-indigo-400">
                            #{manager.id}
                          </span>
                          <span className="font-bold text-sm text-white group-hover:text-indigo-400">
                            {manager.fullName || `Nhân sự #${manager.id}`}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400">
                          {manager.positionTitle} • {manager.team}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-indigo-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                      <span>Xem hồ sơ</span>
                      <ChevronRight size={14} />
                    </span>
                  </div>
                ) : (
                  <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 text-xs text-amber-300 font-medium">
                    Đây là cấp quản trị cao nhất (Tổng Giám Đốc / HĐQT), không có quản lý trực tiếp.
                  </div>
                )}
              </div>

              {/* Direct Subordinates Grid */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Users size={14} className="text-sky-400" />
                    Nhân viên báo cáo trực tiếp ({directSubordinates.length})
                  </h4>
                </div>

                {directSubordinates.length === 0 ? (
                  <div className="p-3.5 rounded-2xl bg-slate-950/50 border border-slate-800 text-xs text-slate-500 italic">
                    Chưa có nhân viên nào báo cáo trực tiếp cho vị trí này.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-56 overflow-y-auto pr-1">
                    {directSubordinates.map((sub) => (
                      <div
                        key={sub.id}
                        onClick={() => onSelectEmployee(sub as unknown as HierarchyNode)}
                        className="p-2.5 rounded-xl bg-slate-950/70 hover:bg-slate-800/80 border border-slate-800/80 hover:border-slate-700 cursor-pointer transition-all flex items-center gap-2.5 group"
                      >
                        <img
                          src={sub.photoUrl}
                          alt={sub.id}
                          className="w-8 h-8 rounded-lg bg-slate-800 flex-shrink-0"
                        />
                        <div className="min-w-0 flex-1 text-xs">
                          <p className="font-bold text-white truncate group-hover:text-indigo-400">
                            {sub.fullName || `Nhân sự #${sub.id}`}
                          </p>
                          <p className="text-[11px] text-slate-400 truncate">
                            {sub.positionTitle}
                          </p>
                        </div>
                        <span className="font-mono text-[10px] text-slate-500">
                          #{sub.id}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
