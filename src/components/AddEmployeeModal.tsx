import React, { useState } from 'react';
import { X, UserPlus, Check } from 'lucide-react';
import { Employee } from '../types/org';

interface AddEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddEmployee: (employee: Employee) => void;
  employees: Employee[];
  departments: string[];
}

export const AddEmployeeModal: React.FC<AddEmployeeModalProps> = ({
  isOpen,
  onClose,
  onAddEmployee,
  employees,
  departments,
}) => {
  const nextId = String(
    Math.max(...employees.map((e) => parseInt(e.id, 10) || 0), 0) + 1
  );

  const [id, setId] = useState(nextId);
  const [fullName, setFullName] = useState('');
  const [team, setTeam] = useState(departments[0] || 'Business Support');
  const [part, setPart] = useState('');
  const [positionTitle, setPositionTitle] = useState('');
  const [level, setLevel] = useState('Staff');
  const [managerId, setManagerId] = useState(
    employees.find((e) => e.level === 'Team Leader')?.id || '190'
  );
  const [employmentType, setEmploymentType] = useState('Local');
  const [hazardousPosition, setHazardousPosition] = useState('Office');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!positionTitle.trim()) return;

    const newEmp: Employee = {
      id: id.trim() || nextId,
      fullName: fullName.trim() || `Nhân sự #${id}`,
      team: team.trim(),
      part: part.trim(),
      level,
      positionTitle: positionTitle.trim(),
      employmentType,
      hazardousPosition,
      photoUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${id}`,
      managerId,
      isLeader:
        level === 'Director' ||
        level === 'Team Leader' ||
        level === 'Part Leader',
      email: `emp${id}@enterprise.com`,
      phone: '+84 (0) 90 000 0000',
    };

    onAddEmployee(newEmp);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <UserPlus size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Thêm Nhân Sự Mới</h3>
              <p className="text-xs text-slate-400">
                Thêm vị trí mới vào cấu trúc sơ đồ tổ chức
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white bg-slate-800"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs sm:text-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-400 font-medium mb-1">
                Mã nhân sự (ID)
              </label>
              <input
                type="text"
                required
                value={id}
                onChange={(e) => setId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1">
                Họ và tên
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Ví dụ: Nguyễn Văn A"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-600"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1">
                Chức danh công việc (Position)
              </label>
              <input
                type="text"
                required
                value={positionTitle}
                onChange={(e) => setPositionTitle(e.target.value)}
                placeholder="Ví dụ: Specialist, QC Staff, Leader"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-600"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1">
                Phòng ban / Khối (Team)
              </label>
              <input
                type="text"
                required
                value={team}
                onChange={(e) => setTeam(e.target.value)}
                placeholder="Ví dụ: Business Support, PU Production"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1">
                Bộ phận trực thuộc (Part)
              </label>
              <input
                type="text"
                value={part}
                onChange={(e) => setPart(e.target.value)}
                placeholder="Ví dụ: HR, SCM, Maintenance"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-600"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1">
                Cấp bậc (z Level)
              </label>
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
              >
                <option value="Staff">Staff</option>
                <option value="Part Leader">Part Leader</option>
                <option value="Team Leader">Team Leader</option>
                <option value="Director">Director</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-slate-400 font-medium mb-1">
                Cán bộ quản lý trực tiếp (Manager ID)
              </label>
              <select
                value={managerId}
                onChange={(e) => setManagerId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
              >
                <option value="">Không có (Cấp Giám Đốc cao nhất)</option>
                {employees.map((m) => (
                  <option key={m.id} value={m.id}>
                    #{m.id} - {m.fullName || m.positionTitle} ({m.team}{' '}
                    {m.part ? `• ${m.part}` : ''})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1">
                Loại hình hợp đồng
              </label>
              <select
                value={employmentType}
                onChange={(e) => setEmploymentType(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
              >
                <option value="Local">Local (Nội địa)</option>
                <option value="Expat">Expat (Chuyên gia)</option>
                <option value="LKS">LKS (Biệt phái)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1">
                Khu vực làm việc
              </label>
              <select
                value={hazardousPosition}
                onChange={(e) => setHazardousPosition(e.target.value)}
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
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold flex items-center gap-1.5 shadow-lg"
            >
              <Check size={16} />
              <span>Thêm nhân sự</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
