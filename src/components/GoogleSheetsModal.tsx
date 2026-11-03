import React, { useState, useEffect } from 'react';
import {
  X,
  FileSpreadsheet,
  Upload,
  Download,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Loader2,
  LogOut,
  User,
} from 'lucide-react';
import { User as FirebaseUser } from 'firebase/auth';
import { Employee } from '../types/org';
import { googleSignIn, logout, getAccessToken, auth } from '../services/auth';
import {
  createOrgChartSpreadsheet,
  importEmployeesFromSpreadsheet,
  SheetExportResult,
} from '../services/sheetsService';
import { ConfirmationDialog } from './ConfirmationDialog';

interface GoogleSheetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  employees: Employee[];
  onImportEmployees: (newEmployees: Employee[]) => void;
}

export const GoogleSheetsModal: React.FC<GoogleSheetsModalProps> = ({
  isOpen,
  onClose,
  employees,
  onImportEmployees,
}) => {
  const [activeTab, setActiveTab] = useState<'export' | 'import'>('export');
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(auth.currentUser);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Export states
  const [sheetTitle, setSheetTitle] = useState(
    `Sơ Đồ Tổ Chức & Nhân Sự Doanh Nghiệp - ${new Date().toLocaleDateString('vi-VN')}`
  );
  const [exportResult, setExportResult] = useState<SheetExportResult | null>(null);

  // Import states
  const [importUrlOrId, setImportUrlOrId] = useState('');

  // Confirmation dialog state
  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    action: () => void;
    isDestructive?: boolean;
  }>({
    isOpen: false,
    title: '',
    message: '',
    action: () => {},
  });

  useEffect(() => {
    const unsub = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
    });
    return () => unsub();
  }, []);

  if (!isOpen) return null;

  const handleLogin = async () => {
    setIsLoggingIn(true);
    setStatusMessage(null);
    try {
      const res = await googleSignIn();
      if (res) {
        setCurrentUser(res.user);
        setStatusMessage({
          type: 'success',
          text: `Đã đăng nhập thành công với tài khoản ${res.user.email}`,
        });
      }
    } catch (err: any) {
      console.error(err);
      setStatusMessage({
        type: 'error',
        text: err.message || 'Đăng nhập Google thất bại. Vui lòng thử lại.',
      });
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    setCurrentUser(null);
    setExportResult(null);
    setStatusMessage(null);
  };

  // Trigger export flow with confirmation dialog
  const promptExport = () => {
    setConfirmState({
      isOpen: true,
      title: 'Xác nhận tạo Google Sheet mới',
      message: `Hệ thống sẽ tạo 1 bảng tính Google Sheets mới mang tên "${sheetTitle}" và xuất dữ liệu của toàn bộ ${employees.length} nhân viên vào bảng tính này.\n\nBạn có muốn tiếp tục không?`,
      action: executeExport,
      isDestructive: false,
    });
  };

  const executeExport = async () => {
    setConfirmState((prev) => ({ ...prev, isOpen: false }));
    const token = await getAccessToken();
    if (!token) {
      setStatusMessage({
        type: 'error',
        text: 'Chưa có quyền truy cập Google Sheets. Vui lòng đăng nhập lại.',
      });
      return;
    }

    setIsLoading(true);
    setStatusMessage(null);
    try {
      const result = await createOrgChartSpreadsheet(sheetTitle, employees, token);
      setExportResult(result);
      setStatusMessage({
        type: 'success',
        text: `Đã xuất thành công ${result.rowCount} nhân sự lên Google Sheet!`,
      });
    } catch (err: any) {
      console.error(err);
      setStatusMessage({
        type: 'error',
        text: err.message || 'Lỗi khi xuất bảng tính Google Sheet.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Trigger import flow with confirmation dialog
  const promptImport = () => {
    if (!importUrlOrId.trim()) {
      setStatusMessage({
        type: 'error',
        text: 'Vui lòng nhập ID hoặc Đường dẫn (URL) của bảng tính Google Sheet.',
      });
      return;
    }

    setConfirmState({
      isOpen: true,
      title: 'Cảnh báo đồng bộ & Ghi đè dữ liệu nhân sự',
      message: `Hành động này sẽ tải dữ liệu nhân sự từ Google Sheet và thay thế danh sách nhân sự hiện tại trong ứng dụng (${employees.length} nhân sự).\n\nBạn có chắc chắn muốn cập nhật không?`,
      action: executeImport,
      isDestructive: true,
    });
  };

  const executeImport = async () => {
    setConfirmState((prev) => ({ ...prev, isOpen: false }));
    const token = await getAccessToken();
    if (!token) {
      setStatusMessage({
        type: 'error',
        text: 'Chưa có quyền truy cập Google Sheets. Vui lòng đăng nhập lại.',
      });
      return;
    }

    setIsLoading(true);
    setStatusMessage(null);
    try {
      const res = await importEmployeesFromSpreadsheet(importUrlOrId, token);
      onImportEmployees(res.employees);
      setStatusMessage({
        type: 'success',
        text: `Đồng bộ thành công ${res.employees.length} nhân sự từ trang tính "${res.sheetTitle}"!`,
      });
    } catch (err: any) {
      console.error(err);
      setStatusMessage({
        type: 'error',
        text: err.message || 'Lỗi khi đồng bộ từ Google Sheet.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-200">
        <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
          {/* Header */}
          <div className="p-6 border-b border-slate-800 flex items-center justify-between gap-4 bg-slate-900/90">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
                <FileSpreadsheet size={22} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white tracking-tight">
                  Tích Hợp Google Sheets
                </h3>
                <p className="text-xs text-slate-400">
                  Đồng bộ & quản lý dữ liệu nhân sự trực tiếp với Google Sheets
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700"
            >
              <X size={18} />
            </button>
          </div>

          {/* User Auth Banner */}
          <div className="px-6 py-3.5 bg-slate-950/80 border-b border-slate-800/80 flex items-center justify-between text-xs">
            {currentUser ? (
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2.5">
                  {currentUser.photoURL ? (
                    <img
                      src={currentUser.photoURL}
                      alt="User avatar"
                      className="w-7 h-7 rounded-full border border-slate-700"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold">
                      {currentUser.displayName?.[0] || 'U'}
                    </div>
                  )}
                  <div>
                    <p className="font-semibold text-slate-200">
                      {currentUser.displayName || 'Google User'}
                    </p>
                    <p className="text-[11px] text-slate-400">{currentUser.email}</p>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                >
                  <LogOut size={13} />
                  <span>Đăng xuất</span>
                </button>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 w-full">
                <span className="text-slate-400 text-xs">
                  Cần liên kết tài khoản Google để thao tác với Google Sheets
                </span>
                {/* Official styled Google sign in button as per skill */}
                <button
                  onClick={handleLogin}
                  disabled={isLoggingIn}
                  className="flex items-center justify-center gap-2 bg-white hover:bg-slate-100 text-slate-800 font-semibold px-3 py-1.5 rounded-lg shadow-sm transition-all text-xs cursor-pointer disabled:opacity-50"
                >
                  <svg className="w-4 h-4" viewBox="0 0 48 48">
                    <path
                      fill="#EA4335"
                      d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                    />
                    <path
                      fill="#4285F4"
                      d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                    />
                    <path
                      fill="#34A853"
                      d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                    />
                  </svg>
                  <span>{isLoggingIn ? 'Đang kết nối...' : 'Đăng nhập với Google'}</span>
                </button>
              </div>
            )}
          </div>

          {/* Tabs */}
          <div className="flex border-b border-slate-800 bg-slate-900/60 px-6 pt-3 text-xs sm:text-sm font-semibold">
            <button
              onClick={() => {
                setActiveTab('export');
                setStatusMessage(null);
              }}
              className={`flex items-center gap-2 pb-3 px-3 border-b-2 transition-colors cursor-pointer ${
                activeTab === 'export'
                  ? 'border-emerald-500 text-emerald-400 font-bold'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Download size={16} />
              <span>Xuất sang Google Sheet</span>
            </button>
            <button
              onClick={() => {
                setActiveTab('import');
                setStatusMessage(null);
              }}
              className={`flex items-center gap-2 pb-3 px-3 border-b-2 transition-colors cursor-pointer ${
                activeTab === 'import'
                  ? 'border-emerald-500 text-emerald-400 font-bold'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Upload size={16} />
              <span>Đồng bộ từ Google Sheet</span>
            </button>
          </div>

          {/* Modal Content */}
          <div className="p-6 overflow-y-auto space-y-5">
            {/* Status Alert */}
            {statusMessage && (
              <div
                className={`p-3.5 rounded-2xl flex items-start gap-3 text-xs sm:text-sm border ${
                  statusMessage.type === 'success'
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    : 'bg-red-500/10 border-red-500/30 text-red-300'
                }`}
              >
                {statusMessage.type === 'success' ? (
                  <CheckCircle2 size={18} className="flex-shrink-0 text-emerald-400 mt-0.5" />
                ) : (
                  <AlertCircle size={18} className="flex-shrink-0 text-red-400 mt-0.5" />
                )}
                <div className="flex-1">{statusMessage.text}</div>
              </div>
            )}

            {activeTab === 'export' ? (
              /* Export Tab */
              <div className="space-y-4">
                <div>
                  <label className="block text-slate-400 text-xs font-medium mb-1.5">
                    Tên file Google Sheet sẽ tạo
                  </label>
                  <input
                    type="text"
                    value={sheetTitle}
                    onChange={(e) => setSheetTitle(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-hidden focus:border-emerald-500"
                  />
                </div>

                <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 text-xs space-y-1.5 text-slate-300">
                  <div className="font-semibold text-white">Dữ liệu sẽ được xuất gồm:</div>
                  <ul className="list-disc list-inside space-y-1 text-slate-400">
                    <li>Toàn bộ {employees.length} hồ sơ nhân sự theo từng phòng ban</li>
                    <li>
                      Cột chuẩn: Mã nhân viên (ID/Name), Họ và tên, Phòng ban (Team), Bộ phận (Part), Cấp bậc (z), Chức danh, Quản lý trực tiếp (Manager_ID), v.v.
                    </li>
                    <li>Cố định dòng tiêu đề và tự động phân cột chuẩn</li>
                  </ul>
                </div>

                {exportResult && (
                  <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold text-emerald-400">
                        File Google Sheet đã sẵn sàng:
                      </p>
                      <p className="text-sm font-bold text-white truncate max-w-xs sm:max-w-md">
                        {sheetTitle}
                      </p>
                    </div>
                    <a
                      href={exportResult.spreadsheetUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md transition-colors flex-shrink-0"
                    >
                      <span>Mở Google Sheet</span>
                      <ExternalLink size={14} />
                    </a>
                  </div>
                )}

                <div className="pt-2">
                  <button
                    onClick={promptExport}
                    disabled={isLoading || !currentUser}
                    className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/50 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        <span>Đang xuất dữ liệu sang Google Sheets...</span>
                      </>
                    ) : (
                      <>
                        <Download size={16} />
                        <span>Xuất {employees.length} Nhân Sự Sang Google Sheet</span>
                      </>
                    )}
                  </button>
                  {!currentUser && (
                    <p className="text-center text-xs text-slate-500 mt-2">
                      * Vui lòng đăng nhập với Google ở trên để thực hiện xuất file
                    </p>
                  )}
                </div>
              </div>
            ) : (
              /* Import Tab */
              <div className="space-y-4">
                <div>
                  <label className="block text-slate-400 text-xs font-medium mb-1.5">
                    Đường dẫn (URL) hoặc Spreadsheet ID của Google Sheet
                  </label>
                  <input
                    type="text"
                    value={importUrlOrId}
                    onChange={(e) => setImportUrlOrId(e.target.value)}
                    placeholder="https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-slate-600 focus:outline-hidden focus:border-emerald-500 font-mono"
                  />
                </div>

                <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 text-xs space-y-1.5 text-slate-300">
                  <div className="font-semibold text-white">Yêu cầu định dạng bảng tính:</div>
                  <p className="text-slate-400">
                    Bảng tính cần có dòng tiêu đề chứa các cột tối thiểu: <code>Name</code> (hoặc ID), <code>Team</code>, <code>Part</code>, <code>Position title</code>, <code>Manager_ID</code>.
                  </p>
                  <p className="text-slate-400">
                    Tài khoản Google đang đăng nhập phải có quyền Xem (Viewer) hoặc Chỉnh sửa (Editor) trên file đó.
                  </p>
                </div>

                <div className="pt-2">
                  <button
                    onClick={promptImport}
                    disabled={isLoading || !currentUser || !importUrlOrId.trim()}
                    className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-950/50 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        <span>Đang đọc và đồng bộ dữ liệu...</span>
                      </>
                    ) : (
                      <>
                        <Upload size={16} />
                        <span>Đồng Bộ Dữ Liệu Vào Ứng Dụng</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mandatory User Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={confirmState.isOpen}
        title={confirmState.title}
        message={confirmState.message}
        onConfirm={confirmState.action}
        onCancel={() => setConfirmState((prev) => ({ ...prev, isOpen: false }))}
        isDestructive={confirmState.isDestructive}
      />
    </>
  );
};
